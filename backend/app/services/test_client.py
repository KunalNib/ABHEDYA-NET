"""
CHRONOS-WS Controlled Test Client for Live Testbed Demonstration.
Generates safe, non-destructive, strictly local application traffic to exercise the live defence pipeline:
- Benign user operations
- Controlled port & endpoint reconnaissance
- Safe authentication verification probes (non-destructive spray)
- Decoy honeypot interactions (trapped on isolated VLAN 99 / port 5433)

Guarantees: Zero credential theft, zero destructive actions, zero external network traffic.
"""

import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.models.schemas import TelemetryEvent
from app.services.telemetry_pipeline import telemetry_pipeline
from app.services.telemetry_adapters import telemetry_collector

logger = logging.getLogger("CHRONOS-WS.TestClient")


class ControlledTestClient:
    """
    Controlled traffic generator and attacker simulator for live demonstrations.
    Produces safe, auditable local events that stimulate every stage of the testbed.
    """
    def __init__(self, attacker_ip: str = "192.168.99.150"):
        self.attacker_ip = attacker_ip
        self.benign_ips = ["192.168.1.101", "192.168.1.102", "192.168.1.105"]
        self.step_counter = 0

    def generate_benign_traffic(self) -> List[TelemetryEvent]:
        """Generates normal operational user traffic across Web, API, and Database services."""
        now_str = datetime.now(timezone.utc).isoformat()
        events = []

        # 1. Benign Web Flow
        events.append(telemetry_collector.zeek.normalize({
            "source_ip": self.benign_ips[self.step_counter % len(self.benign_ips)],
            "dest_ip": "10.0.1.10",
            "dest_port": 80,
            "protocol": "HTTP",
            "bytes_in": 1200,
            "bytes_out": 4500,
            "duration": 0.08,
            "asset_id": "web_server_01"
        }))

        # 2. Benign Auth Token Check
        events.append(telemetry_collector.auth.normalize({
            "client_ip": self.benign_ips[0],
            "user": "operator@defence.local",
            "success": True,
            "failed_count": 0,
            "asset_id": "auth_service_01"
        }))

        # 3. Benign Database Query
        events.append(TelemetryEvent(
            event_id=f"EVT-DB-{int(datetime.now(timezone.utc).timestamp()*1000)}",
            timestamp=now_str,
            source="database_events",
            event_type="DB_SELECT_QUERY",
            asset_id="database_01",
            severity="INFO",
            features={"query_rate": 5.0, "latency_ms": 3.2},
            metadata={"query": "SELECT asset_status FROM assets WHERE active = true;", "user": "app_backend"},
            source_ip="10.0.1.10",
            dest_ip="10.0.2.50",
            dest_port=5432,
            protocol="PostgreSQL",
            payload_summary="Normal application query to production database"
        ))

        for evt in events:
            telemetry_pipeline.ingest_telemetry(evt)
        return events

    def generate_recon_probes(self) -> List[TelemetryEvent]:
        """Simulates safe, non-destructive network port and service discovery probes."""
        now_str = datetime.now(timezone.utc).isoformat()
        events = []

        # Suricata detects port scan probe
        events.append(telemetry_collector.suricata.normalize({
            "src_ip": self.attacker_ip,
            "dest_ip": "10.0.1.10",
            "dest_port": 80,
            "proto": "TCP",
            "signature": "ET SCAN Suspicious Rapid SYN Port Sweep Across Subnet",
            "alert": {"signature_id": 2000101, "severity": 3, "category": "Network Reconnaissance"}
        }))

        # Zeek logs rapid half-open TCP connections
        events.append(telemetry_collector.zeek.normalize({
            "source_ip": self.attacker_ip,
            "dest_ip": "10.0.1.12",
            "dest_port": 443,
            "protocol": "TCP",
            "bytes_in": 64,
            "bytes_out": 0,
            "duration": 0.01,
            "asset_id": "api_gateway_01"
        }))

        for evt in events:
            telemetry_pipeline.ingest_telemetry(evt)
        return events

    def generate_credential_spray(self) -> List[TelemetryEvent]:
        """Simulates controlled authentication failures (password spray on Auth Service)."""
        events = []
        users_tested = ["root", "admin", "service_account", "deployer"]

        for user in users_tested:
            evt = telemetry_collector.auth.normalize({
                "client_ip": self.attacker_ip,
                "user": user,
                "success": False,
                "failed_count": 6,
                "asset_id": "auth_service_01"
            })
            events.append(evt)
            telemetry_pipeline.ingest_telemetry(evt)

        # Suricata alert for brute-force pattern
        suricata_evt = telemetry_collector.suricata.normalize({
            "src_ip": self.attacker_ip,
            "dest_ip": "10.0.0.13",
            "dest_port": 443,
            "proto": "HTTPS",
            "signature": "ET SCAN Multiple Failed Logins From External Host",
            "alert": {"signature_id": 2000205, "severity": 2, "category": "Credential Access Attempt"}
        })

        events.append(suricata_evt)
        telemetry_pipeline.ingest_telemetry(suricata_evt)

        return events

    def generate_decoy_interaction(self, decoy_type: str = "database") -> TelemetryEvent:
        """
        Simulates threat actor diverted into isolated VLAN 99 decoy honeypot.
        Generates immediate high-fidelity feedback telemetry.
        """
        now_str = datetime.now(timezone.utc).isoformat()
        if decoy_type == "database":
            evt = TelemetryEvent(
                event_id=f"EVT-DECOY-DB-{int(datetime.now(timezone.utc).timestamp()*1000)}",
                timestamp=now_str,
                source="database_events",
                event_type="DECOY_HONEYPOT_ACCESS",
                asset_id="decoy_db_01",
                severity="CRITICAL",
                features={"unauthorized_query": 1, "vlan": 99, "threat_trapped": 1},
                metadata={
                    "decoy": "Adaptive PostgreSQL Decoy (Port 5433)",
                    "attacker_ip": self.attacker_ip,
                    "query": "SELECT * FROM synthetic_customer_pii LIMIT 100;",
                    "isolation_status": "VLAN 99 ISOLATED - ZERO PATH TO PRODUCTION"
                },
                source_ip=self.attacker_ip,
                dest_ip="10.0.99.50",
                dest_port=5433,
                protocol="PostgreSQL-Decoy",
                payload_summary=f"Attacker {self.attacker_ip} captured attempting exfiltration on Decoy Database (Port 5433)",
                is_decoy_interaction=True
            )
        else:
            evt = TelemetryEvent(
                event_id=f"EVT-DECOY-API-{int(datetime.now(timezone.utc).timestamp()*1000)}",
                timestamp=now_str,
                source="application_api_logs",
                event_type="DECOY_HONEYPOT_ACCESS",
                asset_id="decoy_api_01",
                severity="CRITICAL",
                features={"unauthorized_api_call": 1, "vlan": 99, "threat_trapped": 1},
                metadata={
                    "decoy": "Adaptive Decoy Admin API (Port 8082)",
                    "attacker_ip": self.attacker_ip,
                    "endpoint": "/api/v2/admin/export-keys",
                    "isolation_status": "VLAN 99 ISOLATED - SYNTHETIC RESPONSE RETURNED"
                },
                source_ip=self.attacker_ip,
                dest_ip="10.0.99.82",
                dest_port=8082,
                protocol="HTTP-Decoy",
                payload_summary=f"Attacker {self.attacker_ip} trapped on Decoy Admin API (Port 8082)",
                is_decoy_interaction=True
            )

        telemetry_pipeline.ingest_telemetry(evt)
        return evt


controlled_test_client = ControlledTestClient()
