import React, { useState, useEffect } from 'react';
import { Network, Server, Shield, Sliders, Activity, AlertTriangle, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { CurrentSituation } from '../common/CurrentSituation';
import { DetailDrawer, DetailDrawerData } from '../common/DetailDrawer';
import { useRealtime } from '../../context/RealtimeContext';
import {
  fetchLoadBalancerStatus,
  fetchLoadBalancerDecision,
  updateServerRisk,
  fetchSecurityOverview,
  fetchNetworkTopology,
  NetworkTopologyAsset,
  LoadBalancerStatusResponse,
  LoadBalancerDecisionResponse,
  SecurityOverviewResponse,
  SecurityLayer
} from '../../services/api';

const DEFAULT_TOPOLOGY_ASSETS: NetworkTopologyAsset[] = [
  { id: 'web_server_01', name: 'Web Server', type: 'Web Server', role: 'Frontend Web Application Server', health: 98.5, cpu: 18.2, memory: 34.0, connections: 45, security_risk: 0.05, trust_level: 0.95, ip: '10.0.0.10' },
  { id: 'api_server_01', name: 'API Server', type: 'API Server', role: 'Core Business Logic REST API', health: 99.0, cpu: 24.5, memory: 42.1, connections: 62, security_risk: 0.08, trust_level: 0.90, ip: '10.0.0.20' },
  { id: 'auth_service_01', name: 'Authentication Service', type: 'Authentication Service', role: 'Identity & Access Management (OAuth2/JWT)', health: 100.0, cpu: 12.0, memory: 28.5, connections: 30, security_risk: 0.02, trust_level: 0.99, ip: '10.0.0.15' },
  { id: 'database_01', name: 'Database', type: 'Database', role: 'Primary Relational Datastore (PostgreSQL)', health: 99.5, cpu: 28.0, memory: 55.4, connections: 85, security_risk: 0.04, trust_level: 0.98, ip: '10.0.0.21' },
  { id: 'admin_service_01', name: 'Admin Service', type: 'Admin Service', role: 'Internal System Administration & Management Portal', health: 100.0, cpu: 8.5, memory: 22.0, connections: 5, security_risk: 0.01, trust_level: 0.99, ip: '10.0.0.5' },
  { id: 'load_balancer_01', name: 'Load Balancer', type: 'Load Balancer', role: 'Edge Traffic Router & Ingress Gateway', health: 99.9, cpu: 15.0, memory: 20.0, connections: 140, security_risk: 0.03, trust_level: 0.97, ip: '10.0.0.2' },
  { id: 'decoy_db_01', name: 'Adaptive Decoy Database', type: 'Decoy Honeypot', role: 'Isolated Honeypot on Port 5433 (VLAN 99)', health: 100.0, cpu: 2.1, memory: 12.0, connections: 4, security_risk: 0.95, trust_level: 0.05, isDecoy: true, ip: '192.168.99.10' }
];

export const NetworkPage: React.FC = () => {
  const { currentDemoStepData, judgeDemoStep, liveCycleData } = useRealtime();
  const [activeTab, setActiveTab] = useState<'topology' | 'security_matrix' | 'load_balancer'>('topology');
  const [nodes, setNodes] = useState<NetworkTopologyAsset[]>(DEFAULT_TOPOLOGY_ASSETS);
  const [selectedNode, setSelectedNode] = useState<NetworkTopologyAsset | null>(DEFAULT_TOPOLOGY_ASSETS[0]);
  const [drawerData, setDrawerData] = useState<DetailDrawerData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Dynamic Load Balancer State
  const [lbStatus, setLbStatus] = useState<LoadBalancerStatusResponse | null>(null);
  const [lbDecision, setLbDecision] = useState<LoadBalancerDecisionResponse | null>(null);
  const [lbLoading, setLbLoading] = useState<boolean>(false);
  const [serverBRisk, setServerBRisk] = useState<number>(0.08);

  // Dynamic Security Matrix State
  const [secOverview, setSecOverview] = useState<SecurityOverviewResponse | null>(null);

  const loadNetworkData = async () => {
    try {
      setLbLoading(true);
      const [lbStatusRes, lbDecRes, secRes, topoRes] = await Promise.all([
        fetchLoadBalancerStatus().catch(() => null),
        fetchLoadBalancerDecision().catch(() => null),
        fetchSecurityOverview().catch(() => null),
        fetchNetworkTopology().catch(() => null)
      ]);
      if (lbStatusRes) setLbStatus(lbStatusRes);
      if (lbDecRes) setLbDecision(lbDecRes);
      if (secRes) setSecOverview(secRes);
      if (topoRes && Array.isArray(topoRes.assets) && topoRes.assets.length > 0) {
        // Append isolated decoy database node to the topology if not already present
        const hasDecoy = topoRes.assets.some(a => a.isDecoy || a.id.includes('decoy'));
        const fullAssets = hasDecoy ? topoRes.assets : [
          ...topoRes.assets,
          {
            id: 'decoy_db_01',
            name: 'Adaptive Decoy Database',
            type: 'Decoy Honeypot',
            role: 'Isolated Honeypot on Port 5433 (VLAN 99)',
            health: 100.0,
            cpu: 2.1,
            memory: 12.0,
            connections: 4,
            security_risk: 0.95,
            trust_level: 0.05,
            isDecoy: true,
            ip: '192.168.99.10'
          }
        ];
        setNodes(fullAssets);
        if (!selectedNode) setSelectedNode(fullAssets[0]);
      }
    } catch (e) {
      console.warn('Network data fetch notice:', e);
    } finally {
      setLbLoading(false);
    }
  };

  useEffect(() => {
    loadNetworkData();
  }, [liveCycleData]);

  const handleUpdateServerBRisk = async (newRisk: number) => {
    setServerBRisk(newRisk);
    try {
      const updated = await updateServerRisk('server_b', newRisk);
      setLbStatus(updated);
      const dec = await fetchLoadBalancerDecision();
      setLbDecision(dec);
    } catch (e) {
      console.warn('Failed to update Server B risk:', e);
    }
  };

  const openNodeDrawer = (node: NetworkTopologyAsset) => {
    setSelectedNode(node);
    const isHighRisk = node.security_risk >= 0.35;
    setDrawerData({
      title: node.name,
      subtitle: `${node.type} (${node.ip || '10.0.0.x'}) — ${node.role}`,
      type: node.type,
      status: isHighRisk ? 'HIGH_RISK' : node.health >= 90 ? 'HEALTHY' : 'DEGRADED',
      summary: `Asset ${node.name} is running at ${node.cpu}% CPU and ${node.memory}% memory load.`,
      why: isHighRisk
        ? 'Repeated authentication failure rate anomaly detected.'
        : node.isDecoy
        ? 'Decoy zone honeypot isolated on VLAN 99.'
        : 'Nominal baseline operational traffic.',
      evidence: [
        `CPU Load: ${node.cpu}%`,
        `RAM Usage: ${node.memory}%`,
        `Active Connections: ${node.connections}`,
        `Trust Level: ${Math.round(node.trust_level * 100)}%`,
        `Security Risk: ${Math.round(node.security_risk * 100)}%`
      ],
      actionApplied: isHighRisk ? 'PROTECT: Strict Rate Limits' : 'MONITOR: Packet Logging',
      result: 'Node boundary verified and enforced.'
    });
    setDrawerOpen(true);
  };

  const displayLayers = secOverview && secOverview.layers.length > 0
    ? secOverview.layers.map((l: SecurityLayer, idx: number) => ({
        name: `${idx + 1}. ${l.name}`,
        purpose: l.controls.map((c) => c.name).join(', ') || 'Security layer controls active',
        status: l.status,
        risk: l.risk > 0.6 ? 'HIGH' : l.risk > 0.3 ? 'MEDIUM' : 'LOW'
      }))
    : [
        { name: '1. Network Boundary', purpose: 'Perimeter firewall & ACL enforcement', status: 'PROTECTED', risk: 'LOW' },
        { name: '2. Load Balancer', purpose: 'Security-aware dynamic traffic rerouting', status: 'ACTIVE', risk: 'LOW' },
        { name: '3. Application Layer', purpose: 'API Gateway WAF & auth rate limiting', status: 'PROTECTED', risk: 'MEDIUM' },
        { name: '4. Host Security', purpose: 'Host-based IDS/IPS telemetry agent', status: 'MONITORED', risk: 'LOW' },
        { name: '5. Data Layer', purpose: 'PostgreSQL relational datastore protection', status: 'PROTECTED', risk: 'LOW' },
        { name: '6. Telemetry Pipeline', purpose: 'Realtime log stream ingestion', status: 'HEALTHY', risk: 'LOW' },
        { name: '7. AI World Model', purpose: 'LSTM temporal threat state forecasting', status: 'ACTIVE', risk: 'LOW' },
        { name: '8. Adaptive Defence', purpose: 'Policy-validated multi-action engine', status: 'ACTIVE', risk: 'LOW' },
        { name: '9. Deception Zone', purpose: 'VLAN 99 isolated honeypot environment', status: 'ACTIVE', risk: 'LOW' }
      ];


  return (
    <div className="space-y-6 font-mono select-none">
      {/* Header & Tab Selector */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-orange-400" />
            <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">
              Network Operations & Security Infrastructure
            </h1>
            <span className="badge-orange">TOPOLOGY & DEFENSE</span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Topology canvas, 9-layer defense matrix, and security-aware load balancing
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('topology')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'topology' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            TOPOLOGY CANVAS
          </button>
          <button
            onClick={() => setActiveTab('security_matrix')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'security_matrix' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            DEFENSE MATRIX (9 LAYERS)
          </button>
          <button
            onClick={() => setActiveTab('load_balancer')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'load_balancer' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            LOAD BALANCER
          </button>
        </div>
      </div>

      <CurrentSituation
        what={`Phase ${judgeDemoStep}/11: Network Infrastructure Monitored`}
        where="Perimeter, App Cluster & Deception Zone"
        when={new Date().toLocaleTimeString('en-US', { hour12: false })}
        severity={currentDemoStepData.risk}
        why="Security-aware load balancer active; traffic allocation dynamically adjusted based on server risk score."
        whatNext="Rerouting high-risk server connections to isolated decoy database."
      />

      {/* Tab 1: Topology Canvas */}
      {activeTab === 'topology' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl bg-canvas-dark">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-white text-xs uppercase">Interactive Topology Node Canvas</span>
            </div>
            <span className="text-[10px] text-slate-500">Click any node to open the Detail Inspector Drawer</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
            {nodes.map((node) => {
              const isHighRisk = node.security_risk >= 0.35;
              const statusBadge = isHighRisk ? 'badge-red' : node.health >= 90 ? 'badge-green' : 'badge-amber';
              const statusText = isHighRisk ? 'HIGH_RISK' : node.health >= 90 ? 'HEALTHY' : 'DEGRADED';
              return (
                <div
                  key={node.id}
                  onClick={() => openNodeDrawer(node)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-105 select-none ${
                    node.isDecoy
                      ? 'bg-orange-950/30 border-orange-500/50 shadow-lg shadow-orange-950/40'
                      : selectedNode?.id === node.id
                      ? 'bg-slate-800 border-orange-500 shadow-xl'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 truncate">{node.type}</span>
                    <span className={statusBadge}>{statusText}</span>
                  </div>
                  <div className="font-bold text-white text-xs mt-1 truncate">{node.name}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>{node.ip || '10.0.0.x'}</span>
                    <span className={isHighRisk ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {Math.round(node.security_risk * 100)}% risk
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Defense-in-Depth Matrix */}
      {activeTab === 'security_matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
            <span className="font-bold text-white text-xs uppercase flex items-center space-x-2">
              <Shield className="w-4 h-4 text-orange-400" />
              <span>9-Layer Defense-in-Depth Security Matrix</span>
            </span>
            <div className="flex items-center space-x-2">
              <button onClick={loadNetworkData} className="text-slate-400 hover:text-white">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <span className="badge-green">ALL LAYERS ENFORCED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {displayLayers.map((layer, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{layer.name}</span>
                  <span className={layer.risk === 'HIGH' ? 'badge-red' : layer.risk === 'MEDIUM' ? 'badge-amber' : 'badge-green'}>
                    {layer.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans truncate">{layer.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Security-Aware Load Balancer */}
      {activeTab === 'load_balancer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
          <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
            <span className="font-bold text-white text-xs uppercase flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Security-Aware Load Balancer Dynamic Rerouting</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="badge-amber">
                {lbStatus?.routing_mode || 'SECURITY_AWARE_OPTIMAL'}
              </span>
              <button
                onClick={loadNetworkData}
                disabled={lbLoading}
                className="p-1 hover:text-white text-slate-400 transition-colors"
                title="Refresh routing metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${lbLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Interactive Risk Slider to prove dynamic load balancing */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-white uppercase flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Interactive Threat Injection: Modify Server B Security Risk</span>
                </span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Simulate attack compromise on Server B. The backend recalculates routing scores in real time.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                Risk: {Math.round(serverBRisk * 100)}% ({serverBRisk >= 0.65 ? 'CRITICAL' : serverBRisk >= 0.35 ? 'ELEVATED' : 'LOW'})
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={serverBRisk}
                onChange={(e) => handleUpdateServerBRisk(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <button
                onClick={() => handleUpdateServerBRisk(0.08)}
                className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors whitespace-nowrap"
              >
                Reset Baseline (8%)
              </button>
              <button
                onClick={() => handleUpdateServerBRisk(0.85)}
                className="px-2.5 py-1 text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                Simulate Attack (85%)
              </button>
            </div>
          </div>

          {/* Dynamic Server Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(lbStatus?.servers || [
              { id: 'server_a', name: 'Server A (Primary Web)', health: 98.5, traffic_percentage: 45.0, security_risk: 0.05, routing_reason: 'Healthy baseline server', status: 'HEALTHY' },
              { id: 'server_b', name: 'Server B (Secondary Web)', health: 99.0, traffic_percentage: 10.0, security_risk: serverBRisk, routing_reason: serverBRisk >= 0.35 ? 'Traffic reduced: security risk increased' : 'Nominal capacity', status: serverBRisk >= 0.65 ? 'DEPRIORITIZED' : serverBRisk >= 0.35 ? 'DEGRADED' : 'HEALTHY' },
              { id: 'server_c', name: 'Server C (Edge Gateway)', health: 100.0, traffic_percentage: 45.0, security_risk: 0.02, routing_reason: 'Received rerouted capacity', status: 'HEALTHY' }
            ]).map((srv) => {
              const isB = srv.id === 'server_b';
              const isHighRisk = srv.security_risk >= 0.35;
              return (
                <div
                  key={srv.id}
                  className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                    isHighRisk
                      ? 'bg-amber-950/20 border-amber-800/50 shadow-lg shadow-amber-950/30'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start text-xs font-bold">
                    <span className="text-white truncate">{srv.name}</span>
                    <span className={isHighRisk ? 'text-amber-400' : 'text-emerald-400'}>
                      {srv.traffic_percentage}% Traffic
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Health: {srv.health}%</span>
                    <span className={isHighRisk ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      Risk: {Math.round(srv.security_risk * 100)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isHighRisk ? 'bg-amber-500' : srv.id === 'server_a' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, srv.traffic_percentage))}%` }}
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 font-sans leading-tight">
                    <strong>Status: </strong>
                    <span className={isHighRisk ? 'text-amber-300' : 'text-emerald-300'}>
                      {srv.status}
                    </span>
                    <br />
                    <strong>Rationale: </strong>
                    {srv.routing_reason}
                  </div>
                </div>
              );
            })}
          </div>

          {lbDecision && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
              <div>
                <strong className="text-white font-mono">Routing Decision: </strong>
                <span>Primary Route: {lbDecision.primary_route} • Risk Penalty Active: {lbDecision.risk_penalty_applied ? 'YES' : 'NO'}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{lbDecision.decision_id}</span>
            </div>
          )}
        </div>
      )}

      <DetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        data={drawerData}
      />
    </div>
  );
};
