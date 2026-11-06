"""Offline safety checks for storage evidence and production rollback reserves."""

import copy
from datetime import datetime, timezone
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import Mock


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "vercel-capacity.py"
spec = importlib.util.spec_from_file_location("vercel_capacity", SCRIPT)
capacity = importlib.util.module_from_spec(spec)
spec.loader.exec_module(capacity)

PROJECT = "prj_YAMjDOjXM8dSnMlZT2G3iGrQDvxT"
NOW = 1_793_955_600_000
HOUR = 3_600_000
LIMIT = 10_000_000_000


def iso(timestamp):
    return datetime.fromtimestamp(timestamp / 1000, timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def payload(samples):
    return {"results": {
        "times": [iso(timestamp) for timestamp, _ in samples],
        "views": {"total": {"results": [{"dimensionValues": {}, "values": [value for _, value in samples]}]}},
    }}


def deployment(ident, sha, age=1, **changes):
    row = {
        "uid": ident, "id": ident, "projectId": PROJECT,
        "target": "production", "state": "READY", "readyState": "READY",
        "created": NOW - age * HOUR, "createdAt": NOW - age * HOUR,
        "meta": {"githubCommitSha": sha},
    }
    row.update(changes)
    return row


def inventory():
    current = deployment("current", "d" * 40, age=1)
    older = deployment("older", "b" * 40, age=4)
    previous = deployment("previous", "c" * 40, age=2)
    oldest = deployment("oldest", "a" * 40, age=10)
    project = {"id": PROJECT, "targets": {"production": copy.deepcopy(current)}}
    return project, [oldest, current, older, previous]


class StorageEvidenceTests(unittest.TestCase):
    def metric(self, value, **options):
        return capacity.metric_status(value, NOW, **options)

    def test_recent_positive_measurement_is_fresh(self):
        result = self.metric(payload([(NOW - HOUR, 2_000_000_000)]))
        self.assertEqual("fresh", result["status"])
        self.assertEqual(2_000_000_000, result["value_bytes"])
        self.assertAlmostEqual(0.2, result["ratio"])
        self.assertEqual("normal", result["state"])
        self.assertIsNotNone(result["latest_sample"])

    def test_thresholds_include_boundary_values(self):
        for value, state in [(6_999_999_999, "normal"), (7_000_000_000, "warning"), (7_999_999_999, "warning"), (8_000_000_000, "critical"), (11_000_000_000, "critical")]:
            with self.subTest(value=value):
                self.assertEqual(state, self.metric(payload([(NOW - HOUR, value)]))["state"])

    def test_old_value_remains_visible_but_cannot_claim_available_capacity(self):
        result = self.metric(payload([(NOW - 25 * HOUR, 2_000_000_000)]))
        self.assertEqual("stale", result["status"])
        self.assertEqual(2_000_000_000, result["value_bytes"])
        self.assertIsNone(result["ratio"])
        self.assertEqual("unknown", result["state"])

    def test_recent_query_time_does_not_refresh_old_sample(self):
        value = payload([(NOW - 72 * HOUR, 9_000_000_000)])
        value["queriedAt"] = iso(NOW)
        result = self.metric(value)
        self.assertEqual("stale", result["status"])
        self.assertEqual("unknown", result["state"])
        self.assertIsNone(result["ratio"])

    def test_pre_cleanup_sample_cannot_prove_post_cleanup_volume(self):
        result = self.metric(payload([(NOW - HOUR, 1_000_000_000)]), not_before_ms=NOW - HOUR // 2)
        self.assertEqual("stale", result["status"])
        self.assertEqual("unknown", result["state"])

    def test_only_zero_samples_do_not_prove_empty_storage(self):
        result = self.metric(payload([(NOW - HOUR, 0)]))
        self.assertEqual("unavailable", result["status"])
        self.assertIsNone(result["ratio"])
        self.assertEqual("unknown", result["state"])

    def test_trailing_zero_does_not_replace_last_real_measurement(self):
        result = self.metric(payload([(NOW - 30 * HOUR, 8_000_000_000), (NOW - HOUR, 0)]))
        self.assertEqual("stale", result["status"])
        self.assertEqual(8_000_000_000, result["value_bytes"])
        self.assertIsNone(result["ratio"])

    def test_uses_latest_valid_sample_not_largest_value(self):
        result = self.metric(payload([(NOW - 2 * HOUR, 9_000_000_000), (NOW - HOUR, 3_000_000_000)]))
        self.assertEqual(3_000_000_000, result["value_bytes"])
        self.assertEqual("normal", result["state"])

    def test_rejects_future_sample_as_evidence(self):
        result = self.metric(payload([(NOW + HOUR, 1_000_000_000)]))
        self.assertNotEqual("fresh", result["status"])
        self.assertIsNone(result["ratio"])
        self.assertEqual("unknown", result["state"])

    def test_invalid_numeric_values_never_become_fresh_evidence(self):
        for number in (None, -1, float("nan"), float("inf"), float("-inf"), True, "100"):
            with self.subTest(number=number):
                result = self.metric(payload([(NOW - HOUR, number)]))
                self.assertNotEqual("fresh", result["status"])
                self.assertIsNone(result["ratio"])

    def test_multiple_total_rows_are_not_summed_or_guessed(self):
        value = payload([(NOW - HOUR, 2_000_000_000)])
        value["results"]["views"]["total"]["results"].append({"dimensionValues": {}, "values": [3_000_000_000]})
        result = self.metric(value)
        self.assertEqual("unavailable", result["status"])
        self.assertIsNone(result["ratio"])

    def test_dimensioned_row_does_not_masquerade_as_account_total(self):
        value = payload([(NOW - HOUR, 2_000_000_000)])
        value["results"]["views"]["total"]["results"][0]["dimensionValues"] = {"project": "one-project"}
        self.assertEqual("unavailable", self.metric(value)["status"])

    def test_missing_metrics_do_not_imply_zero_usage(self):
        for value in ({}, {"results": {}}, {"results": {"times": [], "views": {"total": {"results": []}}}}):
            with self.subTest(value=value):
                result = self.metric(value)
                self.assertEqual("unavailable", result["status"])
                self.assertIsNone(result["ratio"])
                self.assertEqual("unknown", result["state"])


class ProductionReserveTests(unittest.TestCase):
    def test_current_and_two_latest_distinct_ready_productions_are_protected(self):
        project, rows = inventory()
        result = capacity.protected_versions(project, rows, pinned_prefixes=())
        self.assertEqual({"current", "previous", "older"}, set(result))

    def test_cancelled_and_preview_cannot_replace_real_rollback(self):
        project, rows = inventory()
        rows += [deployment("cancelled", "e" * 40, age=1.2, state="CANCELED", readyState="CANCELED"), deployment("preview", "f" * 40, age=1.3, target=None)]
        result = capacity.protected_versions(project, rows, pinned_prefixes=())
        self.assertEqual({"current", "previous", "older"}, set(result))

    def test_duplicate_sha_does_not_count_as_second_rollback(self):
        project, rows = inventory()
        rows.append(deployment("duplicate-previous", "c" * 40, age=3))
        result = capacity.protected_versions(project, rows, pinned_prefixes=())
        self.assertEqual({"current", "previous", "duplicate-previous", "older"}, set(result))

    def test_duplicate_current_sha_is_protected_without_counting_as_rollback(self):
        project, rows = inventory()
        rows.append(deployment("duplicate-current", "d" * 40, age=1.5))
        result = capacity.protected_versions(project, rows, pinned_prefixes=())
        self.assertEqual({"current", "duplicate-current", "previous", "older"}, set(result))

    def test_explicit_historical_pins_are_protected(self):
        project, rows = inventory()
        for index, prefix in enumerate(("a4878b9", "2f526c5", "ac643b5")):
            rows.append(deployment("pin-" + prefix, prefix + "0" * 33, age=100 + index))
        result = capacity.protected_versions(project, rows)
        self.assertTrue({"current", "previous", "older", "pin-a4878b9", "pin-2f526c5", "pin-ac643b5"} <= set(result))

    def test_missing_current_production_aborts(self):
        project, rows = inventory()
        project["targets"] = {}
        with self.assertRaises(ValueError):
            capacity.protected_versions(project, rows)

    def test_nonready_current_production_aborts(self):
        project, rows = inventory()
        project["targets"]["production"]["readyState"] = "BUILDING"
        with self.assertRaises(ValueError):
            capacity.protected_versions(project, rows)

    def test_other_project_aborts(self):
        project, rows = inventory()
        project["id"] = "prj_unrelated"
        with self.assertRaises(ValueError):
            capacity.protected_versions(project, rows)

    def test_current_deployment_cannot_belong_to_another_project(self):
        project, rows = inventory()
        next(row for row in rows if row["uid"] == "current")["projectId"] = "prj_unrelated"
        with self.assertRaises(ValueError):
            capacity.protected_versions(project, rows)

    def test_current_deployment_must_be_ready_in_inventory_too(self):
        project, rows = inventory()
        current = next(row for row in rows if row["uid"] == "current")
        current.update(state="CANCELED", readyState="CANCELED")
        with self.assertRaises(ValueError):
            capacity.protected_versions(project, rows)

    def test_less_than_two_distinct_previous_shas_aborts(self):
        project, rows = inventory()
        rows = [row for row in rows if row["uid"] in ("current", "previous")]
        rows.append(deployment("duplicate", "c" * 40, age=3))
        with self.assertRaises(ValueError):
            capacity.protected_versions(project, rows)

    def test_foreign_project_cannot_supply_missing_rollback(self):
        project, rows = inventory()
        rows = [row for row in rows if row["uid"] in ("current", "previous")]
        rows.append(deployment("foreign", "e" * 40, age=3, projectId="prj_unrelated"))
        with self.assertRaises(ValueError):
            capacity.protected_versions(project, rows)

    def test_inputs_are_not_mutated(self):
        project, rows = inventory()
        original = copy.deepcopy((project, rows))
        capacity.protected_versions(project, rows)
        self.assertEqual(original, (project, rows))


class ReadOnlyAPITests(unittest.TestCase):
    def setUp(self):
        self.api = capacity.API.__new__(capacity.API)
        self.api.token = "offline-test-placeholder"
        self.api.opener = Mock()
        self.api.opener.open.side_effect = lambda *args, **kwargs: io.BytesIO(json.dumps({"ok": True}).encode())

    def test_inventory_request_uses_get(self):
        self.api.call("/v9/projects/" + PROJECT)
        request = self.api.opener.open.call_args.args[0]
        self.assertEqual("GET", request.get_method())
        self.assertIsNone(request.data)
        self.assertTrue(request.full_url.startswith("https://api.vercel.com/"))

    def test_only_read_only_metrics_query_may_post(self):
        self.api.call("/v1/usage-metrics/query", {"metric": "deployment_storage_size"})
        request = self.api.opener.open.call_args.args[0]
        self.assertEqual("POST", request.get_method())
        self.assertEqual("deployment_storage_size", json.loads(request.data)["metric"])

    def test_post_to_mutating_endpoints_is_rejected_before_network(self):
        for path in ("/v13/deployments", "/v9/projects/" + PROJECT, "/v1/usage-metrics/query/", "/v1/usage-metrics/query?other=path"):
            with self.subTest(path=path), self.assertRaises(ValueError):
                self.api.call(path, {"name": "unexpected change"})
        self.api.opener.open.assert_not_called()

    def test_delete_and_patch_methods_are_not_exposed(self):
        for method in ("DELETE", "PATCH", "PUT"):
            with self.subTest(method=method), self.assertRaises(TypeError):
                self.api.call("/v13/deployments/important", method=method)
        self.api.opener.open.assert_not_called()

    def test_redirect_is_refused(self):
        with self.assertRaises(ValueError):
            capacity.NoRedirect().redirect_request(None, None, 302, "Found", {}, "https://other.example/")

    def test_inventory_without_pagination_completion_is_not_accepted(self):
        self.api.call = Mock(return_value={"deployments": []})
        with self.assertRaises(ValueError):
            self.api.pages("/v6/deployments?limit=100", "deployments")

    def test_looping_pagination_is_not_accepted(self):
        self.api.call = Mock(return_value={"deployments": [], "pagination": {"next": 100}})
        with self.assertRaises(ValueError):
            self.api.pages("/v6/deployments?limit=100", "deployments")


if __name__ == "__main__":
    unittest.main()
