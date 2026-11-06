"""Offline safety tests for the destructive Vercel cleanup planner."""

import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "vercel-cleanup.py"
spec = importlib.util.spec_from_file_location("vercel_cleanup", SCRIPT)
cleanup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cleanup)

NOW = 100 * 86_400_000
PROJECT = "prj_YAMjDOjXM8dSnMlZT2G3iGrQDvxT"


def deployment(uid="old", **changes):
    value = {
        "uid": uid,
        "projectId": PROJECT,
        "target": None,
        "state": "READY",
        "created": NOW - 3 * 86_400_000,
        "meta": {"githubCommitSha": "f" * 40},
    }
    value.update(changes)
    return value


class CleanupSafetyTests(unittest.TestCase):
    def classify(self, deployments, aliases=None, **options):
        return cleanup.classify(
            deployments, aliases or [], "current", NOW,
            **({"keep_latest": 0} | options),
        )

    def assert_kept(self, value, aliases=None, **options):
        result = self.classify([value], aliases, **options)
        self.assertEqual([], result["delete"])
        self.assertIn(value["uid"], result["keep"])

    def test_old_unaliased_preview_is_candidate(self):
        item = deployment()
        self.assertEqual([item], self.classify([item])["delete"])

    def test_old_canceled_deployment_without_sha_is_candidate(self):
        item = deployment(state="CANCELED", meta={})
        self.assertEqual([item], self.classify([item])["delete"])

    def test_current_production_is_kept_without_alias(self):
        self.assert_kept(deployment("current", target="production"))

    def test_explicit_production_and_rollback_shas_are_kept(self):
        for prefix in ("2f526c5", "ac643b5"):
            with self.subTest(prefix=prefix):
                self.assert_kept(deployment(meta={"githubCommitSha": prefix + "0" * 33}))

    def test_alias_deployment_id_is_kept(self):
        self.assert_kept(deployment(), [{"deploymentId": "old", "alias": "example.com"}])

    def test_nested_alias_deployment_id_is_kept(self):
        self.assert_kept(deployment(), [{"deployment": {"id": "old"}, "alias": "preview.vercel.app"}])

    def test_unknown_alias_assignment_aborts_instead_of_guessing(self):
        for alias in ({"alias": "example.com"}, {"deploymentId": None}, {"deployment": {}}):
            with self.subTest(alias=alias), self.assertRaises(ValueError):
                self.classify([deployment()], [alias])

    def test_latest_ten_are_kept_even_when_input_is_unsorted(self):
        items = [deployment(str(i), created=NOW - (i + 2) * 86_400_000) for i in range(12)]
        result = self.classify(list(reversed(items)), keep_latest=10)
        self.assertEqual({str(i) for i in range(10)}, set(result["keep"]))
        self.assertEqual({"10", "11"}, {x["uid"] for x in result["delete"]})

    def test_recent_publication_is_kept(self):
        self.assert_kept(deployment(created=NOW - 23 * 3_600_000))

    def test_future_publication_is_kept(self):
        self.assert_kept(deployment(created=NOW + 86_400_000))

    def test_running_and_unknown_states_are_kept(self):
        for state in ("BUILDING", "QUEUED", "INITIALIZING", "UNKNOWN", None):
            with self.subTest(state=state):
                self.assert_kept(deployment(state=state))

    def test_foreign_project_is_kept(self):
        self.assert_kept(deployment(projectId="prj_other"))

    def test_missing_project_is_kept(self):
        item = deployment()
        del item["projectId"]
        self.assert_kept(item)

    def test_missing_or_malformed_created_is_kept(self):
        for created in (None, "invalid", {}, [], float("nan"), float("inf"), float("-inf"), True):
            with self.subTest(created=created):
                self.assert_kept(deployment(created=created))

    def test_missing_created_is_kept(self):
        item = deployment()
        del item["created"]
        self.assert_kept(item)

    def test_ready_without_sha_is_kept(self):
        self.assert_kept(deployment(meta={}))

    def test_inputs_are_not_mutated(self):
        items = [deployment()]
        aliases = [{"deploymentId": "another"}]
        original = copy.deepcopy((items, aliases))
        self.classify(items, aliases)
        self.assertEqual(original, (items, aliases))


class CleanupExecutionGuards(unittest.TestCase):
    def test_pages_reads_every_page(self):
        api = cleanup.API.__new__(cleanup.API)
        responses = iter([
            {"aliases": [{"deploymentId": "one"}], "pagination": {"next": 123}},
            {"aliases": [{"deploymentId": "two"}], "pagination": {"next": None}},
        ])
        paths = []

        def call(path):
            paths.append(path)
            return next(responses)

        api.call = call
        self.assertEqual(2, len(api.pages("/aliases?limit=100", "aliases")))
        self.assertEqual("/aliases?limit=100&until=123", paths[-1])

    def test_repeated_page_cursor_aborts(self):
        api = cleanup.API.__new__(cleanup.API)
        api.call = lambda path: {"aliases": [], "pagination": {"next": 123}}
        with self.assertRaises(ValueError):
            api.pages("/aliases?limit=100", "aliases")

    def test_dry_run_never_calls_delete(self):
        self.run_fake_cleanup(execute=False)

    def test_alias_added_after_plan_prevents_delete(self):
        report = self.run_fake_cleanup(execute=True)
        self.assertEqual(0, len(report["deleted"]))
        self.assertEqual("alias-at-recheck", report["skipped"][0]["reason"])

    def test_historical_promoted_metadata_is_not_a_live_alias(self):
        report = self.run_fake_cleanup(execute=True, live_alias=False)
        self.assertEqual(1, len(report["deleted"]))
        self.assertEqual("obsolete", report["deleted"][0]["id"])
        self.assertTrue(report["protected_ready"])
        self.assertTrue(report["aliases_unchanged"])

    def test_approved_plan_never_expands_to_new_candidates(self):
        report = self.run_fake_cleanup(execute=True, live_alias=False, approved_id="different")
        self.assertEqual([], report["deleted"])
        self.assertEqual("outside-approved-plan", report["keep"]["obsolete"])

    def test_approved_id_requires_matching_sha(self):
        report = self.run_fake_cleanup(execute=True, live_alias=False, approved_id="obsolete", approved_sha="different")
        self.assertEqual([], report["deleted"])

    def run_fake_cleanup(self, execute, live_alias=True, approved_id=None, approved_sha=None):
        prod = deployment("current", target="production", meta={"githubCommitSha": "2f526c5" + "0" * 33})
        rollback = deployment("rollback", target="production", meta={"githubCommitSha": "ac643b5" + "0" * 33})
        candidate = deployment("obsolete", created=NOW - 30 * 86_400_000)
        newest = [deployment("recent" + str(i), created=NOW - 2 * 86_400_000 + i) for i in range(10)]
        inventory = [prod, rollback, candidate] + newest

        class FakeAPI:
            deleted = False

            def project(self):
                return {"targets": {"production": {
                    "id": "current", "meta": prod["meta"],
                    "alias": ["magicmet.ru", "www.magicmet.ru"],
                }}}

            def inventory(self):
                return [item for item in inventory if not (self.deleted and item["uid"] == "obsolete")], []

            def detail(self, ident):
                if self.deleted and ident == "obsolete":
                    raise urllib.error.HTTPError("https://api.vercel.com", 404, "Not found", {}, None)
                item = next(item for item in inventory if item["uid"] == ident)
                return item | {"id": ident, "readyState": "READY", "alias": ["magicmet.ru"], "readySubstate": "PROMOTED"}

            def call(self, path, method="GET"):
                if method != "GET":
                    if execute and not live_alias and method == "DELETE" and path.startswith("/v13/deployments/obsolete?"):
                        self.deleted = True
                        return {"uid": "obsolete", "state": "DELETED"}
                    raise AssertionError("Cleanup unexpectedly attempted mutation")
                if path.startswith("/v2/deployments/obsolete/aliases?"):
                    return {"aliases": [{"alias": "newly-added.vercel.app"}] if live_alias else []}
                raise AssertionError("Unexpected request: " + path)

        with tempfile.TemporaryDirectory() as tmp:
            report_path = Path(tmp) / "report.json"
            args = [str(SCRIPT), "--report", str(report_path)] + (["--execute"] if execute else [])
            if approved_id is not None:
                approved_path = Path(tmp) / "approved.json"
                approved_path.write_text(json.dumps({"project": cleanup.EXPECTED_PROJECT, "team": cleanup.TEAM, "delete": [{"id": approved_id, "sha": approved_sha}]}))
                args += ["--approved-plan", str(approved_path)]
            with patch.object(cleanup, "API", FakeAPI), patch("sys.argv", args), patch.object(cleanup.time, "time", return_value=NOW / 1000), patch("builtins.print"):
                cleanup.main()
            report = json.loads(report_path.read_text())
            self.assertEqual(1 if approved_id is None else 0, report["planned"])
            if not execute or live_alias:
                self.assertEqual([], report["deleted"])
            return report


if __name__ == "__main__":
    unittest.main()
