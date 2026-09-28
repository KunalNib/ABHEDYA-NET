"""
Canonical Pydantic Schemas for AI-Driven Adaptive Cyber Deception & Attack-Path Prediction Platform.
Strictly typing all data structures: NetworkState S_t, Telemetry, Predictions, Objectives, Defense Decisions.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

# ============================================================
# 1. CANONICAL NETWORK STATE (S_t)
# ============================================================
class NetworkState(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    time_step: int = 0
    state_id: str = "S1"                # S1, S2, S3, S4, ...
    window_size_sec: int = 10
    transition_sequence: int = 1
    active_threat_level: str = "LOW"    # LOW, ELEVATED, HIGH, CRITICAL
    
    # Network Traffic Features
    connection_count: float = 0.0
    bytes_in: float = 0.0
    bytes_out: float = 0.0
    packets: float = 0.0
    unique_sources: float = 0.0
    unique_destinations: float = 0.0
    unique_ports: float = 0.0
    syn_count: float = 0.0
    rst_count: float = 0.0
    request_rate: float = 0.0
    
    # Security Event & Auth Features
    failed_login_count: float = 0.0
    authentication_failure_rate: float = 0.0
    database_query_rate: float = 0.0
    suspicious_event_count: float = 0.0
    
    # Host System Performance Features
    cpu_load: float = 0.0
    memory_load: float = 0.0
    active_connections: float = 0.0
    
    # Aggregated Risk Metrics
    security_risk: float = 0.0  # 0.0 (Safe) to 1.0 (Critical)
    asset_risk: float = 0.0     # 0.0 (Low Impact) to 1.0 (Crown Jewel Threat)

    def to_feature_vector(self) -> List[float]:
        """Convert NetworkState to ordered numerical vector for PyTorch LSTM processing."""
        return [
            self.connection_count,
            self.bytes_in,
            self.bytes_out,
            self.packets,
            self.unique_sources,
            self.unique_destinations,
            self.unique_ports,
            self.syn_count,
            self.rst_count,
            self.request_rate,
            self.failed_login_count,
            self.authentication_failure_rate,
            self.database_query_rate,
            self.suspicious_event_count,
            self.cpu_load,
            self.memory_load,
            self.active_connections,
            self.security_risk,
            self.asset_risk,
        ]

    @classmethod
    def feature_names(cls) -> List[str]:
        return [
            "connection_count", "bytes_in", "bytes_out", "packets",
            "unique_sources", "unique_destinations", "unique_ports",
            "syn_count", "rst_count", "request_rate", "failed_login_count",
            "authentication_failure_rate", "database_query_rate",
            "suspicious_event_count", "cpu_load", "memory_load",
            "active_connections", "security_risk", "asset_risk"
        ]


# ============================================================
# 2. TELEMETRY EVENT SCHEMA & STAGE 5 PIPELINE MODELS
# ============================================================
class TelemetryEvent(BaseModel):
    event_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source: str = "network_flows"       # network_flows, authentication_events, application_api_logs, host_metrics, database_events, ids_ips_events, load_balancer_events
    event_type: str = "TRAFFIC_FLOW"    # LOGIN_ATTEMPT, PORT_SCAN, DB_QUERY, API_REQUEST, DECOY_INTERACTION, HOST_METRICS
    asset_id: str = "web_server_01"
    severity: str = "INFO"             # INFO, LOW, MEDIUM, HIGH, CRITICAL
    features: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Optional legacy & detail fields
    source_ip: Optional[str] = "10.0.0.1"
    dest_ip: Optional[str] = "10.0.0.2"
    dest_port: Optional[int] = 8080
    protocol: Optional[str] = "TCP"
    payload_summary: Optional[str] = ""
    is_decoy_interaction: bool = False
    raw_data: Optional[Dict[str, Any]] = None

class TelemetryStatsResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    total_events: int = 0
    events_per_source: Dict[str, int] = Field(default_factory=dict)
    events_per_severity: Dict[str, int] = Field(default_factory=dict)
    ingestion_rate_eps: float = 0.0
    latest_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NetworkStatesResponse(BaseModel):
    states: List[NetworkState]
    total_states: int


# ============================================================
# 3. ATTACK PATH & MITRE ATT&CK MAPPING
# ============================================================
class MitreTechnique(BaseModel):
    tactic: str      # e.g., Reconnaissance, Credential Access, Lateral Movement
    technique_id: str # e.g., T1595, T1110, T1078, T1048
    technique_name: str
    confidence: float

class AttackPathHop(BaseModel):
    step: int
    source_node: str
    target_node: str
    probability: float
    mitre_info: Optional[MitreTechnique] = None
    status: str # HISTORICAL, CURRENT_LOCATION, PREDICTED_NEXT

class AttackPathForecast(BaseModel):
    predicted_path: List[AttackPathHop]
    choke_point_node: str
    estimated_time_to_compromise_sec: int
    overall_confidence: float


# ============================================================
# 4. ATTACKER OBJECTIVE HYPOTHESES
# ============================================================
class ObjectiveHypotheses(BaseModel):
    timestamp: str
    credentials: float = Field(0.33, description="Hypothesis weight for Credential Harvesting")
    database: float = Field(0.33, description="Hypothesis weight for Data Exfiltration/Database Access")
    administrative_access: float = Field(0.34, description="Hypothesis weight for System Takeover / Privilege Escalation")
    primary_objective: str = "credentials"
    explanation: str = "Initial equal hypothesis distribution."


# ============================================================
# 5. LLM REASONING & ADAPTIVE DEFENSE DECISION
# ============================================================
class ObjectiveScores(BaseModel):
    credentials: float = 0.0                # [0.0, 1.0]
    database: float = 0.0                   # [0.0, 1.0]
    administrative_access: float = 0.0      # [0.0, 1.0]


class EvidenceItem(BaseModel):
    feature: str                            # e.g. "authentication_failure_rate"
    reason: str                             # e.g. "Elevated brute force login attempts detected on auth_service_01"


class ActionRecommendation(BaseModel):
    target: str                             # e.g. "auth_service_01"
    action: str                             # "PROTECT", "MONITOR", "DECEIVE"
    reason: str                             # Rationale for recommended action


class LLMReasoningOutput(BaseModel):
    current_attack_stage: str = "Discovery"
    predicted_next_stage: str = "Initial Access"
    risk: str = "HIGH"                       # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    confidence: float = 0.85               # [0.0, 1.0]
    objectives: ObjectiveScores = Field(default_factory=ObjectiveScores)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    actions: List[ActionRecommendation] = Field(default_factory=list)
    
    # Backward-compatible fields for policy validator & demo runner
    threat_summary: str = "Active threat reconnaissance detected"
    evidence_observed: List[str] = Field(default_factory=list)
    attack_progression: str = "Recon -> Discovery"
    mitre_stage: str = "Discovery"
    recommended_action: str = "PROTECT"     # PROTECT, MONITOR, DECEIVE
    confidence_score: float = 0.85
    reasoning_explanation: str = "AI Strategic Threat Reasoning Output"
    policy_validation_passed: bool = True
    validated_action: str = "PROTECT"

    # Metadata fields
    provider: str = "LOCAL DEMO FALLBACK REASONER (RULE-BASED MOCK)"
    is_mock: bool = True
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    execution_blocked: bool = True          # LLM cannot directly execute system commands


# ============================================================
# 6. DECEPTION & LOAD BALANCER STATE
# ============================================================
class DeceptionState(BaseModel):
    is_active: bool = False
    active_decoys: List[str] = [] # e.g. ["Adaptive Decoy DB (:5433)", "Adaptive Decoy API (:8081)"]
    interactions_captured: int = 0
    trapped_attacker_ips: List[str] = []
    last_interaction: Optional[TelemetryEvent] = None

class ServerLoadMetrics(BaseModel):
    id: str
    name: str
    health: float = 100.0              # 0.0 to 100.0%
    cpu: float = 20.0                 # 0.0 to 100.0%
    memory: float = 30.0              # 0.0 to 100.0%
    connection_count: int = 40
    current_load: float = 40.0         # 0.0 to 100.0%
    security_risk: float = 0.05        # 0.0 (Safe) to 1.0 (Critical)
    predicted_risk: float = 0.05       # 0.0 (Safe) to 1.0 (Critical)
    traffic_percentage: float = 33.3   # 0.0 to 100.0%
    routing_score: float = 90.0
    routing_reason: str = "Optimal capacity & low risk"
    status: str = "HEALTHY"            # HEALTHY, DEGRADED, DEPRIORITIZED, OFFLINE

class LoadBalancerStatusResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    routing_mode: str = "SECURITY_AWARE_OPTIMAL"
    total_traffic_rate_rps: float = 1250.0
    active_servers: int = 3
    average_system_risk: float = 0.05
    servers: List[ServerLoadMetrics]

class LoadBalancerDecisionResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    decision_id: str
    primary_route: str
    traffic_allocations: Dict[str, float]
    routing_reasons: Dict[str, str]
    decision_explanation: str
    risk_penalty_applied: bool

class ServerRiskUpdateRequest(BaseModel):
    server_id: str
    security_risk: float
    predicted_risk: Optional[float] = None

class LoadBalancerState(BaseModel):
    routing_mode: str = "PROTECT" # PROTECT, MONITOR, DECEIVE
    prod_traffic_split: float = 100.0
    decoy_traffic_split: float = 0.0
    active_rules: List[str] = []


# ============================================================
# 7. DEFENCE-IN-DEPTH 9-LEVEL SECURITY MATRIX STATUS
# ============================================================
class SecurityControl(BaseModel):
    name: str
    enabled: bool = True
    status: str = "ACTIVE"
    description: Optional[str] = None

class SecurityLayerEvent(BaseModel):
    id: str
    timestamp: str
    severity: str  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    message: str
    control_name: Optional[str] = None

class SecurityLayer(BaseModel):
    id: str
    layer: str  # e.g., NETWORK/PERIMETER, LOAD BALANCER, APPLICATION, HOST, DATA, TELEMETRY, AI, DEFENCE, DECEPTION
    name: str
    controls: List[SecurityControl]
    status: str = "HEALTHY"  # HEALTHY, DEGRADED, STANDBY
    risk: float = 0.0        # 0.0 (Safe) to 1.0 (Critical)
    events: List[SecurityLayerEvent] = []
    last_checked: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SecurityOverviewResponse(BaseModel):
    total_layers: int = 9
    healthy_layers: int = 8
    degraded_layers: int = 0
    standby_layers: int = 1
    total_controls: int = 42
    active_controls: int = 42
    average_risk: float = 0.05
    system_security_status: str = "PROTECTED"
    layers: List[SecurityLayer]

class DefenseInDepthStatus(BaseModel):
    level1_perimeter: str = "Active (Firewall ACLs, Rate Limiting)"
    level2_load_balancer: str = "Active (Security-Aware Routing)"
    level3_application: str = "Active (JWT Auth, RBAC, Input Validation)"
    level4_host: str = "Active (Hardening, Process Monitoring)"
    level5_data: str = "Active (Encryption-at-Rest, Access Controls)"
    level6_telemetry: str = "Active (Trusted Ingestion, Audit Integrity)"
    level7_ai: str = "Active (Input Guardrails, Confidence Thresholds)"
    level8_defence_engine: str = "Active (Policy Validation Layer Enforced)"
    level9_deception: str = "Standby (Isolated Dynamic Decoy Traps)"


# ============================================================
# 8. DEMO CONTROL STATE (SIH DEMO STATE)
# ============================================================
class DemoState(BaseModel):
    is_running: bool = False
    current_step: int = 0
    total_steps: int = 20
    step_title: str = "System Initialized"
    step_description: str = "Normal network operations monitoring."
    current_state: NetworkState
    predicted_state: NetworkState
    attack_path: AttackPathForecast
    objectives: ObjectiveHypotheses
    llm_reasoning: LLMReasoningOutput
    deception_state: DeceptionState
    load_balancer: LoadBalancerState
    security_matrix: DefenseInDepthStatus
    recent_events: List[TelemetryEvent] = []


# ============================================================
# 9. STAGE 2: CONTROLLED DEFENCE NETWORK ASSETS & SIMULATION
# ============================================================
class Asset(BaseModel):
    id: str
    name: str
    type: str
    role: str
    health: float = 100.0          # 0.0 to 100.0%
    cpu: float = 15.0             # 0.0 to 100.0%
    memory: float = 25.0          # 0.0 to 100.0%
    connections: int = 10
    security_risk: float = 0.0    # 0.0 (Safe) to 1.0 (Critical)
    trust_level: float = 1.0      # 0.0 (Untrusted) to 1.0 (Fully Trusted)


class NetworkLink(BaseModel):
    source: str
    target: str
    protocol: str = "HTTP/TCP"
    status: str = "ACTIVE"


class NetworkTopology(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    assets: List[Asset]
    links: List[NetworkLink]
    total_connections: int
    average_risk: float
    active_threats: int = 0


class SimulationStartRequest(BaseModel):
    seed: Optional[int] = None
    tick_interval_sec: float = 1.0


class SimulationResetRequest(BaseModel):
    seed: Optional[int] = 42


class SimulationStatusResponse(BaseModel):
    is_running: bool
    seed: Optional[int] = None
    elapsed_seconds: float
    total_ticks: int
    active_scenario: str
    events_generated: int
    last_event_time: Optional[str] = None


# ============================================================
# 5. ATTACK-PATH PREDICTION SCHEMAS (STAGE 8)
# ============================================================
class AttackPathNode(BaseModel):
    id: str                                  # e.g. "stage_recon"
    label: str                               # e.g. "Discovery / Port Scan"
    tactic: str                              # e.g. "TA0007: Discovery"
    technique: Optional[str] = None          # e.g. "T1046: Network Service Discovery"
    status: str                              # "COMPLETED", "ACTIVE", "PREDICTED", "POTENTIAL"
    asset_id: str = "edge_firewall_01"
    risk_score: float = 0.10
    evidence_count: int = 1


class AttackPathEdge(BaseModel):
    source: str                              # Node ID
    target: str                              # Node ID
    label: str = "Transition"                # Description
    probability: float = 0.85                # Probability [0.0, 1.0]


class AttackStagePrediction(BaseModel):
    current_stage: str                       # e.g. "Initial Access"
    predicted_next_stage: str                # e.g. "Credential Access"
    future_stages: List[str] = Field(default_factory=list)  # ["Lateral Movement", "Collection"]
    confidence: float = 0.88
    risk: str = "HIGH"                       # "LOW", "ELEVATED", "HIGH", "CRITICAL"
    affected_assets: List[str] = Field(default_factory=list)
    model_version: str = "v1.0.0 [SYNTHETIC DEMO MODEL]"


class AttackPath(BaseModel):
    path_id: str
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    nodes: List[AttackPathNode] = Field(default_factory=list)
    edges: List[AttackPathEdge] = Field(default_factory=list)
    prediction: AttackStagePrediction
    mitre_tactics_covered: List[str] = Field(default_factory=list)


class AttackPathCurrentResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    attack_path: AttackPath


class AttackPathPredictionResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    prediction: AttackStagePrediction
    network_state_sequence: List[str] = Field(default_factory=list)


# ============================================================
# 7. MULTI-HYPOTHESIS OBJECTIVE INFERENCE SCHEMAS (STAGE 10)
# ============================================================
class ObjectiveItemDetail(BaseModel):
    objective: str                           # "credentials", "database", "administrative_access"
    current_probability: float               # e.g. 0.55
    previous_probability: float              # e.g. 0.35
    change: float                            # Delta (current - previous) e.g. +0.20
    evidence: List[str] = Field(default_factory=list)


class ObjectivesCurrentResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    primary_objective: str                   # Objective with highest probability
    explanation: str
    objectives: List[ObjectiveItemDetail] = Field(default_factory=list)


class ObjectivesHistoryResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    total_snapshots: int = 0
    history: List[ObjectivesCurrentResponse] = Field(default_factory=list)


# ============================================================
# 8. ADAPTIVE DEFENCE ENGINE SCHEMAS (STAGE 12)
# ============================================================
class DecisionEvidence(BaseModel):
    feature: str                            # e.g. "authentication_failure_rate"
    reason: str                             # Evidence description
    impact: str = "HIGH"                    # "LOW", "MEDIUM", "HIGH", "CRITICAL"


class DecisionPolicy(BaseModel):
    policy_id: str                          # e.g. "POL-001"
    policy_name: str                        # e.g. "Real Production Asset Protection Boundary"
    passed: bool = True
    rule_description: str


class DefenceAction(BaseModel):
    target_asset: str                       # e.g. "auth_service_01"
    actions: List[str]                      # e.g. ["PROTECT", "MONITOR"] (multiple simultaneous actions)
    primary_action: str                     # "PROTECT" | "MONITOR" | "DECEIVE"
    rationale: str                          # Why this action?


class DefenceDecision(BaseModel):
    decision_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    overall_risk: str                       # "LOW", "ELEVATED", "HIGH", "CRITICAL"
    confidence: float                       # [0.0, 1.0]
    actions: List[DefenceAction] = Field(default_factory=list)
    evidences: List[DecisionEvidence] = Field(default_factory=list)
    policies: List[DecisionPolicy] = Field(default_factory=list)
    llm_recommendation: str = "PROTECT auth_service_01; DECEIVE db_primary_01"
    policy_approved: bool = True
    validated_by_policy_engine: bool = True


class DefenceCurrentResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    decision: DefenceDecision


class DefenceHistoryResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    total_decisions: int = 0
    history: List[DefenceDecision] = Field(default_factory=list)


# ============================================================
# 9. SECURE ADAPTIVE DECEPTION ENGINE SCHEMAS (STAGE 13)
# ============================================================
class DecoyServiceDetail(BaseModel):
    name: str                               # e.g. "Adaptive Decoy Database"
    port: int                               # e.g. 5433
    status: str = "ISOLATED"                # "ACTIVE", "STANDBY", "ISOLATED"
    subnet: str = "192.168.99.0/24"         # Deception VLAN 99
    resource_limits: Dict[str, str] = Field(default_factory=lambda: {"cpu": "0.25 vCPU", "memory": "256MB"})
    synthetic_query_rate: float = 12.4      # q/s synthetic background activity


class DeceptionEvent(BaseModel):
    event_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source_ip: str
    target_decoy: str
    decoy_port: int
    protocol: str                           # "PostgreSQL" | "HTTP/REST" | "HTTPS/Admin"
    payload_summary: str
    severity: str = "CRITICAL"


class DeceptionStatusResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_active: bool = False
    isolation_status: str = "100% Isolated - VLAN 99 ACL Enforced"
    deception_realism: float = 0.964        # 96.4% realism score
    fingerprint_risk: str = "LOW"           # Mimics Enterprise DB v15.2
    total_interactions: int = 0
    trapped_attacker_ips: List[str] = Field(default_factory=list)
    active_decoys: List[DecoyServiceDetail] = Field(default_factory=list)
    synthetic_activity: Dict[str, Any] = Field(default_factory=lambda: {
        "synthetic_app": "eCommerce Order Service (Synthetic Demo)",
        "synthetic_requests_per_sec": 14.2,
        "synthetic_tables": ["users", "orders", "payment_gateways"],
        "path_to_real_assets": "NONE - Zero Routing Path to Internal VLAN 10"
    })


class DeceptionEventsResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    total_events: int = 0
    events: List[DeceptionEvent] = Field(default_factory=list)


class DeceptionActivateRequest(BaseModel):
    policy_validated: bool = True           # Activation permitted ONLY when validated by defence engine
    triggered_by: str = "Stage 12 Adaptive Defence Engine"


class DeceptionActivateResponse(BaseModel):
    success: bool = True
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: DeceptionStatusResponse


# ============================================================
# 10. STAGE 14: CLOSED-LOOP ADAPTATION SCHEMAS
# ============================================================
class WSEventMessage(BaseModel):
    event_type: str                         # telemetry_update | network_state_update | prediction_update | attack_path_update | objective_update | risk_update | defence_update | load_balancer_update | deception_update | feedback_update
    payload: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ClosedLoopStatusResponse(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_running: bool = False
    current_step: int = 0
    loop_interval_sec: float = 2.0
    active_ws_clients: int = 0
    last_event_type: str = "INITIALIZED"
    current_attack_stage: str = "Discovery"
    current_risk: str = "LOW"
    deception_active: bool = False


class ClosedLoopStartRequest(BaseModel):
    interval_sec: float = 2.0


# ============================================================
# 11. AUTHENTICATION & RBAC SCHEMAS
# ============================================================
class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = "adminpassword123"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str
    lastLogin: Optional[str] = None


class AuthSessionResponse(BaseModel):
    token: str
    user: UserResponse
    expiresAt: str
    environment: str = "LOCAL DEFENCE LAB"
    permissions: List[str] = []


class UserCreateRequest(BaseModel):
    name: str
    email: str
    role: str = "SOC_ANALYST"
    password: Optional[str] = "password123"


class UserRoleUpdateRequest(BaseModel):
    role: str


class AuditLogResponse(BaseModel):
    id: str
    timestamp: str
    user: str
    role: str
    action: str
    target: str
    result: str
    ip: str
    details: Optional[str] = None
