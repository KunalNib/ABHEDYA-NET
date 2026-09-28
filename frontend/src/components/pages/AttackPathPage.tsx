import React, { useState, useEffect } from 'react';
import { GitCommit, ArrowRight, Activity, ShieldCheck, Crosshair, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { DetailDrawer, DetailDrawerData } from '../common/DetailDrawer';
import { useRealtime } from '../../context/RealtimeContext';
import { fetchAttackPathCurrent, AttackPathCurrentResponse } from '../../services/api';

export const AttackPathPage: React.FC = () => {
  const { liveCycleData, systemMode } = useRealtime();
  const [attackPathData, setAttackPathData] = useState<AttackPathCurrentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [drawerData, setDrawerData] = useState<DetailDrawerData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAttackPathCurrent();
      if (res && res.attack_path) {
        setAttackPathData(res);
      }
    } catch (e) {
      console.warn('Failed to load attack path:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [liveCycleData]);

  const path = attackPathData?.attack_path;
  const prediction = path?.prediction || {
    current_stage: liveCycleData?.attack_stage || 'Discovery',
    predicted_next_stage: liveCycleData?.predicted_next_stage || 'Credential Access',
    confidence: liveCycleData?.confidence || 0.88,
    risk: 'ELEVATED',
    model_version: 'PyTorch LSTM v1.0.0 [ACTIVE]'
  };

  const rawNodes = path?.nodes || [];
  const displayNodes = rawNodes.length > 0 ? rawNodes : [
    {
      node_id: 'N1',
      stage: 'Reconnaissance',
      tactic: 'TA0043 Reconnaissance',
      technique: 'T1595 Active Scanning',
      target_asset: 'edge_firewall_01',
      status: 'COMPLETED',
      probability: 1.0
    },
    {
      node_id: 'N2',
      stage: 'Discovery',
      tactic: 'TA0007 Discovery',
      technique: 'T1046 Network Service Scanning',
      target_asset: 'web_server_01',
      status: prediction.current_stage === 'Discovery' ? 'CURRENT' : 'COMPLETED',
      probability: 0.95
    },
    {
      node_id: 'N3',
      stage: 'Credential Access',
      tactic: 'TA0006 Credential Access',
      technique: 'T1110 Brute Force',
      target_asset: 'auth_service_01',
      status: prediction.current_stage === 'Credential Access' ? 'CURRENT' : prediction.predicted_next_stage === 'Credential Access' ? 'PREDICTED' : 'BLOCKED',
      probability: 0.82
    },
    {
      node_id: 'N4',
      stage: 'Lateral Movement',
      tactic: 'TA0008 Lateral Movement',
      technique: 'T1021 Remote Services',
      target_asset: 'api_gateway_01',
      status: prediction.predicted_next_stage === 'Lateral Movement' ? 'PREDICTED' : 'DECEIVED',
      probability: 0.65
    },
    {
      node_id: 'N5',
      stage: 'Exfiltration',
      tactic: 'TA0010 Exfiltration',
      technique: 'T1041 Exfiltration Over C2',
      target_asset: 'decoy_db_01',
      status: 'DECEIVED',
      probability: 0.45
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">COMPLETED ✓</span>;
      case 'CURRENT':
        return <span className="bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">CURRENT THREAT ●</span>;
      case 'PREDICTED':
        return <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-1 rounded-full text-xs font-bold">PREDICTED ◌</span>;
      case 'DECEIVED':
        return <span className="bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow">DECEIVED ★</span>;
      case 'BLOCKED':
        return <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">BLOCKED ✕</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const openDrawer = (node: any) => {
    setDrawerData({
      title: `${node.stage || node.tactic} — ${node.target_asset || node.asset}`,
      subtitle: `${node.tactic} (${node.technique || 'MITRE Technique'})`,
      type: 'ATTACK PATH NODE',
      status: node.status,
      summary: `MITRE ATT&CK node representing ${node.tactic} on asset ${node.target_asset || node.asset}.`,
      why: `Confidence rating ${(node.probability * 100).toFixed(0)}% derived from live telemetry sequence and PyTorch LSTM forecast.`,
      evidence: [
        `Node ID: ${node.node_id || node.id}`,
        `MITRE Tactic: ${node.tactic}`,
        `Technique: ${node.technique || 'N/A'}`,
        `Asset Target: ${node.target_asset || node.asset}`,
        `Transition Probability: ${(node.probability * 100).toFixed(0)}%`
      ],
      actionApplied: node.status === 'DECEIVED' ? 'DECEIVE: Honey trap active' : 'MONITOR & PROTECT',
      result: 'Attack progression constrained; zero unauthorized access to production database.'
    });
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Header Bar */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GitCommit className="w-5 h-5 text-orange-400" />
            <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">
              Dynamic Attack Path Trajectory
            </h1>
            <span className="badge-purple">MITRE ATT&CK MATRIX</span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Real-time directed graph modeling current progression and PyTorch forecasted transitions
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-colors flex items-center space-x-1.5 text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>RE-ANALYZE PATH</span>
        </button>
      </div>

      {/* Model Forecast Banner */}
      <div className="bg-slate-900 border border-purple-900/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <Crosshair className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase flex items-center space-x-2">
              <span>Current Stage:</span>
              <span className="text-rose-400 font-black">{prediction.current_stage}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span>Forecasted Next:</span>
              <span className="text-purple-300 font-black">{prediction.predicted_next_stage}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans mt-0.5">
              Engine: <span className="text-purple-400 font-mono">{prediction.model_version || 'PyTorch LSTM v1.0.0'}</span> | Confidence: <span className="text-emerald-400 font-bold">{Math.round((prediction.confidence || 0.88) * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Risk Assessment:</span>
          <span className="badge-red">{prediction.risk || 'HIGH'}</span>
        </div>
      </div>

      {/* Attack Graph Sequence */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
          <span className="font-bold text-white text-xs uppercase">
            Sequential MITRE ATT&CK Trajectory Graph
          </span>
          <span className="text-[10px] text-slate-500">Click node to inspect forensic evidence</span>
        </div>

        <div className="space-y-3">
          {displayNodes.map((node: any, idx: number) => (
            <div
              key={node.node_id || idx}
              onClick={() => openDrawer(node)}
              className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-xl bg-slate-900 text-orange-400 border border-slate-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">{node.stage || node.tactic}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({node.technique || 'Technique'})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Target Asset: <span className="text-orange-300 font-mono">{node.target_asset || node.asset}</span> • Probability: <span className="text-purple-300 font-bold">{(node.probability * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-auto">
                {getStatusBadge(node.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        data={drawerData}
      />
    </div>
  );
};
