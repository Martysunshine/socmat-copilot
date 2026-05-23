"""Unit tests — playbook template seed data."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "services" / "api"))

from playbook_seeds import PLAYBOOK_SEEDS


class TestPlaybookSeeds:
    def test_exactly_ten_templates(self):
        assert len(PLAYBOOK_SEEDS) == 10

    def test_all_have_required_fields(self):
        required = {"name", "description", "alert_type", "severity", "steps"}
        for pb in PLAYBOOK_SEEDS:
            missing = required - pb.keys()
            assert not missing, f"Playbook '{pb.get('name')}' missing: {missing}"

    def test_all_have_steps(self):
        for pb in PLAYBOOK_SEEDS:
            assert len(pb["steps"]) >= 8, (
                f"Playbook '{pb['name']}' has only {len(pb['steps'])} steps (min 8)"
            )

    def test_steps_have_order_title_description(self):
        for pb in PLAYBOOK_SEEDS:
            for step in pb["steps"]:
                assert "order" in step, f"Step missing 'order' in {pb['name']}"
                assert "title" in step, f"Step missing 'title' in {pb['name']}"
                assert "description" in step, f"Step missing 'description' in {pb['name']}"

    def test_step_orders_are_sequential(self):
        for pb in PLAYBOOK_SEEDS:
            orders = [s["order"] for s in pb["steps"]]
            assert orders == list(range(1, len(orders) + 1)), (
                f"Playbook '{pb['name']}' step orders not sequential: {orders}"
            )

    def test_severities_are_valid(self):
        valid = {"low", "medium", "high", "critical"}
        for pb in PLAYBOOK_SEEDS:
            assert pb["severity"] in valid, (
                f"Playbook '{pb['name']}' has invalid severity: {pb['severity']}"
            )

    def test_alert_types_unique(self):
        alert_types = [pb["alert_type"] for pb in PLAYBOOK_SEEDS]
        assert len(alert_types) == len(set(alert_types)), "Duplicate alert_types in PLAYBOOK_SEEDS"

    def test_brute_force_template_exists(self):
        names = [pb["alert_type"] for pb in PLAYBOOK_SEEDS]
        assert "brute_force" in names

    def test_generic_template_exists(self):
        names = [pb["alert_type"] for pb in PLAYBOOK_SEEDS]
        assert "generic" in names

    def test_no_empty_descriptions(self):
        for pb in PLAYBOOK_SEEDS:
            for step in pb["steps"]:
                assert step["description"].strip(), (
                    f"Empty description in '{pb['name']}' step {step['order']}"
                )
