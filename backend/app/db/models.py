"""
CHRONOS-WS Database Base Models & Persistent Entities.
Supports SQLite and PostgreSQL.
Persists:
- Users & RBAC Data
- Immutable System Audit Logs
- Telemetry Logs
- Network State Transitions
- Temporal Predictions
- Attack Paths
- Attacker Objective Hypotheses
- Adaptive Defence Decisions
- Load Balancer Routing Decisions
- Deception Interactions & Decoy Logs
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from datetime import datetime, timezone
from app.db.database import Base


class UserRecord(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="SOC_ANALYST")
    status = Column(String(20), nullable=False, default="ACTIVE")
    last_login = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLogRecord(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(String(50), index=True, default=lambda: datetime.now(timezone.utc).isoformat())
    user = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    action = Column(String(200), nullable=False)
    target = Column(String(100), nullable=False)
    result = Column(String(20), nullable=False, default="SUCCESS")  # SUCCESS, DENIED, FAILED
    ip = Column(String(50), default="127.0.0.1")
    details = Column(Text, nullable=True)


class SystemStatusLog(Base):
    __tablename__ = "system_status_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    service_name = Column(String(100), default="CHRONOS-WS")
    status = Column(String(50), default="OPERATIONAL")
    details = Column(Text, nullable=True)


class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), unique=True, index=True)
    timestamp = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    source_ip = Column(String(50), nullable=True)
    dest_ip = Column(String(50), nullable=True)
    source = Column(String(50), default="network_flows")
    protocol = Column(String(20), default="TCP")
    event_type = Column(String(50), default="FLOW")
    severity = Column(String(20), default="INFO")
    asset_id = Column(String(100), default="edge_firewall_01")
    features_json = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    payload_summary = Column(Text, nullable=True)
    is_decoy = Column(Boolean, default=False)


class NetworkStateRecord(Base):
    __tablename__ = "network_state_logs"

    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(String(50), index=True)
    timestamp = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    time_step = Column(Integer, default=1)
    transition_sequence = Column(Integer, default=1)
    active_threat_level = Column(String(20), default="LOW")
    security_risk = Column(Float, default=0.05)
    asset_risk = Column(Float, default=0.04)
    connection_count = Column(Float, default=100.0)
    cpu_load = Column(Float, default=25.0)
    memory_load = Column(Float, default=35.0)
    authentication_failure_rate = Column(Float, default=0.0)
    metrics_json = Column(Text, nullable=True)


class PredictionRecord(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    model_version = Column(String(50), default="v1.0.0 [Lightweight LSTM]")
    confidence = Column(Float, default=0.85)
    predicted_state_id = Column(String(50))
    predicted_threat_level = Column(String(20), default="LOW")
    predicted_risk = Column(Float, default=0.05)
    predicted_state_json = Column(Text, nullable=True)


class AttackPathRecord(Base):
    __tablename__ = "attack_path_logs"

    id = Column(Integer, primary_key=True, index=True)
    path_id = Column(String(50), index=True)
    timestamp = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    current_stage = Column(String(50))
    predicted_next_stage = Column(String(50))
    confidence = Column(Float, default=0.85)
    risk = Column(String(20), default="LOW")
    graph_json = Column(Text, nullable=True)


class ObjectiveRecord(Base):
    __tablename__ = "objective_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    primary_objective = Column(String(50))
    prob_credentials = Column(Float, default=0.33)
    prob_database = Column(Float, default=0.33)
    prob_admin = Column(Float, default=0.34)
    explanation = Column(Text, nullable=True)


class DefenceDecisionRecord(Base):
    __tablename__ = "defence_decision_logs"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(String(50), index=True)
    timestamp = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    overall_risk = Column(String(20), default="LOW")
    confidence = Column(Float, default=0.85)
    policy_approved = Column(Boolean, default=True)
    actions_json = Column(Text, nullable=True)
    policies_json = Column(Text, nullable=True)


class LoadBalancerDecisionRecord(Base):
    __tablename__ = "load_balancer_decision_logs"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(String(50), index=True)
    timestamp = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    primary_route = Column(String(50), default="Server A (Primary Web)")
    traffic_allocations_json = Column(Text, nullable=True)
    routing_reasons_json = Column(Text, nullable=True)
    risk_penalty_applied = Column(Boolean, default=False)


class DeceptionInteractionRecord(Base):
    __tablename__ = "deception_interaction_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), unique=True, index=True)
    timestamp = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    source_ip = Column(String(50))
    target_decoy = Column(String(100))
    decoy_port = Column(Integer, default=5433)
    protocol = Column(String(20), default="TCP")
    payload_summary = Column(Text)
    severity = Column(String(20), default="HIGH")
