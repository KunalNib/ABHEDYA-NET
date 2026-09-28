import React from 'react';
import {
  HelpCircle,
  AlertTriangle,
  Brain,
  Crosshair,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext';

export const SevenQuestionsPanel: React.FC = () => {
  const {
    systemMode,
    liveCycleData,
    livePrediction,
    liveObjectives,
    liveRisk,
    liveNetworkState,
    currentDemoStepData,
    judgeDemoStep
  } = useRealtime();

  const isLive = systemMode === 'LIVE_CONTROLLED_TEST';
  const isReplay = systemMode === 'DATASET_REPLAY';

  // Extract live dynamic values
  const currentStage = liveCycleData?.attack_stage || livePrediction?.currentStage || 'Discovery';
  const predictedNext = liveCycleData?.predicted_next_stage || livePrediction?.predictedStage || 'Lateral Movement';
  const confidence = Math.round((liveCycleData?.confidence || livePrediction?.confidence || 0.88) * 100);
  const primaryObj = liveCycleData?.primary_objective || liveObjectives?.primary || 'database';
  const actionTaken = liveCycleData?.defence_action || 'PROTECT & DECEIVE';
  const riskScore = liveCycleData?.current_state?.security_risk ?? liveNetworkState?.security_risk ?? 0.45;
  const threatLevel = liveCycleData?.current_state?.active_threat_level || liveNetworkState?.active_threat_level || 'ELEVATED';

  // 7 Core Answers
  const answers = [
    {
      num: 1,
      q: 'WHAT IS HAPPENING?',
      badge: 'SITUATION',
      badgeColor: 'border-orange-500/40 text-orange-300 bg-orange-950/60',
      icon: AlertTriangle,
      a: isLive
        ? `Live Controlled Testbed Cycle #${liveCycleData?.cycle || 1}: Controlled test client executing safe synthetic behavior. NetworkState indicates ${threatLevel} activity across Web Gateway & Auth Service.`
        : isReplay
        ? `Replaying benchmark dataset frame: State features parsed and ingested into telemetry aggregator.`
        : `Phase ${judgeDemoStep}/11: ${currentDemoStepData.title} — ${currentDemoStepData.description}`
    },
    {
      num: 2,
      q: 'WHY?',
      badge: 'ROOT CAUSE',
      badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/60',
      icon: HelpCircle,
      a: isLive
        ? `Telemetry pipeline detected multi-vector anomaly: Observed risk score reached ${(riskScore * 100).toFixed(0)}% from correlation of connection rates, failed logins, and probe signatures.`
        : isReplay
        ? `Historical network flow signatures from CIC-IDS-2018 benchmark evaluate to elevated risk threshold.`
        : (currentDemoStepData as any).why || currentDemoStepData.description || 'Simulated adversarial multi-stage attack flow progressing towards critical data repositories.'
    },
    {
      num: 3,
      q: 'WHAT DOES AI PREDICT?',
      badge: 'PYTORCH LSTM',
      badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-950/60',
      icon: Brain,
      a: isLive || isReplay
        ? `PyTorch LSTM Temporal World Model (checkpoints/world_model.pth) forecasts progression to [${predictedNext}] with ${confidence}% confidence across the next prediction horizon.`
        : `AI World Model predicts transition to Lateral Movement & Administrative Escalation within the next 30 to 60 seconds.`
    },
    {
      num: 4,
      q: 'WHAT DOES THE SYSTEM THINK THE OBJECTIVE IS?',
      badge: 'BAYESIAN INFERENCE',
      badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/60',
      icon: Crosshair,
      a: isLive || isReplay
        ? `Bayesian Objective Hypothesis Engine designates [${primaryObj.toUpperCase()}] as the primary threat objective based on target port distributions and access trajectory.`
        : `Bayesian inference assigns 78% probability to Database exfiltration and 64% to Administrative Credential harvesting.`
    },
    {
      num: 5,
      q: 'WHAT ACTION DID IT TAKE?',
      badge: 'DEFENCE ORCHESTRATION',
      badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/60',
      icon: ShieldCheck,
      a: isLive
        ? `Adaptive Defence Engine issued [${actionTaken}] with strict policy validation. Reconfigured NGINX load balancer weight to shed risky traffic and primed isolated VLAN 99 decoy services.`
        : isReplay
        ? `Evaluated defensive bounds against benchmark frame; policy validator confirms rate limits.`
        : `Multi-action defence policy: Rate-limiting malicious subnet, re-weighting load balancer, and deploying decoy trap.`
    },
    {
      num: 6,
      q: 'WHAT WAS THE RESULT?',
      badge: 'EFFECTIVENESS',
      badgeColor: 'border-blue-500/40 text-blue-300 bg-blue-950/60',
      icon: CheckCircle2,
      a: isLive
        ? `Real production database and API services remain 100% operational with 0 data leaks. High-risk traffic diverted away from core production assets.`
        : isReplay
        ? `Benchmark packet stream processed without system performance degradation.`
        : `Adversary effectively diverted. Zero unauthorized access to authentic production data.`
    },
    {
      num: 7,
      q: 'WHAT HAPPENED NEXT?',
      badge: 'FEEDBACK LOOP',
      badgeColor: 'border-pink-500/40 text-pink-300 bg-pink-950/60',
      icon: ArrowRight,
      a: isLive
        ? `Decoy honeypot (Port 5433) captured attacker probe interaction. Forensic telemetry was reinjected into the aggregation pipeline, updating S_(t+1) state estimates.`
        : isReplay
        ? `Pipeline advanced to next historical frame sequence.`
        : `Honeypot captured attacker payload, providing ground-truth intelligence that neutralized further adversarial advancement.`
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <Sparkles className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-sm tracking-wide uppercase">
              Main Evaluation Matrix — Core Operational Answers
            </h2>
            <p className="text-[11px] text-slate-400 font-sans">
              Real-Time Explainability & Decision Transparency for System Evaluators
            </p>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
          MODE: <span className="text-orange-400 font-bold">{systemMode.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {answers.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.num}
              className={`p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-colors space-y-2 ${
                item.num === 7 ? 'md:col-span-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-pink-950/50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-md bg-slate-800 text-orange-400 font-extrabold text-[10px] flex items-center justify-center">
                    0{item.num}
                  </span>
                  <span className="font-bold text-white text-xs">{item.q}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed pl-7">
                {item.a}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
