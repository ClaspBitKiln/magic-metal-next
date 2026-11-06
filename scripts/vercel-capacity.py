#!/usr/bin/env python3
"""Read-only Vercel capacity report. Never deletes, deploys, or changes settings."""
import argparse
from datetime import datetime, timezone, timedelta
import json
import math
import os
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.request

EXPECTED_PROJECT = 'prj_YAMjDOjXM8dSnMlZT2G3iGrQDvxT'
TEAM = 'team_CkROi6Pu8pbAXAcmZlpb17K8'
METRICS = ('deployment_storage_size', 'deployment_lambda_storage_size')


def timestamp(value):
    if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value):
        return value
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
            return dt.timestamp() * 1000 if dt.tzinfo else None
        except ValueError:
            pass
    return None


def metric_status(payload, now_ms, limit_bytes=10_000_000_000, not_before_ms=0, max_age_hours=24):
    if limit_bytes <= 0:
        raise ValueError('Limit must be positive')
    result = dict(status='unavailable', value_bytes=None, latest_sample=None, ratio=None, state='unknown')
    raw = payload.get('results', {})
    rows = raw.get('views', {}).get('total', {}).get('results', [])
    times = raw.get('times', [])
    if len(rows) != 1 or rows[0].get('dimensionValues', {}) != {} or len(rows[0].get('values', [])) != len(times):
        return result
    samples = []
    for when, value in zip(times, rows[0]['values']):
        ms = timestamp(when)
        if (ms is not None and ms <= now_ms and isinstance(value, (int, float))
                and not isinstance(value, bool) and math.isfinite(value) and value > 0):
            samples.append((ms, when, value))
    if not samples:
        return result
    ms, when, value = max(samples)
    result.update(value_bytes=value, latest_sample=when, status='stale')
    if ms >= not_before_ms and now_ms - ms <= max_age_hours * 3600000:
        ratio = value / limit_bytes
        result.update(status='fresh', ratio=ratio,
                      state='critical' if ratio >= .8 else 'warning' if ratio >= .7 else 'normal')
    return result


def protected_versions(project, deployments, pinned_prefixes=('a4878b9', '2f526c5', 'ac643b5')):
    if project.get('id') != EXPECTED_PROJECT:
        raise ValueError('Unexpected project')
    current = project.get('targets', {}).get('production', {})
    cid = current.get('id')
    sha = current.get('meta', {}).get('githubCommitSha')
    if not cid or not sha or current.get('readyState') != 'READY':
        raise ValueError('Current production not confirmed READY')
    valid = [d for d in deployments if d.get('projectId') == EXPECTED_PROJECT
             and (d.get('readyState') or d.get('state')) == 'READY'
             and d.get('meta', {}).get('githubCommitSha')]
    match = [d for d in valid if (d.get('uid') or d.get('id')) == cid
             and d['meta']['githubCommitSha'] == sha]
    if not match:
        raise ValueError('Current production absent from inventory')
    previous = sorted([d for d in valid if d.get('target') == 'production'
                       and (timestamp(d.get('createdAt', d.get('created'))) or 0) > 0],
                      key=lambda d: timestamp(d.get('createdAt', d.get('created'))), reverse=True)
    shas = {sha}
    for d in previous:
        shas.add(d['meta']['githubCommitSha'])
        if len(shas) >= 3:
            break
    if len(shas) < 3:
        raise ValueError('Two distinct READY production rollbacks are required')
    out = {}
    for d in deployments:
        ident = d.get('uid') or d.get('id')
        s = d.get('meta', {}).get('githubCommitSha', '')
        if ident == cid:
            out[ident] = 'current-production'
        elif s in shas:
            out[ident] = 'ready-production-rollback-sha'
        elif s.startswith(pinned_prefixes):
            out[ident] = 'explicitly-pinned-sha'
    return out


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError('API redirect refused')


class API:
    def __init__(self):
        self.token = os.environ['VERCEL_TOKEN']
        self.opener = urllib.request.build_opener(NoRedirect())

    def call(self, path, body=None):
        # POST is permitted solely for the read-only metrics query.
        if body is not None and path != '/v1/usage-metrics/query':
            raise ValueError('Unsupported operation')
        req = urllib.request.Request('https://api.vercel.com' + path + ('&' if '?' in path else '?') + 'teamId=' + TEAM,
                                     data=json.dumps(body).encode() if body is not None else None,
                                     headers={'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json'})
        with self.opener.open(req, timeout=35) as response:
            return json.load(response)

    def pages(self, path, key):
        out, seen = [], set()
        for _ in range(200):
            data = self.call(path)
            if not isinstance(data.get(key), list) or 'next' not in data.get('pagination', {}):
                raise ValueError('Incomplete inventory')
            out.extend(data[key])
            cursor = data['pagination']['next']
            if cursor is None:
                return out
            if cursor in seen:
                raise ValueError('Repeated pagination')
            seen.add(cursor)
            path = re.sub(r'&until=[^&]*', '', path) + '&until=' + str(cursor)
        raise ValueError('Inventory exceeds page limit')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--state', type=Path, default=Path(__file__).resolve().parent.parent / 'docs/operations/vercel-capacity-state.json')
    args = parser.parse_args()
    api = API()
    now = datetime.now(timezone.utc)
    iso = lambda d: d.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    project = api.call('/v9/projects/' + EXPECTED_PROJECT)
    deployments = api.pages('/v6/deployments?projectId=' + EXPECTED_PROJECT + '&limit=100', 'deployments')
    aliases = api.pages('/v4/aliases?projectId=' + EXPECTED_PROJECT + '&limit=100', 'aliases')
    protected = protected_versions(project, deployments)
    current = project['targets']['production']
    current_sha = current['meta']['githubCommitSha']
    not_before = timestamp(current.get('createdAt', current.get('created')))
    if not_before is None:
        raise ValueError('Current production creation date missing')
    state = json.loads(args.state.read_text())
    cleanup_at = timestamp(state.get('last_cleanup_verified_at'))
    if cleanup_at is None or cleanup_at > now.timestamp()*1000:
        raise ValueError('Last verified cleanup timestamp invalid')
    not_before = max(not_before, cleanup_at)
    metrics = {}
    for metric in METRICS:
        payload = api.call('/v1/usage-metrics/query', {'metric': metric, 'from': iso(now - timedelta(days=3)),
                         'to': iso(now), 'format': 'timeseries', 'granularity': {'unit': 'hour', 'step': 1},
                         'views': {'total': {'groupBy': []}}})
        metrics[metric] = metric_status(payload, now.timestamp()*1000, not_before_ms=not_before)
    bound = set()
    for a in aliases:
        ident = a.get('deploymentId') or (a.get('deployment') or {}).get('id')
        if not ident:
            raise ValueError('Unresolved alias')
        bound.add(ident)
    potential = []
    for d in deployments:
        ident = d['uid']
        sha = d.get('meta', {}).get('githubCommitSha', '')
        created = timestamp(d.get('createdAt', d.get('created')))
        if (ident in protected or ident in bound or d.get('projectId') != EXPECTED_PROJECT
                or (d.get('readyState') or d.get('state')) != 'READY' or created is None
                or now.timestamp()*1000 - created < 86400000 or not re.fullmatch('[a-fA-F0-9]{40}', sha)):
            continue
        ancestry = subprocess.run(['git', 'merge-base', '--is-ancestor', sha, current_sha], capture_output=True)
        if ancestry.returncode == 0:
            potential.append({'id': ident, 'sha': sha})
    fresh = all(x['status'] == 'fresh' for x in metrics.values())
    needs_cleanup = fresh and any(x['ratio'] >= .7 for x in metrics.values())
    report = {'queried_at': iso(now), 'read_only': True, 'deployment_count': len(deployments),
              'metrics_not_before': datetime.fromtimestamp(not_before/1000, timezone.utc).isoformat(), 'production_id': current['id'], 'production_sha': current_sha, 'protected': protected,
              'metrics': metrics, 'decision': 'metrics_pending' if not fresh else 'cleanup_review' if needs_cleanup else 'within_budget',
              'potential_unaliased_merged_versions': potential, 'automatic_deletion_enabled': False}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False))
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a') as f:
            f.write('Vercel capacity: **' + report['decision'] + '**. Read-only; no deployments deleted.\n')


if __name__ == '__main__':
    try:
        main()
    except (KeyError, ValueError, OSError) as error:
        # Avoid logging headers, credential values, or remote response bodies.
        print('Capacity report stopped:', type(error).__name__)
        raise SystemExit(1) from None
