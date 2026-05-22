# PCAP Sample Data

This directory is for PCAP / PCAPNG test files.

Binary PCAP files are not committed to the repository. Use one of the sources below to obtain safe sample captures for testing.

## Recommended Sample PCAP Sources

| Source | Description |
|--------|-------------|
| [Wireshark Sample Captures](https://wiki.wireshark.org/SampleCaptures) | Large library of reference PCAP files |
| [Malware Traffic Analysis](https://www.malware-traffic-analysis.net/) | Redacted PCAP exercises (malware traffic, educational) |
| [PacketLife.net](https://packetlife.net/captures/) | Protocol-specific sample captures |
| [NETRESEC PCAP samples](https://www.netresec.com/?page=PcapFiles) | Various network scenarios |

## Generating a Test PCAP (Linux/macOS)

```bash
# 30-second capture on loopback — safe for local testing
sudo tcpdump -i lo -w test.pcap -G 30 -W 1

# Or from a lab network interface
sudo tcpdump -i eth0 -w lab-capture.pcap -c 10000
```

## What SOC Copilot Extracts

| Feature | Description |
|---------|-------------|
| Top Talkers | Hosts sorted by bytes sent |
| Protocol Distribution | TCP / UDP / ICMP / IPv6 packet counts |
| DNS Queries | Queried domains and query types |
| HTTP Requests | Method, host, URI, User-Agent |
| TLS / SNI | Server Name Indication from TLS ClientHello |
| Beaconing | Regular check-in intervals to the same destination |
| DGA Candidates | High-entropy domain names in DNS |
| Port Scans | Hosts contacting many distinct destination ports |
| Large Transfers | Hosts sending > 10 MB (exfiltration candidates) |
| Cleartext Credentials | HTTP Basic Auth over unencrypted connections |
| Suspicious Ports | Traffic on C2-associated ports (4444, 9001, 31337, etc.) |

## Safety Notes

- PCAP analysis is **static-only** — files are read but never executed.
- Analysis is bounded at 100,000 packets per file.
- Only IPv4 traffic is deeply parsed in the current implementation.
- Upload size limit: 50 MB (enforced by the API at upload time).
