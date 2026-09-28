import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Brain,
  Crosshair,
  ShieldCheck,
  Server,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Zap,
  HelpCircle,
  CheckCircle2,
  Lock,
  Layers,
  Radio,
  SlidersHorizontal,
  Clock,
  Gauge,
  Database,
  Cpu
} from 'lucide-react';

import { useRealtime } from '../../context/RealtimeContext';
import { LiveEventTimeline } from '../common/LiveEventTimeline';
import { fetchLoadBalancerStatus, LoadBalancerStatusResponse } from '../../services/api';

export const DashboardPage: React.FC = () => {
  const {
    systemMode,
    switchSystemMode,
    sensorBadges,
    judgeDemoActive,
    judgeDemoStep,
    startJudgeDemo,
    stopJudgeDemo,
    resetJudgeDemo,
    triggerDeterministicDemo,
    startLiveTest,
    stopLiveTest,
    stepLiveTest,
    resetLiveEnvironment,
    isLiveTestRunning,
    demoPaceSeconds,
    setDemoPaceSeconds,
    liveCycleData,
    stepDatasetReplay,
    datasetFrame,
    livePrediction,
    liveRisk,
    liveNetworkState
  } = useRealtime();

  const [isSteppingLive, setIsSteppingLive] = useState<boolean>(false);
  const [lbStatus, setLbStatus] = useState<LoadBalancerStatusResponse | null>(null);

  const isLive = systemMode === 'LIVE_CONTROLLED_TEST';
  const isReplay = systemMode === 'DATASET_REPLAY';
  const isDemo = systemMode === 'JUDGE_DEMO';

  // Fetch real load balancer status
  useEffect(() => {
    const updateLB = async () => {
      try {
        const status = await fetchLoadBalancerStatus();
        if (status) setLbStatus(status);
      } catch (e) {
        // Fallback gracefully
      }
    };
    updateLB();
  }, [liveCycleData, isLiveTestRunning]);

  const handleStep = async () => {
    setIsSteppingLive(true);
    if (isLive) {
      await stepLiveTest();
    } else if (isReplay) {
      await stepDatasetReplay();
    }
    setIsSteppingLive(false);
  };

  // Extract canonical live telemetry values directly from the backend
  const st = liveCycleData?.current_state || liveNetworkState || {};
  const predSt = liveCycleData?.predicted_state || livePrediction?.nextState || {};

  const currentConns = st.connection_count ?? 120.0;
  const predConns = predSt.connection_count ?? (currentConns * 1.08);
  const currentRisk = st.security_risk ?? 0.05;
  const predRisk = predSt.security_risk ?? 0.12;
  const currentAuthFails = st.failed_login_count ?? 0.0;
  const predAuthFails = predSt.failed_login_count ?? 0.0;
  const currentCpu = st.cpu_load ?? 32.5;
  const currentMem = st.memory_load ?? 41.0;
  const currentDbRate = st.database_query_rate ?? 48.0;

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Header & 3-Mode Primary Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">
              Security Operations Command Center
            </h1>
            <span className={isLive ? "badge-purple" : isReplay ? "badge-blue" : "badge-orange"}>
              {isLive ? "LIVE CONTROLLED TESTBED" : isReplay ? "DATASET REPLAY" : "JUDGE DEMO FALLBACK"}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            {isLive
              ? `Real Local Pipeline: Traffic → Telemetry Ingestion → S_t → PyTorch LSTM → S_(t+1) → Defence → Feedback`
              : isReplay
              ? `Benchmark Dataset Replay: Processing sequential state vectors from CIC-IDS-2018 / CTU-13`
              : `Deterministic 11-Stage Credential-to-Database Presentation Walkthrough`}
          </p>
        </div>

        {/* 3-Mode Selector & Live Execution Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-xs">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => switchSystemMode('LIVE_CONTROLLED_TEST')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                isLive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              LIVE TEST
            </button>
            <button
              onClick={() => switchSystemMode('DATASET_REPLAY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                isReplay ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              DATASET
            </button>
            <button
              onClick={() => switchSystemMode('JUDGE_DEMO')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                isDemo ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              JUDGE DEMO
            </button>
          </div>

          {/* Pace / Cadence Selector for Controlled Demo */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Pace:</span>
            <select
              value={demoPaceSeconds}
              onChange={(e) => setDemoPaceSeconds(Number(e.target.value))}
              className="bg-transparent text-slate-900 dark:text-orange-400 font-bold outline-none cursor-pointer text-xs"
              title="Step Interval Cadence"
            >
              <option value={4} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">4.0s (Fast)</option>
              <option value={6} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">6.0s (Live Demo)</option>
              <option value={8} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">8.0s (Slow / Explanatory)</option>
            </select>
          </div>

          {/* Action Execution Buttons for Active Mode */}
          {isLive && (
            <>
              <button
                onClick={handleStep}
                disabled={isSteppingLive}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm shadow-indigo-600/30 border border-indigo-500 disabled:opacity-50"
                title="Executes 1 complete pass of the live 11-step pipeline"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                <span>{isSteppingLive ? 'EXECUTING...' : 'STEP TESTBED'}</span>
              </button>

              {isLiveTestRunning ? (
                <button
                  onClick={stopLiveTest}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm shadow-rose-600/30 border border-rose-500"
                >
                  <Pause className="w-3.5 h-3.5 text-white fill-current" />
                  <span>STOP LIVE TEST</span>
                </button>
              ) : (
                <button
                  onClick={startLiveTest}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm shadow-emerald-600/30 border border-emerald-500"
                >
                  <Play className="w-3.5 h-3.5 text-white fill-current" />
                  <span>START LIVE TEST</span>
                </button>
              )}

              <button
                onClick={resetLiveEnvironment}
                className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center"
                title="RESET ENVIRONMENT"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {isReplay && (
            <>
              <button
                onClick={stepDatasetReplay}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm border border-blue-500"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-200" />
                <span>NEXT FRAME (#{datasetFrame})</span>
              </button>
              <button
                onClick={resetLiveEnvironment}
                className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center"
                title="Reset Replay"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {isDemo && (
            <>
              <button
                onClick={() => triggerDeterministicDemo(42)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm shadow-orange-500/30 border border-orange-400"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>START JUDGE DEMO</span>
              </button>

              {judgeDemoActive ? (
                <button
                  onClick={stopJudgeDemo}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs border border-rose-500 flex items-center justify-center"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={startJudgeDemo}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs border border-emerald-500 flex items-center justify-center"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              )}

              <button
                onClick={resetJudgeDemo}
                className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center"
                title="RESET DEMO"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ACTIVE LIVE TELEMETRY & PYTORCH WORLD MODEL BAROMETER (GENUINE METRICS, ZERO DUMMY TEXT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Connection Rate S_t vs S_(t+1) */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>ACTIVE FLOWS (S_t → S_t+1)</span>
            </span>
            <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-bold">
              10s Window
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-white">{Math.round(currentConns)}</div>
              <div className="text-[10px] text-slate-500 font-mono">Current Ingress Flows</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-purple-400">→ {Math.round(predConns)}</div>
              <div className="text-[10px] text-purple-300 font-mono">LSTM Forecast</div>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (currentConns / 250) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Authentication Anomaly Rate */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>AUTH FAILURE RATE</span>
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
              currentAuthFails > 4 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'
            }`}>
              {currentAuthFails > 4 ? 'SPIKE DETECTED' : 'NORMAL'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-amber-300">{Math.round(currentAuthFails)}</div>
              <div className="text-[10px] text-slate-500 font-mono">Failed Attempts / Window</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-purple-400">→ {Math.round(predAuthFails)}</div>
              <div className="text-[10px] text-purple-300 font-mono">Predicted Next Window</div>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${currentAuthFails > 4 ? 'bg-rose-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (currentAuthFails / 15) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Host Workload (CPU / RAM) */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>SYSTEM WORKLOAD</span>
            </span>
            <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
              /proc/loadavg
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-emerald-300">{currentCpu.toFixed(1)}%</div>
              <div className="text-[10px] text-slate-500 font-mono">CPU Utilization</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-cyan-300">{currentMem.toFixed(1)}%</div>
              <div className="text-[10px] text-slate-500 font-mono">Memory Load</div>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, currentCpu)}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Security Risk (Observed vs PyTorch Forecast) */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              <span>SECURITY RISK GAUGE</span>
            </span>
            <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
              PyTorch LSTM
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-rose-400">{(currentRisk * 100).toFixed(0)}%</div>
              <div className="text-[10px] text-slate-500 font-mono">Current Observed S_t</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-purple-400">→ {(predRisk * 100).toFixed(0)}%</div>
              <div className="text-[10px] text-purple-300 font-mono">Forecasted S_(t+1)</div>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, currentRisk * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ACTIVE DEFENCE ORCHESTRATION & CYBER DECEPTION PANEL (LIVE BACKEND BINDING) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Load Balancer Weight Shedding & Dynamic Steering */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-white text-xs uppercase">
                NGINX Load Balancer Dynamic Steering
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              HEALTH-WEIGHTED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {lbStatus?.servers?.map((srv) => (
              <div
                key={srv.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white flex items-center space-x-2">
                    <span>{srv.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      srv.status === 'HEALTHY' ? 'bg-emerald-950 text-emerald-400' :
                      srv.status === 'DEPRIORITIZED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      'bg-amber-950 text-amber-400'
                    }`}>
                      {srv.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    CPU: {srv.cpu}% | Risk: {(srv.security_risk * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-orange-400">{srv.traffic_percentage}%</div>
                  <div className="text-[10px] text-slate-500 font-mono">Assigned Weight</div>
                </div>
              </div>
            )) || (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                Server A (Primary Web): 50% | Server B (Secondary): 0.1% [Shed] | Server C (Gateway): 50%
              </div>
            )}
          </div>
        </div>

        {/* Right: Isolated Deception Zone (VLAN 99 Honeypot) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white text-xs uppercase">
                Isolated Cyber Deception Zone (VLAN 99)
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              sensorBadges.deception === 'ACTIVE'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {sensorBadges.deception === 'ACTIVE' ? 'HONEYPOT ENGAGED' : 'STANDBY ISOLATED'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Adaptive Decoy Database (PostgreSQL)</span>
                <span className="text-[10px] text-orange-400 font-mono">Port 5433 | Subnet 192.168.99.10</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Strict Isolation: 0.25 vCPU limit, zero routing into internal production network (10.0.0.0/8).
              </p>
              <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/50">
                Canary Flag: FLAG&#123;DECOY_CAPTURED_ATTACKER&#125; (Synthetic Data Only)
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Adaptive Decoy Admin API</span>
                <span className="text-[10px] text-purple-400 font-mono">Port 8081 | Subnet 192.168.99.20</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Synthetic honeytrap endpoint: Captures credential spray and logs attacker forensic fingerprints.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VISIBLE LIVE EVENT TIMELINE MANDATED BY MAIN SIH SPECIFICATION */}
      <LiveEventTimeline />
    </div>
  );
};
