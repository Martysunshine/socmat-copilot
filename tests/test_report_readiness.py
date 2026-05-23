"""Unit tests — report readiness score engine."""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "services" / "api"))

import report_readiness


class TestGrade:
    def test_excellent_at_90(self):
        assert report_readiness._grade(90) == "excellent"

    def test_excellent_at_100(self):
        assert report_readiness._grade(100) == "excellent"

    def test_good_at_70(self):
        assert report_readiness._grade(70) == "good"

    def test_good_at_89(self):
        assert report_readiness._grade(89) == "good"

    def test_fair_at_50(self):
        assert report_readiness._grade(50) == "fair"

    def test_fair_at_69(self):
        assert report_readiness._grade(69) == "fair"

    def test_poor_at_0(self):
        assert report_readiness._grade(0) == "poor"

    def test_poor_at_49(self):
        assert report_readiness._grade(49) == "poor"


class TestCheckFactory:
    def test_pass_check(self):
        c = report_readiness._check("id1", "section1", "Name", "Desc", 5, False, True)
        assert c["status"] == "pass"
        assert c["weight"] == 5
        assert c["id"] == "id1"

    def test_fail_check(self):
        c = report_readiness._check("id2", "section1", "Name", "Desc", 5, False, False)
        assert c["status"] == "fail"

    def test_na_check(self):
        c = report_readiness._check("id3", "section1", "Name", "Desc", 5, False, False, na=True)
        assert c["status"] == "na"

    def test_optional_flag(self):
        c = report_readiness._check("id4", "section1", "Name", "Desc", 3, True, False)
        assert c["optional"] is True


class TestSectionLabels:
    def test_ten_sections(self):
        assert len(report_readiness._SECTION_LABELS) == 10

    def test_all_values_are_strings(self):
        for k, v in report_readiness._SECTION_LABELS.items():
            assert isinstance(v, str), f"Section {k} label is not a string"


class TestComputeReadiness:
    def _mock_db(self):
        """Return a mock DB session that simulates a minimal case."""
        db = MagicMock()
        # case query returns a mock case
        mock_case = MagicMock()
        mock_case.title = "Test Case"
        mock_case.description = "A description"
        mock_case.severity = "high"
        mock_case.status = "investigating"
        mock_case.affected_host = "PC1"
        mock_case.affected_user = None
        mock_case.affected_ip = None

        # query chain: db.query(Case).filter(...).first() returns mock_case
        query_mock = MagicMock()
        query_mock.filter.return_value.first.return_value = mock_case
        query_mock.filter.return_value.count.return_value = 0
        query_mock.count.return_value = 0
        db.query.return_value = query_mock

        return db

    def test_returns_dict_with_required_keys(self):
        db = self._mock_db()
        result = report_readiness.compute_readiness(db, 1)
        required_keys = {
            "case_id", "total_score", "grade", "completed_checks",
            "missing_checks", "na_checks", "warnings", "recommendations",
            "section_scores", "checked_at",
        }
        assert required_keys.issubset(result.keys())

    def test_score_is_between_0_and_100(self):
        db = self._mock_db()
        result = report_readiness.compute_readiness(db, 1)
        assert 0 <= result["total_score"] <= 100

    def test_grade_is_valid(self):
        db = self._mock_db()
        result = report_readiness.compute_readiness(db, 1)
        assert result["grade"] in ("poor", "fair", "good", "excellent")

    def test_case_id_matches(self):
        db = self._mock_db()
        result = report_readiness.compute_readiness(db, 42)
        assert result["case_id"] == 42

    def test_section_scores_has_ten_sections(self):
        db = self._mock_db()
        result = report_readiness.compute_readiness(db, 1)
        assert len(result["section_scores"]) == 10

    def test_all_checks_accounted_for(self):
        db = self._mock_db()
        result = report_readiness.compute_readiness(db, 1)
        total = (
            len(result["completed_checks"])
            + len(result["missing_checks"])
            + len(result["na_checks"])
        )
        assert total == 22, f"Expected 22 checks total, got {total}"

    def test_empty_case_has_poor_grade(self):
        db = self._mock_db()
        result = report_readiness.compute_readiness(db, 1)
        # Case with only title/description/severity/status/host — most checks fail
        assert result["grade"] in ("poor", "fair")
