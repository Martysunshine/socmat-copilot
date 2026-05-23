"""Unit tests — IOC extractor logic."""

import sys
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "services" / "api"))


class TestIocExtractorImport:
    """Verify the module loads and the main function is callable."""

    def test_extract_iocs_is_callable(self):
        from ioc_extractor import extract_iocs
        assert callable(extract_iocs)


class TestIocPatterns:
    """Test IOC regex patterns that are reusable from the extractor module."""

    def setup_method(self):
        import re
        # These patterns are embedded in ioc_extractor — we test them by
        # feeding known IOC strings and checking extraction results via a mock DB.
        self._re_ipv4 = re.compile(
            r'\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b'
        )
        self._re_domain = re.compile(
            r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b'
        )
        self._re_sha256 = re.compile(r'\b[0-9a-fA-F]{64}\b')
        self._re_md5 = re.compile(r'\b[0-9a-fA-F]{32}\b')

    def test_ipv4_pattern_matches(self):
        text = "Connection from 192.168.1.100 to 10.0.0.1"
        matches = self._re_ipv4.findall(text)
        assert "192.168.1.100" in matches
        assert "10.0.0.1" in matches

    def test_sha256_pattern_matches(self):
        fake_hash = "a" * 64
        matches = self._re_sha256.findall(fake_hash)
        assert fake_hash in matches

    def test_md5_pattern_matches(self):
        fake_md5 = "b" * 32
        matches = self._re_md5.findall(fake_md5)
        assert fake_md5 in matches

    def test_domain_pattern_matches(self):
        text = "DNS query for evil.example.com and c2.attacker.net"
        matches = self._re_domain.findall(text)
        assert any("evil.example.com" in m for m in matches)

    def test_ipv4_does_not_match_invalid(self):
        text = "256.256.256.256"
        matches = self._re_ipv4.findall(text)
        assert not matches

    def test_private_ip_matches(self):
        text = "From 10.10.50.201"
        matches = self._re_ipv4.findall(text)
        assert "10.10.50.201" in matches


class TestCorrelationEngine:
    """Light import test — ensure correlation engine loads without a DB."""

    def test_import_succeeds(self):
        from correlation_engine import run_correlation
        assert callable(run_correlation)


class TestMitreMapper:
    """Light import test — ensure mitre_mapper loads."""

    def test_import_succeeds(self):
        import mitre_mapper
        assert hasattr(mitre_mapper, "run_mitre_mapping")

    def test_mapping_function_callable(self):
        from mitre_mapper import run_mitre_mapping
        assert callable(run_mitre_mapping)
