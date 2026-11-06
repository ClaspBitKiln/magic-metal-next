#!/usr/bin/env python3
"""Delete only old unaliased deployments in the explicitly authorized project.
Defaults to plan only. Reads VERCEL_TOKEN from the environment; never prints it.
"""
import argparse
import json
import math
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

EXPECTED_PROJECT = 'prj_YAMjDOjXM8dSnMlZT2G3iGrQDvxT'
TEAM = 'team_CkROi6Pu8pbAXAcmZlpb17K8'
PROTECTED_SHA_PREFIXES = ('2f526c5', 'ac643b5')


def alias_ids(aliases):
    ids = set()
    for alias in aliases:
        ident = alias.get('deploymentId') or (alias.get('deployment') or {}).get('id')
        if not ident:
            raise ValueError('Alias without deployment identity: refuse cleanup')
        ids.add(ident)
    return ids


def classify(deployments, aliases, production_id, now_ms, keep_latest=10, min_age_hours=24):
    if not production_id:
        raise ValueError('Production identity required')
    bound = alias_ids(aliases)
    def created(d):
        value = d.get('created', d.get('createdAt'))
        return value if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) else float('inf')
    newest = {d['uid'] for d in sorted(deployments, key=created, reverse=True)[:keep_latest]}
    keep, delete = {}, []
    for d in deployments:
        ident = d['uid']
        sha = d.get('meta', {}).get('githubCommitSha', '')
        state = d.get('state') or d.get('readyState')
        reason = None
        if d.get('projectId') != EXPECTED_PROJECT:
            reason = 'other-or-unknown-project'
        elif ident == production_id:
            reason = 'current-production'
        elif sha.startswith(PROTECTED_SHA_PREFIXES):
            reason = 'explicit-protected-sha'
        elif ident in bound:
            reason = 'active-alias'
        elif ident in newest:
            reason = 'newest-deployments'
        elif state not in ('READY', 'CANCELED', 'ERROR'):
            reason = 'unfinished-or-unknown-state'
        elif state == 'READY' and not sha:
            reason = 'unknown-sha'
        elif created(d) <= 0 or created(d) > now_ms - min_age_hours * 3600000:
            reason = 'recent-or-unknown-date'
        if reason:
            keep[ident] = reason
        else:
            delete.append(d)
    return {'delete': sorted(delete, key=created), 'keep': keep}


class API:
    def __init__(self):
        self.token = os.environ['VERCEL_TOKEN']

    def call(self, path, method='GET'):
        for attempt in range(5):
            req = urllib.request.Request('https://api.vercel.com' + path, method=method,
                                         headers={'Authorization': 'Bearer ' + self.token})
            try:
                with urllib.request.urlopen(req, timeout=40) as response:
                    body = response.read()
                    return json.loads(body) if body else {}
            except urllib.error.HTTPError as error:
                if error.code != 429 or attempt == 4:
                    raise
                time.sleep(min(int(error.headers.get('Retry-After', '5')), 30))
        raise RuntimeError('Retry limit reached')

    def pages(self, path, key):
        result, seen, cursor = [], set(), None
        while True:
            response = self.call(path + ('&until=' + str(cursor) if cursor else ''))
            result.extend(response[key])
            cursor = response.get('pagination', {}).get('next')
            if not cursor:
                return result
            if cursor in seen:
                raise ValueError('Pagination repeated; inventory incomplete')
            seen.add(cursor)

    def project(self):
        return self.call('/v9/projects/' + EXPECTED_PROJECT + '?teamId=' + TEAM)

    def detail(self, ident):
        return self.call('/v13/deployments/' + ident + '?teamId=' + TEAM)

    def inventory(self):
        ds = self.pages('/v6/deployments?projectId=' + EXPECTED_PROJECT + '&teamId=' + TEAM + '&limit=100', 'deployments')
        aliases = self.pages('/v4/aliases?projectId=' + EXPECTED_PROJECT + '&teamId=' + TEAM + '&limit=100', 'aliases')
        return ds, aliases


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--report', required=True, type=Path)
    parser.add_argument('--approved-plan', type=Path, help='Restrict execution to IDs and SHAs in the approved plan')
    args = parser.parse_args()
    api = API()
    project = api.project()
    production = project['targets']['production']
    prod_id = production['id']
    if not production['meta']['githubCommitSha'].startswith('2f526c5'):
        raise ValueError('Unexpected current production; review required')
    required_domains = {'magicmet.ru', 'www.magicmet.ru'}
    if not required_domains <= set(production['alias']):
        raise ValueError('Production domains differ')
    ds, aliases = api.inventory()
    rollback_ids = [d['uid'] for d in ds if d.get('meta', {}).get('githubCommitSha', '').startswith('ac643b5')]
    if not rollback_ids:
        raise ValueError('Rollback not found')
    for ident in [prod_id] + rollback_ids:
        if api.detail(ident)['readyState'] != 'READY':
            raise ValueError('Protected deployment not READY')
    plan = classify(ds, aliases, prod_id, time.time() * 1000)
    approved_path = getattr(args, 'approved_plan', None)
    if approved_path:
        approved = json.loads(approved_path.read_text())
        if approved.get('project') != EXPECTED_PROJECT or approved.get('team') != TEAM:
            raise ValueError('Approved plan scope differs')
        allowed = {d['id']: d.get('sha') for d in approved['delete']}
        excluded = [d for d in plan['delete'] if d['uid'] not in allowed or allowed[d['uid']] != d.get('meta', {}).get('githubCommitSha')]
        plan['keep'].update({d['uid']: 'outside-approved-plan' for d in excluded})
        plan['delete'] = [d for d in plan['delete'] if d['uid'] not in {x['uid'] for x in excluded}]
    report = {'before': len(ds), 'planned': len(plan['delete']), 'keep': plan['keep'],
              'production': prod_id, 'rollback': rollback_ids, 'deleted': [], 'skipped': [],
              'complete': False}
    def save():
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + '\n')
    save()
    print(json.dumps({'before':len(ds), 'planned':len(plan['delete']), 'retained':len(plan['keep']), 'execute':args.execute}), flush=True)
    if not args.execute:
        return
    # A fixed plan is the maximum scope; later inventories can only remove candidates.
    current_ds, current_aliases = ds, aliases
    for index, candidate in enumerate(plan['delete']):
        ident = candidate['uid']
        if index % 20 == 0:
            current_ds, current_aliases = api.inventory()
        project_now = api.project()
        prod_now = project_now['targets']['production']
        if prod_now['id'] != prod_id or not required_domains <= set(prod_now.get('alias', [])):
            raise ValueError('Production changed; stop immediately')
        eligible = {d['uid'] for d in classify(current_ds, current_aliases, prod_id, time.time()*1000)['delete']}
        if ident not in eligible:
            report['skipped'].append({'id':ident, 'reason':'no-longer-eligible'}); save(); continue
        detail = api.detail(ident)
        if detail.get('id') != ident or detail.get('projectId') != EXPECTED_PROJECT:
            raise ValueError('Deployment identity mismatch')
        if detail.get('meta', {}).get('githubCommitSha') != candidate.get('meta', {}).get('githubCommitSha'):
            raise ValueError('Commit mismatch')
        if (detail.get('readyState') not in ('READY','ERROR','CANCELED')
                or (detail.get('meta',{}).get('githubCommitSha') or '').startswith(PROTECTED_SHA_PREFIXES)):
            report['skipped'].append({'id':ident,'reason':'protected-at-recheck'}); save(); continue
        fresh_aliases = api.call('/v2/deployments/' + ident + '/aliases?teamId=' + TEAM)['aliases']
        if fresh_aliases:
            report['skipped'].append({'id':ident, 'reason':'alias-at-recheck'}); save(); continue
        result = api.call('/v13/deployments/' + ident + '?teamId=' + TEAM, 'DELETE')
        if result.get('uid') != ident or result.get('state') != 'DELETED':
            raise ValueError('Unexpected deletion result')
        try:
            api.detail(ident)
        except urllib.error.HTTPError as error:
            if error.code not in (404,410):
                raise
        else:
            raise ValueError('Deleted deployment still present')
        report['deleted'].append({'id':ident, 'sha':candidate.get('meta',{}).get('githubCommitSha'), 'state_before':candidate.get('state')})
        save()
        if len(report['deleted']) % 20 == 0:
            print('Deleted',len(report['deleted']),flush=True)
    after_ds, after_aliases = api.inventory()
    retained = {d['uid'] for d in after_ds}
    # Confirm every initially protected version and alias still exists unchanged.
    if not set(plan['keep']) <= retained:
        raise ValueError('Protected deployment missing after cleanup')
    before_alias_map = {a['alias']:a.get('deploymentId') or (a.get('deployment') or {}).get('id') for a in aliases}
    after_alias_map = {a['alias']:a.get('deploymentId') or (a.get('deployment') or {}).get('id') for a in after_aliases}
    if any(after_alias_map.get(k) != v for k,v in before_alias_map.items()):
        raise ValueError('Alias mapping changed')
    for ident in [prod_id] + rollback_ids:
        if api.detail(ident)['readyState'] != 'READY':
            raise ValueError('Protected deployment no longer READY')
    if api.project()['targets']['production']['id'] != prod_id:
        raise ValueError('Production changed')
    report.update(after=len(after_ds), complete=True, protected_ready=True, aliases_unchanged=True)
    save()
    print(json.dumps({k:report[k] for k in ['before','after','complete','protected_ready','aliases_unchanged']} | {'deleted':len(report['deleted']),'skipped':len(report['skipped'])}),flush=True)


if __name__ == '__main__':
    main()
