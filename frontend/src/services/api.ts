export interface SecurityControl {
  name: string;
  enabled: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'STANDBY' | 'DEGRADED';
  description?: string;
}

export interface SecurityLayerEvent {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  control_name?: string;
}

export interface SecurityLayer {
  id: string;
  layer: string;
  name: string;
  controls: SecurityControl[];
  status: 'HEALTHY' | 'DEGRADED' | 'STANDBY' | 'CRITICAL';
  risk: number;
  events: SecurityLayerEvent[];
  last_checked: string;
}

export interface SecurityOverviewResponse {
  total_layers: number;
  healthy_layers: number;
  degraded_layers: number;
  standby_layers: number;
  total_controls: number;
  active_controls: number;
  average_risk: number;
  system_security_status: string;
  layers: SecurityLayer[];
}

export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL
  ? `${(import.meta as any).env.VITE_API_BASE_URL}/api/v1`
  : 'http://localhost:8000/api/v1';


export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  try {
    const raw = localStorage.getItem('defence_ai_session');
    if (raw) {
      const sess = JSON.parse(raw);
      if (sess && sess.token) {
        headers['Authorization'] = `Bearer ${sess.token}`;
      }
    }
  } catch (e) {
    // ignore json parse error
  }
  return headers;
}

export async function fetchSecurityOverview(): Promise<SecurityOverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/security/overview`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch security overview: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSecurityLayers(): Promise<SecurityLayer[]> {
  const response = await fetch(`${API_BASE_URL}/security/layers`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch security layers: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSecurityEvents(limit: number = 50): Promise<SecurityLayerEvent[]> {
  const response = await fetch(`${API_BASE_URL}/security/events?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch security events: ${response.statusText}`);
  }
  return response.json();
}

// Stage 4 Load Balancer Interfaces
export interface ServerLoadMetrics {
  id: string;
  name: string;
  health: number;
  cpu: number;
  memory: number;
  connection_count: number;
  current_load: number;
  security_risk: number;
  predicted_risk: number;
  traffic_percentage: number;
  routing_score: number;
  routing_reason: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DEPRIORITIZED' | 'OFFLINE';
}

export interface LoadBalancerStatusResponse {
  timestamp: string;
  routing_mode: string;
  total_traffic_rate_rps: number;
  active_servers: number;
  average_system_risk: number;
  servers: ServerLoadMetrics[];
}

export interface LoadBalancerDecisionResponse {
  timestamp: string;
  decision_id: string;
  primary_route: string;
  traffic_allocations: Record<string, number>;
  routing_reasons: Record<string, string>;
  decision_explanation: string;
  risk_penalty_applied: boolean;
}

export async function fetchLoadBalancerStatus(): Promise<LoadBalancerStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/load-balancer/status`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch load balancer status: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchLoadBalancerDecision(): Promise<LoadBalancerDecisionResponse> {
  const response = await fetch(`${API_BASE_URL}/load-balancer/decision`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch load balancer decision: ${response.statusText}`);
  }
  return response.json();
}

export async function updateServerRisk(
  serverId: string,
  securityRisk: number,
  predictedRisk?: number
): Promise<LoadBalancerStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/load-balancer/update-risk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      server_id: serverId,
      security_risk: securityRisk,
      predicted_risk: predictedRisk
    })
  });
  if (!response.ok) {
    throw new Error(`Failed to update server risk: ${response.statusText}`);
  }
  return response.json();
}

// Stage 5 Telemetry & Network State Interfaces
export interface CanonicalTelemetryEvent {
  event_id: string;
  timestamp: string;
  source: string;
  event_type: string;
  asset_id: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  features: Record<string, any>;
  metadata: Record<string, any>;
}

export interface TelemetryStatsResponse {
  timestamp: string;
  total_events: number;
  events_per_source: Record<string, number>;
  events_per_severity: Record<string, number>;
  ingestion_rate_eps: number;
  latest_timestamp: string;
}

export interface FullNetworkState {
  timestamp: string;
  time_step: number;
  state_id: string;
  window_size_sec: number;
  transition_sequence: number;
  active_threat_level: string;
  connection_count: number;
  bytes_in: number;
  bytes_out: number;
  packets: number;
  unique_sources: number;
  unique_destinations: number;
  unique_ports: number;
  failed_login_count: number;
  authentication_failure_rate: number;
  database_query_rate: number;
  suspicious_event_count: number;
  cpu_load: number;
  memory_load: number;
  active_connections: number;
  security_risk: number;
  asset_risk: number;
}

export interface NetworkStatesResponse {
  states: FullNetworkState[];
  total_states: number;
}

export async function fetchRecentTelemetry(limit: number = 50, source?: string): Promise<CanonicalTelemetryEvent[]> {
  const url = source
    ? `${API_BASE_URL}/telemetry/recent?limit=${limit}&source=${encodeURIComponent(source)}`
    : `${API_BASE_URL}/telemetry/recent?limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch recent telemetry: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTelemetryStats(): Promise<TelemetryStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/telemetry/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch telemetry stats: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchNetworkStates(limit: number = 50): Promise<NetworkStatesResponse> {
  const response = await fetch(`${API_BASE_URL}/network/states?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch network states: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchLatestNetworkState(): Promise<FullNetworkState> {
  const response = await fetch(`${API_BASE_URL}/network/states/latest`);
  if (!response.ok) {
    throw new Error(`Failed to fetch latest network state: ${response.statusText}`);
  }
  return response.json();
}

export interface NetworkTopologyAsset {
  id: string;
  name: string;
  type: string;
  role: string;
  health: number;
  cpu: number;
  memory: number;
  connections: number;
  security_risk: number;
  trust_level: number;
  isDecoy?: boolean;
  ip?: string;
}

export interface NetworkTopologyLink {
  source: string;
  target: string;
  protocol: string;
  status: string;
}

export interface NetworkTopologyResponse {
  timestamp: string;
  assets: NetworkTopologyAsset[];
  links: NetworkTopologyLink[];
  total_connections: number;
  average_risk: number;
  active_threats: number;
}

export async function fetchNetworkTopology(): Promise<NetworkTopologyResponse> {
  const response = await fetch(`${API_BASE_URL}/network/topology`);
  if (!response.ok) {
    throw new Error(`Failed to fetch network topology: ${response.statusText}`);
  }
  return response.json();
}


// Stage 8: Attack Path Prediction Interfaces
export interface AttackPathNode {
  id: string;
  label: string;
  tactic: string;
  technique?: string;
  status: 'COMPLETED' | 'ACTIVE' | 'PREDICTED' | 'POTENTIAL';
  asset_id: string;
  risk_score: number;
  evidence_count: number;
}

export interface AttackPathEdge {
  source: string;
  target: string;
  label: string;
  probability: number;
}

export interface AttackStagePrediction {
  current_stage: string;
  predicted_next_stage: string;
  future_stages: string[];
  confidence: number;
  risk: string;
  affected_assets: string[];
  model_version: string;
}

export interface AttackPath {
  path_id: string;
  generated_at: string;
  nodes: AttackPathNode[];
  edges: AttackPathEdge[];
  prediction: AttackStagePrediction;
  mitre_tactics_covered: string[];
}

export interface AttackPathCurrentResponse {
  timestamp: string;
  attack_path: AttackPath;
}

export interface AttackPathPredictionResponse {
  timestamp: string;
  prediction: AttackStagePrediction;
  network_state_sequence: string[];
}

export async function fetchAttackPathCurrent(): Promise<AttackPathCurrentResponse> {
  const response = await fetch(`${API_BASE_URL}/attack-path/current`);
  if (!response.ok) {
    throw new Error(`Failed to fetch current attack path: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAttackPathPrediction(): Promise<AttackPathPredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/attack-path/prediction`);
  if (!response.ok) {
    throw new Error(`Failed to fetch attack path prediction: ${response.statusText}`);
  }
  return response.json();
}

// Stage 9: LLM Reasoning Layer Interfaces
export interface ObjectiveScores {
  credentials: number;
  database: number;
  administrative_access: number;
}

export interface EvidenceItem {
  feature: string;
  reason: string;
}

export interface ActionRecommendation {
  target: string;
  action: 'PROTECT' | 'MONITOR' | 'DECEIVE';
  reason: string;
}

export interface LLMReasoningOutput {
  current_attack_stage: string;
  predicted_next_stage: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  objectives: ObjectiveScores;
  evidence: EvidenceItem[];
  actions: ActionRecommendation[];
  provider: string;
  is_mock: boolean;
  generated_at: string;
  execution_blocked: boolean;
}

export async function fetchLatestReasoning(): Promise<LLMReasoningOutput> {
  const response = await fetch(`${API_BASE_URL}/reasoning/latest`);
  if (!response.ok) {
    throw new Error(`Failed to fetch LLM reasoning analysis: ${response.statusText}`);
  }
  return response.json();
}

export async function triggerReasoningAnalysis(): Promise<LLMReasoningOutput> {
  const response = await fetch(`${API_BASE_URL}/reasoning/analyze`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error(`Failed to trigger LLM reasoning analysis: ${response.statusText}`);
  }
  return response.json();
}

// Stage 10: Multi-Hypothesis Objective Inference Interfaces
export interface ObjectiveItemDetail {
  objective: 'credentials' | 'database' | 'administrative_access';
  current_probability: number;
  previous_probability: number;
  change: number;
  evidence: string[];
}

export interface ObjectivesCurrentResponse {
  timestamp: string;
  primary_objective: string;
  explanation: string;
  objectives: ObjectiveItemDetail[];
}

export interface ObjectivesHistoryResponse {
  timestamp: string;
  total_snapshots: number;
  history: ObjectivesCurrentResponse[];
}

export async function fetchObjectivesCurrent(): Promise<ObjectivesCurrentResponse> {
  const response = await fetch(`${API_BASE_URL}/objectives/current`);
  if (!response.ok) {
    throw new Error(`Failed to fetch current objective hypotheses: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchObjectivesHistory(): Promise<ObjectivesHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/objectives/history`);
  if (!response.ok) {
    throw new Error(`Failed to fetch objective hypotheses history: ${response.statusText}`);
  }
  return response.json();
}

// Stage 12: Adaptive Defence Engine Interfaces
export interface DecisionEvidence {
  feature: string;
  reason: string;
  impact: string;
}

export interface DecisionPolicy {
  policy_id: string;
  policy_name: string;
  passed: boolean;
  rule_description: string;
}

export interface DefenceAction {
  target_asset: string;
  actions: string[]; // e.g. ["PROTECT", "MONITOR"]
  primary_action: 'PROTECT' | 'MONITOR' | 'DECEIVE';
  rationale: string;
}

export interface DefenceDecision {
  decision_id: string;
  timestamp: string;
  overall_risk: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  confidence: number;
  actions: DefenceAction[];
  evidences: DecisionEvidence[];
  policies: DecisionPolicy[];
  llm_recommendation: string;
  policy_approved: boolean;
  validated_by_policy_engine: boolean;
}

export interface DefenceCurrentResponse {
  timestamp: string;
  decision: DefenceDecision;
}

export interface DefenceHistoryResponse {
  timestamp: string;
  total_decisions: number;
  history: DefenceDecision[];
}

export async function fetchCurrentDefence(): Promise<DefenceCurrentResponse> {
  const response = await fetch(`${API_BASE_URL}/defence/current`);
  if (!response.ok) {
    throw new Error(`Failed to fetch current defence decision: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDefenceHistory(): Promise<DefenceHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/defence/history`);
  if (!response.ok) {
    throw new Error(`Failed to fetch defence decision history: ${response.statusText}`);
  }
  return response.json();
}

// Stage 13: Secure Adaptive Deception Interfaces
export interface DecoyServiceDetail {
  name: string;
  port: number;
  status: 'ACTIVE' | 'STANDBY' | 'ISOLATED';
  subnet: string;
  resource_limits: Record<string, string>;
  synthetic_query_rate: number;
}

export interface DeceptionEvent {
  event_id: string;
  timestamp: string;
  source_ip: string;
  target_decoy: string;
  decoy_port: number;
  protocol: string;
  payload_summary: string;
  severity: string;
}

export interface DeceptionStatusResponse {
  timestamp: string;
  is_active: boolean;
  isolation_status: string;
  deception_realism: number;
  fingerprint_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  total_interactions: number;
  trapped_attacker_ips: string[];
  active_decoys: DecoyServiceDetail[];
  synthetic_activity: {
    synthetic_app: string;
    synthetic_requests_per_sec: number;
    synthetic_tables: string[];
    path_to_real_assets: string;
  };
}

export interface DeceptionEventsResponse {
  timestamp: string;
  total_events: number;
  events: DeceptionEvent[];
}

export interface DeceptionActivateResponse {
  success: boolean;
  message: string;
  timestamp: string;
  status: DeceptionStatusResponse;
}

export async function fetchDeceptionStatus(): Promise<DeceptionStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/deception/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch deception status: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDeceptionEvents(): Promise<DeceptionEventsResponse> {
  const response = await fetch(`${API_BASE_URL}/deception/events`);
  if (!response.ok) {
    throw new Error(`Failed to fetch deception events: ${response.statusText}`);
  }
  return response.json();
}

export async function activateDeception(policyValidated: boolean = true): Promise<DeceptionActivateResponse> {
  const response = await fetch(`${API_BASE_URL}/deception/activate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ policy_validated: policyValidated, triggered_by: 'Stage 12 Adaptive Defence Engine' })
  });
  if (!response.ok) {
    throw new Error(`Failed to activate deception zone: ${response.statusText}`);
  }
  return response.json();
}

export async function deactivateDeception(): Promise<DeceptionStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/deception/deactivate`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to deactivate deception zone: ${response.statusText}`);
  }
  return response.json();
}

// Stage 14: Closed-Loop Adaptation Interfaces
export interface ClosedLoopStatusResponse {
  timestamp: string;
  is_running: boolean;
  current_step: number;
  loop_interval_sec: number;
  active_ws_clients: number;
  last_event_type: string;
  current_attack_stage: string;
  current_risk: string;
  deception_active: boolean;
}

export interface WSEventMessage {
  event_type:
    | 'telemetry_update'
    | 'network_state_update'
    | 'prediction_update'
    | 'attack_path_update'
    | 'objective_update'
    | 'risk_update'
    | 'defence_update'
    | 'load_balancer_update'
    | 'deception_update'
    | 'feedback_update';
  payload: any;
  timestamp: string;
}

export async function fetchClosedLoopStatus(): Promise<ClosedLoopStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/closed-loop/status`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch closed-loop status: ${response.statusText}`);
  }
  return response.json();
}

export async function startClosedLoop(intervalSec: number = 2.0): Promise<ClosedLoopStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/closed-loop/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ interval_sec: intervalSec })
  });
  if (!response.ok) {
    throw new Error(`Failed to start closed loop: ${response.statusText}`);
  }
  return response.json();
}

export async function stopClosedLoop(): Promise<ClosedLoopStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/closed-loop/stop`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to stop closed loop: ${response.statusText}`);
  }
  return response.json();
}

export async function stepClosedLoop(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/closed-loop/step`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to execute single closed loop step: ${response.statusText}`);
  }
  return response.json();
}

export function createClosedLoopWebSocket(onMessage: (event: WSEventMessage) => void): WebSocket {
  const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data: WSEventMessage = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  };

  return ws;
}

// Admin & Audit Interfaces
export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  target: string;
  result: 'SUCCESS' | 'DENIED' | 'FAILED';
  ip: string;
  details?: string;
}

export async function fetchAuditLogs(limit: number = 50): Promise<AuditLogItem[]> {
  const response = await fetch(`${API_BASE_URL}/audit/logs?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchUsersApi(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }
  return response.json();
}

export async function createUserApi(userData: { name: string; email: string; role: string }): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
    throw new Error(`Failed to create user: ${response.statusText}`);
  }
  return response.json();
}

export async function updateUserRoleApi(userId: string, role: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role })
  });
  if (!response.ok) {
    throw new Error(`Failed to update user role: ${response.statusText}`);
  }
  return response.json();
}

export async function toggleUserStatusApi(userId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to toggle user status: ${response.statusText}`);
  }
  return response.json();
}

// -------------------------------------------------------------
// MAIN SIH LIVE TESTBED & MODE MANAGEMENT API
// -------------------------------------------------------------

export interface SystemModeStatus {
  mode: 'LIVE_CONTROLLED_TEST' | 'DATASET_REPLAY' | 'JUDGE_DEMO';
  is_running: boolean;
  cycle_count: number;
  sensors: {
    telemetry: 'LIVE' | 'OFFLINE';
    network_state: 'LIVE' | 'OFFLINE';
    ai_world_model: 'RUNNING' | 'STANDBY';
    llm_reasoning: 'CONNECTED' | 'FALLBACK';
    deception: 'ACTIVE' | 'INACTIVE';
    load_balancer: 'ACTIVE' | 'STANDBY';
    database: 'CONNECTED' | 'DISCONNECTED';
  };
  adapter_statuses?: Record<string, any>;
}

export interface LiveTimelineEvent {
  timestamp: string;
  source: string;
  asset: string;
  event_type: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export async function setSystemModeApi(mode: string): Promise<SystemModeStatus> {
  const response = await fetch(`${API_BASE_URL}/mode/set`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ mode })
  });
  if (!response.ok) {
    throw new Error(`Failed to set system mode: ${response.statusText}`);
  }
  return response.json();
}

export async function getSystemModeStatusApi(): Promise<SystemModeStatus> {
  const response = await fetch(`${API_BASE_URL}/mode/status`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch system mode status: ${response.statusText}`);
  }
  return response.json();
}

export async function stepLiveTestbedApi(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/live-testbed/step`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to execute live testbed step: ${response.statusText}`);
  }
  return response.json();
}

export async function resetLiveTestbedApi(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/live-testbed/reset`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to reset live testbed: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchLiveTimelineApi(): Promise<LiveTimelineEvent[]> {
  const response = await fetch(`${API_BASE_URL}/live-testbed/timeline`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch live timeline: ${response.statusText}`);
  }
  return response.json();
}

export async function stepDatasetReplayApi(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/dataset-replay/step`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to execute dataset replay step: ${response.statusText}`);
  }
  return response.json();
}









