/**
 * DemoDataProvider: Fallback data provider abstraction for ABHEDYA-NET.
 * Stage 16 Deterministic Judge Demo: "Credential-to-Database Adaptive Defence"
 * Seed: 42 (100% Repeatable Scenario)
 */

export interface NetworkNodeData {
  id: string;
  name: string;
  type: string;
  ip: string;
  role: string;
  health: number;
  cpu: number;
  memory: number;
  connections: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'HEALTHY' | 'SUSPICIOUS' | 'HIGH_RISK' | 'DECOY';
  isDecoy?: boolean;
}

export interface NetworkEdgeData {
  id: string;
  source: string;
  target: string;
  protocol: string;
  volume: string;
  status: 'NORMAL' | 'TRAFFIC' | 'PREDICTED' | 'BLOCKED' | 'DECEIVED';
}

export interface JudgeDemoStep {
  step: number;
  title: string;
  description: string;
  activeStage: string;
  risk: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  attackStage: string;
  predictedStage: string;
  objectiveCreds: number;
  objectiveDb: number;
  objectiveAdmin: number;
  deceptionActive: boolean;
}

export const DEMO_STAGES: JudgeDemoStep[] = [
  { step: 1, title: '1 / 11 NORMAL', description: 'Normal network baseline operating with nominal telemetry ingress.', activeStage: 'telemetry_update', risk: 'LOW', attackStage: 'Reconnaissance', predictedStage: 'Discovery', objectiveCreds: 0.15, objectiveDb: 0.10, objectiveAdmin: 0.05, deceptionActive: false },
  { step: 2, title: '2 / 11 TELEMETRY CHANGE', description: 'Suspicious connection burst detected from untrusted IP 192.168.99.150.', activeStage: 'network_state_update', risk: 'ELEVATED', attackStage: 'Discovery', predictedStage: 'Initial Access', objectiveCreds: 0.35, objectiveDb: 0.15, objectiveAdmin: 0.05, deceptionActive: false },
  { step: 3, title: '3 / 11 NETWORK STATE UPDATE', description: 'Authentication failure anomaly threshold exceeded (12 attempts / 2.4s).', activeStage: 'prediction_update', risk: 'ELEVATED', attackStage: 'Initial Access', predictedStage: 'Credential Access', objectiveCreds: 0.55, objectiveDb: 0.20, objectiveAdmin: 0.08, deceptionActive: false },
  { step: 4, title: '4 / 11 FUTURE PREDICTION', description: 'AI World Model forecasts elevated future threat state S_{t+1} (Credential Access Risk: 78%).', activeStage: 'attack_path_update', risk: 'HIGH', attackStage: 'Credential Access', predictedStage: 'Lateral Movement', objectiveCreds: 0.78, objectiveDb: 0.25, objectiveAdmin: 0.10, deceptionActive: false },
  { step: 5, title: '5 / 11 ATTACK PATH PREDICTION', description: 'Attack-Path Engine calculates high-probability path to Database via Admin Service.', activeStage: 'risk_update', risk: 'HIGH', attackStage: 'Credential Access', predictedStage: 'Lateral Movement', objectiveCreds: 0.82, objectiveDb: 0.30, objectiveAdmin: 0.12, deceptionActive: false },
  { step: 6, title: '6 / 11 OBJECTIVE INFERENCE', description: 'Multi-Hypothesis Objective Engine inferring dominant Credential Harvesting intent (78%).', activeStage: 'objective_update', risk: 'HIGH', attackStage: 'Credential Access', predictedStage: 'Lateral Movement', objectiveCreds: 0.85, objectiveDb: 0.35, objectiveAdmin: 0.15, deceptionActive: false },
  { step: 7, title: '7 / 11 ADAPTIVE DEFENCE', description: 'Adaptive Defence Engine issues validated multi-action policy recommendation: PROTECT + DECEIVE.', activeStage: 'defence_update', risk: 'CRITICAL', attackStage: 'Lateral Movement', predictedStage: 'Collection', objectiveCreds: 0.88, objectiveDb: 0.45, objectiveAdmin: 0.18, deceptionActive: true },
  { step: 8, title: '8 / 11 LOAD BALANCER RESPONSE', description: 'NGINX Load Balancer dynamically reduces Server B traffic weight from 33% to 10%.', activeStage: 'load_balancer_update', risk: 'HIGH', attackStage: 'Lateral Movement', predictedStage: 'Collection', objectiveCreds: 0.85, objectiveDb: 0.50, objectiveAdmin: 0.20, deceptionActive: true },
  { step: 9, title: '9 / 11 DECEPTION ACTIVATED', description: 'Adaptive Decoy Database activated on isolated VLAN 99 honey port 5433.', activeStage: 'deception_update', risk: 'ELEVATED', attackStage: 'Lateral Movement', predictedStage: 'Collection', objectiveCreds: 0.75, objectiveDb: 0.60, objectiveAdmin: 0.22, deceptionActive: true },
  { step: 10, title: '10 / 11 DECOY INTERACTION', description: 'Attacker trapped in Decoy Zone; query payload logged with ZERO access to real DB.', activeStage: 'deception_update', risk: 'LOW', attackStage: 'Trapped', predictedStage: 'Contained', objectiveCreds: 0.40, objectiveDb: 0.25, objectiveAdmin: 0.08, deceptionActive: true },
  { step: 11, title: '11 / 11 FEEDBACK & UPDATED PREDICTION', description: 'Closed-loop telemetry feedback updates network state and lowers real asset risk to LOW.', activeStage: 'feedback_update', risk: 'LOW', attackStage: 'Contained', predictedStage: 'Monitored', objectiveCreds: 0.20, objectiveDb: 0.15, objectiveAdmin: 0.05, deceptionActive: true }
];

export const DEMO_NODES: NetworkNodeData[] = [
  { id: 'edge-firewall', name: 'Edge Firewall', type: 'Firewall', ip: '10.0.0.1', role: 'Perimeter Security', health: 100, cpu: 12, memory: 28, connections: 1240, risk: 'LOW', status: 'HEALTHY' },
  { id: 'ids-ips', name: 'Suricata IDS/IPS', type: 'IDS/IPS', ip: '10.0.0.2', role: 'Deep Packet Inspection', health: 99, cpu: 22, memory: 45, connections: 1240, risk: 'LOW', status: 'HEALTHY' },
  { id: 'load-balancer', name: 'NGINX Load Balancer', type: 'Load Balancer', ip: '10.0.0.10', role: 'Security-Aware Traffic Router', health: 98, cpu: 28, memory: 34, connections: 840, risk: 'LOW', status: 'HEALTHY' },
  { id: 'web-server-01', name: 'Web Server 01', type: 'Web Server', ip: '10.0.0.11', role: 'Frontend React App', health: 95, cpu: 32, memory: 48, connections: 320, risk: 'LOW', status: 'HEALTHY' },
  { id: 'api-server-01', name: 'API Server 01', type: 'API Server', ip: '10.0.0.12', role: 'FastAPI Backend', health: 92, cpu: 45, memory: 56, connections: 410, risk: 'MEDIUM', status: 'SUSPICIOUS' },
  { id: 'auth-service-01', name: 'Auth Service', type: 'Authentication', ip: '10.0.0.13', role: 'OAuth2/JWT Provider', health: 88, cpu: 68, memory: 62, connections: 180, risk: 'HIGH', status: 'HIGH_RISK' },
  { id: 'database-01', name: 'PostgreSQL DB', type: 'Database', ip: '10.0.0.20', role: 'Production Relational Datastore', health: 99, cpu: 38, memory: 52, connections: 431, risk: 'LOW', status: 'HEALTHY' },
  { id: 'decoy-db-01', name: 'Adaptive Decoy DB', type: 'Decoy Zone', ip: '10.99.0.50', role: 'Synthetic Honey Database', health: 100, cpu: 5, memory: 12, connections: 47, risk: 'LOW', status: 'DECOY', isDecoy: true }
];

export const DEMO_EDGES: NetworkEdgeData[] = [
  { id: 'e1', source: 'edge-firewall', target: 'ids-ips', protocol: 'HTTPS/443', volume: '1.2 Gbps', status: 'TRAFFIC' },
  { id: 'e2', source: 'ids-ips', target: 'load-balancer', protocol: 'HTTP/80', volume: '1.2 Gbps', status: 'TRAFFIC' },
  { id: 'e3', source: 'load-balancer', target: 'web-server-01', protocol: 'HTTP/8080', volume: '400 Mbps', status: 'NORMAL' },
  { id: 'e4', source: 'load-balancer', target: 'api-server-01', protocol: 'HTTP/8000', volume: '800 Mbps', status: 'TRAFFIC' },
  { id: 'e5', source: 'api-server-01', target: 'auth-service-01', protocol: 'gRPC/50051', volume: '150 Mbps', status: 'PREDICTED' },
  { id: 'e6', source: 'api-server-01', target: 'database-01', protocol: 'TCP/5432', volume: '250 Mbps', status: 'NORMAL' },
  { id: 'e7', source: 'auth-service-01', target: 'decoy-db-01', protocol: 'TCP/5433', volume: '45 Mbps', status: 'DECEIVED' }
];
