#!/usr/bin/env python3
"""Bounded Vercel cleanup. Default: inventory/plan only; no third-party packages."""
import argparse
import json
import os
from pathlib import Path
import re
import ssl
import sys
import time
from urllib import error, parse, request

TEAM = 'claspbitkiln'
PROJECT = 'magic-metal-next'
PINNED_SHA = ('2f526c5', 'ac643b5')
DAY = 86_400_000


class CleanupError(Exception):
    pass


def require(ok, message):
    if not ok:
        raise CleanupError(message)


class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise CleanupError('API redirect refused; credentials were not forwarded.')


class Api:
    def __init__(self, token):
        require(bool(token), 'VERCEL_TOKEN is not configured. No requests or changes made.')
        self.token = token
        # Standard urllib proxy handling; retain configured trust and verify TLS.
        ca = os.environ.get('SSL_CERT_FILE') or os.environ.get('REQUESTS_CA_BUNDLE')
        self.opener = request.build_opener(NoRedirect(), request.HTTPSHandler(context=ssl.create_default_context(cafile=ca)))

    def call(self, method, path, **query):
        require(method in ('GET', 'DELETE') and path.startswith('/v'), 'Unsupported API operation.')
        query['slug'] = TEAM
        url = 'https://api.vercel.com' + path + '?' + parse.urlencode(query)
        req = request.Request(url, method=method, headers={'Authorization': 'Bearer ' + self.token, 'Accept': 'application/json'})
        try:
            with self.opener.open(req, timeout=30) as response:
                data = response.read()
                return json.loads(data) if data else {}
        except error.HTTPError as exc:
            # Do not log response bodies, headers, URLs or tokens. Never retry DELETE.
            raise CleanupError(f'Vercel HTTP {exc.code}; stopped without automatic retry.') from None
        except (error.URLError, TimeoutError, OSError, ValueError):
            raise CleanupError('API unavailable or invalid JSON; stopped. Inspect account state before retrying deletion.') from None


def pages(api, path, key, **query):
    rows, seen = [], set()
    for _ in range(200):
        data = api.call('GET', path, limit=100, **query)
        require(isinstance(data.get(key), list) and isinstance(data.get('pagination'), dict), 'Incomplete paginated inventory; refusing cleanup.')
        rows.extend(data[key])
        pagination = data['pagination']
        require('next' in pagination, 'Missing pagination cursor; refusing cleanup.')
        cursor = pagination['next']
        if cursor is None:
            return rows
        require(isinstance(cursor, (int, float)) and cursor not in seen, 'Invalid/repeated pagination cursor.')
        seen.add(cursor)
        query['until'] = cursor
    raise CleanupError('Inventory exceeds page limit; refusing partial cleanup.')


def deploy_id(d):
    value = d.get('uid') or d.get('id')
    require(isinstance(value, str) and re.fullmatch(r'dpl_[A-Za-z0-9]+', value), 'Invalid deployment ID.')
    return value


def stamp(d):
    value = d.get('createdAt', d.get('created'))
    require(isinstance(value, (int, float)) and value > 0, 'Missing deployment timestamp.')
    return value


def inventory(api):
    project = api.call('GET', '/v9/projects/' + PROJECT)
    require(project.get('name') == PROJECT and str(project.get('id', '')).startswith('prj_'), 'Wrong project; refusing cleanup.')
    require(str(project.get('accountId', '')).startswith('team_'), 'Expected a team-owned project.')
    pid = project['id']
    deployments = pages(api, '/v7/deployments', 'deployments', projectId=pid)
    aliases = pages(api, '/v4/aliases', 'aliases', projectId=pid)
    require(all(d.get('projectId') == pid for d in deployments), 'Deployment from another project.')
    require(all(a.get('projectId') == pid for a in aliases), 'Alias from another project or unknown project.')
    ids = [deploy_id(d) for d in deployments]
    require(len(ids) == len(set(ids)), 'Duplicate deployment IDs; inventory changed during pagination.')
    return {'project': project, 'deployments': deployments, 'aliases': aliases}


def eligible(snapshot, *, min_days=7, include_production=False, now=None):
    now = now if now is not None else int(time.time() * 1000)
    require(isinstance(min_days, int) and 1 <= min_days <= 3650, 'Minimum age must be 1..3650 days.')
    project, deployments = snapshot['project'], snapshot['deployments']
    targets = project.get('targets')
    require(isinstance(targets, dict) and isinstance(targets.get('production'), dict), 'Current production is unknown; refusing cleanup.')
    protected = {deploy_id(d) for d in targets.values() if d}
    ids = {deploy_id(d) for d in deployments}
    require(protected <= ids, 'Current target missing from complete inventory.')
    for a in snapshot['aliases']:
        aid = a.get('deploymentId') or (a.get('deployment') or {}).get('id')
        require(aid or a.get('redirect'), 'Unresolved active alias; refusing cleanup.')
        if aid:
            protected.add(aid)
    production = sorted((d for d in deployments if d.get('target') == 'production' and d.get('readyState', d.get('state')) == 'READY'), key=stamp, reverse=True)
    require(len(production) >= 2, 'Two ready production versions are required before cleanup.')
    protected.update(deploy_id(d) for d in production[:2])
    candidates, preserved = [], []
    for d in sorted(deployments, key=stamp):
        did = deploy_id(d)
        sha = (d.get('meta') or {}).get('githubCommitSha', '')
        state = d.get('readyState', d.get('state'))
        target = d.get('target')
        reason = None
        if did in protected or any(sha.startswith(s) for s in PINNED_SHA):
            reason = 'current, rollback, pinned SHA or active alias'
        elif 'target' not in d or target not in (None, 'preview', 'production') or d.get('customEnvironment'):
            reason = 'unknown/custom environment'
        elif target == 'production' and not include_production:
            reason = 'production history retained by default'
        elif state not in ('READY', 'ERROR', 'CANCELED'):
            reason = 'active or unknown deployment state'
        elif now - stamp(d) < min_days * DAY:
            reason = 'recent deployment'
        item = {'id': did, 'createdAt': stamp(d), 'target': target, 'sha': sha, 'state': state}
        if reason:
            preserved.append({'id': did, 'reason': reason})
        else:
            candidates.append(item)
    return candidates, preserved


def make_plan(snapshot, *, min_days=7, include_production=False, limit=10, now=None):
    now = now if now is not None else int(time.time() * 1000)
    require(isinstance(limit, int) and 1 <= limit <= 20, 'Batch limit must be 1..20.')
    candidates, kept = eligible(snapshot, min_days=min_days, include_production=include_production, now=now)
    return {'version': 1, 'team': TEAM, 'project': PROJECT, 'projectId': snapshot['project']['id'], 'accountId': snapshot['project']['accountId'], 'createdAt': now,
            'policy': {'min_days': min_days, 'include_production': include_production, 'limit': limit},
            'candidates': candidates[:limit], 'eligibleCount': len(candidates), 'preserved': kept}


def apply_plan(api, plan, *, confirm, journal, now=None):
    now = now if now is not None else int(time.time() * 1000)
    require(confirm == PROJECT, 'Exact --confirm-project is required for deletion.')
    require(plan.get('version') == 1 and plan.get('team') == TEAM and plan.get('project') == PROJECT, 'Wrong plan scope.')
    require(isinstance(plan.get('createdAt'), (int, float)) and 0 <= now - plan['createdAt'] <= 30 * 60_000, 'Plan expired: create a fresh inventory (30 minute limit).')
    policy = plan.get('policy', {})
    require(type(policy.get('include_production')) is bool, 'Invalid production policy.')
    candidates = plan.get('candidates')
    require(isinstance(candidates, list) and isinstance(policy.get('limit'), int) and 1 <= policy['limit'] <= 20 and len(candidates) <= policy['limit'], 'Invalid batch size.')
    require(len({deploy_id(d) for d in candidates}) == len(candidates), 'Duplicate candidate IDs.')
    result = []
    for candidate in candidates:
        # Refresh ALL protections for every item; no blind batch DELETE.
        snapshot = inventory(api)
        require(snapshot['project']['id'] == plan['projectId'] and snapshot['project']['accountId'] == plan['accountId'], 'Project/account changed.')
        safe, _ = eligible(snapshot, min_days=policy['min_days'], include_production=policy['include_production'])
        safe_ids = {d['id'] for d in safe}
        did = deploy_id(candidate)
        require(did in safe_ids, 'Candidate became protected or is missing; stopped before deletion.')
        detail = api.call('GET', '/v13/deployments/' + did)
        require(deploy_id(detail) == did and detail.get('projectId') == plan['projectId'], 'Deployment identity changed.')
        require(not detail.get('alias') and not detail.get('customEnvironment'), 'Deployment now has aliases or custom environment.')
        # Re-run eligibility on the latest detail, including target and timestamp.
        snapshot['deployments'] = [detail if deploy_id(d) == did else d for d in snapshot['deployments']]
        require(did in {d['id'] for d in eligible(snapshot, min_days=policy['min_days'], include_production=policy['include_production'])[0]}, 'Deployment changed before deletion.')
        event = {'id': did, 'status': 'delete-requested', 'at': int(time.time() * 1000)}
        journal(event)  # Persist intent before the destructive request; write failure stops execution.
        api.call('DELETE', '/v13/deployments/' + did)
        event = {'id': did, 'status': 'api-delete-accepted', 'at': int(time.time() * 1000)}
        journal(event)
        result.append(event)
    return result


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('mode', choices=['plan', 'apply'])
    p.add_argument('--plan', default='vercel-cleanup-plan.json')
    p.add_argument('--min-days', type=int, default=7)
    p.add_argument('--limit', type=int, default=10)
    p.add_argument('--include-old-production', action='store_true')
    p.add_argument('--confirm-project')
    p.add_argument('--journal', default='vercel-cleanup-journal.jsonl')
    args = p.parse_args(argv)
    api = Api(os.environ.get('VERCEL_TOKEN'))
    if args.mode == 'plan':
        plan = make_plan(inventory(api), min_days=args.min_days, include_production=args.include_old_production, limit=args.limit)
        Path(args.plan).write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f"Plan only: {len(plan['candidates'])} selected / {plan['eligibleCount']} eligible; {len(plan['preserved'])} protected. No deletions.")
    else:
        plan = json.loads(Path(args.plan).read_text(encoding='utf-8'))
        def journal(event):
            with open(args.journal, 'a', encoding='utf-8') as f:
                f.write(json.dumps(event) + '\n')
                f.flush()
                os.fsync(f.fileno())
        result = apply_plan(api, plan, confirm=args.confirm_project, journal=journal)
        print(f"Vercel accepted {len(result)} deletions. Storage/CDN quota has NOT been verified or reset by this tool.")


if __name__ == '__main__':
    try:
        main()
    except (CleanupError, OSError, ValueError, KeyError, TypeError) as exc:
        print(str(exc) if isinstance(exc, CleanupError) else 'Invalid local plan or file operation; stopped.', file=sys.stderr)
        sys.exit(1)
