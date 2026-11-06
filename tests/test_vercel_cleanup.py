"""No network and no credentials: realistic paginated API fixtures."""
import copy
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError

spec = importlib.util.spec_from_file_location('cleanup', Path(__file__).parents[1] / 'scripts/vercel_cleanup.py')
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
NOW = 1_794_000_000_000


def deployment(uid, *, age=30, target=None, state='READY', sha='a' * 40):
    return {'uid': uid, 'projectId': 'prj_example', 'createdAt': NOW-age*c.DAY,
            'target': target, 'readyState': state, 'meta': {'githubCommitSha': sha}}


def snapshot():
    return {'project': {'id': 'prj_example', 'accountId': 'team_example', 'name': c.PROJECT,
                        'targets': {'production': {'id': 'dpl_current'}}},
            'deployments': [deployment('dpl_current', age=2, target='production', sha='2f526c5'+'a'*33),
                            deployment('dpl_rollback', age=3, target='production', sha='ac643b5'+'a'*33),
                            deployment('dpl_oldprod', age=40, target='production'),
                            deployment('dpl_oldpreview', age=50),
                            deployment('dpl_alias', age=60),
                            deployment('dpl_recent', age=0),
                            deployment('dpl_building', state='BUILDING')],
            'aliases': [{'projectId': 'prj_example', 'deploymentId': 'dpl_alias', 'alias': 'preview.example.invalid'}]}


class FakeApi:
    def __init__(self, data=None):
        self.data = copy.deepcopy(data or snapshot())
        self.calls = []
        self.detail_override = None
        self.delete_error = None

    def call(self, method, path, **query):
        self.calls.append((method, path, query))
        if path.startswith('/v9/projects/'):
            return copy.deepcopy(self.data['project'])
        if path in ('/v7/deployments', '/v4/aliases'):
            key = 'deployments' if path == '/v7/deployments' else 'aliases'
            rows = self.data[key]
            if 'until' not in query and len(rows) > 2:
                return {key: copy.deepcopy(rows[:2]), 'pagination': {'next': 123}}
            return {key: copy.deepcopy(rows[2:] if 'until' in query else rows), 'pagination': {'next': None}}
        did = path.rsplit('/', 1)[-1]
        if method == 'GET':
            d = copy.deepcopy(next(d for d in self.data['deployments'] if c.deploy_id(d) == did))
            if self.detail_override:
                d.update(self.detail_override)
            return d
        if method == 'DELETE':
            if self.delete_error:
                raise self.delete_error
            self.data['deployments'] = [d for d in self.data['deployments'] if c.deploy_id(d) != did]
            return {'id': did, 'state': 'DELETED'}
        raise AssertionError('Unexpected API call')

    def deletes(self):
        return [x for x in self.calls if x[0] == 'DELETE']


class CleanupTests(unittest.TestCase):
    def setUp(self):
        self.clock = patch.object(c.time, 'time', return_value=NOW/1000)
        self.clock.start()
        self.addCleanup(self.clock.stop)
        self.api = FakeApi()
        self.plan = c.make_plan(c.inventory(self.api), now=NOW)
        self.events = []

    def apply(self, plan=None):
        return c.apply_plan(self.api, plan or self.plan, confirm=c.PROJECT, journal=self.events.append, now=NOW)

    def test_plan_reads_all_pages_and_does_not_delete(self):
        self.assertEqual([x['id'] for x in self.plan['candidates']], ['dpl_oldpreview'])
        self.assertFalse(self.api.deletes())
        self.assertTrue(any(x[2].get('until') == 123 for x in self.api.calls))

    def test_apply_deletes_only_reviewed_preview_and_records_intent(self):
        self.apply()
        self.assertEqual(len(self.api.deletes()), 1)
        self.assertEqual(self.api.deletes()[0][1], '/v13/deployments/dpl_oldpreview')
        self.assertEqual([x['status'] for x in self.events], ['delete-requested', 'api-delete-accepted'])

    def test_production_history_requires_opt_in_but_keeps_rollback(self):
        plan = c.make_plan(self.api.data, include_production=True, now=NOW)
        self.assertEqual({x['id'] for x in plan['candidates']}, {'dpl_oldpreview', 'dpl_oldprod'})
        self.apply(plan)
        self.assertEqual({x['uid'] for x in self.api.data['deployments'] if x['target'] == 'production'}, {'dpl_current', 'dpl_rollback'})

    def test_pinned_versions_remain_when_not_latest_two(self):
        self.api.data['deployments'] += [deployment('dpl_new1', age=1, target='production'), deployment('dpl_new2', age=0, target='production')]
        candidates, _ = c.eligible(self.api.data, include_production=True, now=NOW)
        self.assertNotIn('dpl_rollback', {x['id'] for x in candidates})

    def test_promotion_after_plan_stops_delete(self):
        self.api.data['project']['targets']['production']['id'] = 'dpl_oldpreview'
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertFalse(self.api.deletes())

    def test_alias_added_after_plan_stops_delete(self):
        self.api.data['aliases'].append({'deploymentId': 'dpl_oldpreview', 'projectId': 'prj_example'})
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertFalse(self.api.deletes())

    def test_detail_alias_is_checked_before_delete(self):
        self.api.detail_override = {'alias': ['live.example.invalid']}
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertFalse(self.api.deletes())

    def test_detail_target_change_stops_delete(self):
        self.api.detail_override = {'target': 'production'}
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertFalse(self.api.deletes())

    def test_other_project_stops_delete(self):
        self.api.detail_override = {'projectId': 'prj_other'}
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertFalse(self.api.deletes())

    def test_account_changed_prevents_delete(self):
        self.api.data['project']['accountId'] = 'team_other'
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertFalse(self.api.deletes())

    def test_edited_plan_cannot_delete_current_production(self):
        self.plan['candidates'] = [{'id': 'dpl_current'}]
        self.plan['policy']['include_production'] = True
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertFalse(self.api.deletes())

    def test_detail_building_state_prevents_delete(self):
        self.api.detail_override = {'readyState': 'BUILDING'}
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertFalse(self.api.deletes())

    def test_stale_plan_stops_without_requests(self):
        self.plan['createdAt'] -= 31*60_000
        self.api.calls.clear()
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertFalse(self.api.calls)

    def test_wrong_confirmation_stops_without_requests(self):
        self.api.calls.clear()
        with self.assertRaises(c.CleanupError): c.apply_plan(self.api, self.plan, confirm='other', journal=self.events.append)
        self.assertFalse(self.api.calls)

    def test_replay_stops_no_second_delete(self):
        self.apply()
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertEqual(len(self.api.deletes()), 1)

    def test_delete_error_not_retried(self):
        self.api.delete_error = c.CleanupError('HTTP 429')
        with self.assertRaises(c.CleanupError): self.apply()
        self.assertEqual(len(self.api.deletes()), 1)
        self.assertEqual([x['status'] for x in self.events], ['delete-requested'])

    def test_journal_failure_prevents_delete(self):
        def fail(_): raise OSError('disk full')
        with self.assertRaises(OSError): c.apply_plan(self.api, self.plan, confirm=c.PROJECT, journal=fail)
        self.assertFalse(self.api.deletes())

    def test_new_alias_before_second_delete_is_respected(self):
        plan = c.make_plan(self.api.data, include_production=True, now=NOW)
        def journal(event):
            if event['status'] == 'api-delete-accepted':
                self.api.data['aliases'].append({'deploymentId': 'dpl_oldprod', 'projectId': 'prj_example'})
        with self.assertRaises(c.CleanupError): c.apply_plan(self.api, plan, confirm=c.PROJECT, journal=journal)
        self.assertEqual(len(self.api.deletes()), 1)

    def test_unknown_current_production_prevents_plan(self):
        del self.api.data['project']['targets']
        with self.assertRaises(c.CleanupError): c.make_plan(self.api.data)

    def test_missing_second_production_prevents_plan(self):
        self.api.data['deployments'] = [x for x in self.api.data['deployments'] if x['target'] != 'production' or x['uid'] == 'dpl_current']
        with self.assertRaises(c.CleanupError): c.make_plan(self.api.data)

    def test_unknown_environment_preserved(self):
        for target in ('staging', 'canary'):
            self.api.data['deployments'].append(deployment('dpl_'+target, target=target))
        d = deployment('dpl_missing'); del d['target']; self.api.data['deployments'].append(d)
        self.assertEqual([x['id'] for x in c.make_plan(self.api.data)['candidates']], ['dpl_oldpreview'])

    def test_incomplete_or_repeated_pagination_prevents_inventory(self):
        for body in ({'deployments': []}, {'deployments': [], 'pagination': {}}, {'deployments': [], 'pagination': {'next': 123}}):
            with self.subTest(body=body), patch.object(self.api, 'call', return_value=body):
                with self.assertRaises(c.CleanupError): c.pages(self.api, '/v7/deployments', 'deployments')

    def test_duplicate_inventory_prevents_cleanup(self):
        self.api.data['deployments'].append(copy.deepcopy(self.api.data['deployments'][0]))
        with self.assertRaises(c.CleanupError): c.inventory(self.api)

    def test_bounded_oldest_first_batch(self):
        plan = c.make_plan(self.api.data, include_production=True, limit=1)
        self.assertEqual([x['id'] for x in plan['candidates']], ['dpl_oldpreview'])
        self.assertEqual(plan['eligibleCount'], 2)

    def test_missing_token_prevents_api(self):
        with self.assertRaises(c.CleanupError): c.Api('')

    def test_http_failure_contains_no_secret_or_response_body(self):
        api = c.Api('secret-do-not-log')
        for status in (401, 403, 429, 500):
            with patch.object(api.opener, 'open', side_effect=HTTPError('https://api.vercel.com', status, 'secret-do-not-log', {}, io.BytesIO(b'secret-do-not-log'))) as opener:
                with self.assertRaises(c.CleanupError) as exc: api.call('DELETE', '/v13/deployments/dpl_example')
                self.assertNotIn('secret', str(exc.exception))
                self.assertEqual(opener.call_count, 1)

    def test_no_credential_redirect(self):
        with self.assertRaises(c.CleanupError): c.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://elsewhere.invalid')

    def test_transport_uses_fixed_host_team_and_auth(self):
        api = c.Api('secret-do-not-log')
        response = unittest.mock.MagicMock()
        response.__enter__.return_value.read.return_value = b'{}'
        with patch.object(api.opener, 'open', return_value=response) as opener:
            api.call('GET', '/v9/projects/magic-metal-next')
        req = opener.call_args.args[0]
        self.assertEqual(req.full_url, 'https://api.vercel.com/v9/projects/magic-metal-next?slug=claspbitkiln')
        self.assertEqual(req.headers['Authorization'], 'Bearer secret-do-not-log')


if __name__ == '__main__': unittest.main()
