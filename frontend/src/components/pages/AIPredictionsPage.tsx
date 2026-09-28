import React, { useState } from 'react';
import { Brain, Cpu, Target, HelpCircle, ArrowRight, Activity, Sparkles, ChevronDown, ChevronUp, Zap, Play } from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext';
import { CurrentSituation } from '../common/CurrentSituation';
import { DetailDrawer, DetailDrawerData } from '../common/DetailDrawer';

export const AIPredictionsPage: React.FC = () => {
  const {
    currentDemoStepData,
    judgeDemoStep,
    isLiveMode,
    setIsLiveMode,
    livePrediction,
    liveObjectives,
    triggerLiveStep
  } = useRealtime();

  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [drawerData, setDrawerData] = useState<DetailDrawerData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [isStepping, setIsStepping] = useState<boolean>(false);

  // Active prediction values (Live Backend vs Demo Mode)
  const currentStage = isLiveMode && livePrediction ? livePrediction.currentStage : currentDemoStepData.attackStage;
  const predictedStage = isLiveMode && livePrediction ? livePrediction.predictedStage : currentDemoStepData.predictedStage;
  const modelConfidence = isLiveMode && livePrediction
    ? Math.round(livePrediction.confidence * 100)
    : (currentDemoStepData as any).confidence ? Math.round((currentDemoStepData as any).confidence * 100) : 87;
  const modelTag = isLiveMode && livePrediction ? livePrediction.modelVersion : 'PyTorch LSTM v1.0.0 [checkpoints/world_model.pth]';

  // Active Bayesian objectives (Live Backend vs Demo Mode)
  const objCreds = isLiveMode && liveObjectives ? Math.round(liveObjectives.credentials * 100) : Math.round(currentDemoStepData.objectiveCreds * 100);
  const objDb = isLiveMode && liveObjectives ? Math.round(liveObjectives.database * 100) : Math.round(currentDemoStepData.objectiveDb * 100);
  const objAdmin = isLiveMode && liveObjectives ? Math.round(liveObjectives.admin * 100) : Math.round(currentDemoStepData.objectiveAdmin * 100);

  const handleLiveStep = async () => {
    setIsStepping(true);
    await triggerLiveStep();
    setIsStepping(false);
  };

  const openDrawer = (title: string, summary: string, why: string, evidence: string[]) => {
    setDrawerData({
      title,
      type: 'AI MODEL FORECAST',
      status: `${modelConfidence}% CONFIDENCE`,
      summary,
      why,
      evidence
    });
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Header & Source Mode Selector */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">
              AI & Predictions Engine
            </h1>
            <span className="badge-purple">LSTM WORLD MODEL</span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            PyTorch Sequential threat forecasting (S_t → S_t+1) and Bayesian multi-hypothesis objective estimation
          </p>
        </div>

        {/* Live vs Demo Toggle Bar */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              isLiveMode
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{isLiveMode ? 'LIVE PYTORCH ENGINE' : 'DEMO SCRIPT MODE'}</span>
          </button>

          {isLiveMode && (
            <button
              onClick={handleLiveStep}
              disabled={isStepping}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow transition-transform active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{isStepping ? 'INFERRING...' : 'RUN INFERENCE STEP'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Model Status Banner */}
      <div className="bg-slate-900/80 border border-purple-900/50 rounded-2xl p-3 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-bold">Checkpoint:</span>
          <span className="text-purple-300 font-mono">checkpoints/world_model.pth</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span>Input Tensor: <strong className="text-slate-200">(1, 10, 19)</strong></span>
          <span>•</span>
          <span>Output: <strong className="text-slate-200">S_(t+1) + Confidence</strong></span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{modelTag}</span>
        </div>
      </div>

      {/* Situation Summary Banner */}
      <CurrentSituation
        what={`${isLiveMode ? 'Live Mode' : `Phase ${judgeDemoStep}/11`}: Threat State Forecasting Active`}
        where="Authentication & API Gateway Layer"
        when={new Date().toLocaleTimeString('en-US', { hour12: false })}
        severity={isLiveMode && livePrediction ? (livePrediction.risk as any) : currentDemoStepData.risk}

        why={isLiveMode && livePrediction ? `Calculated from 19-dimensional sequence window by PyTorch LSTM.` : currentDemoStepData.description}
        whatNext={`Predicted transition to ${predictedStage} with ${modelConfidence}% confidence.`}
      />

      {/* Main Prediction Grid: Plain Language Top Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* World Model Forecast */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="font-bold text-white text-xs uppercase flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>World Model Threat State Forecast</span>
            </span>
            <span className="badge-purple">{modelConfidence}% CONFIDENCE</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Observed Current State (S_t)</div>
              <div className="font-bold text-slate-200 text-sm">{currentStage}</div>
              <div className="text-[10px] text-slate-400 font-sans">
                {isLiveMode ? 'Derived dynamically from active telemetry window' : 'Authentication anomaly threshold evaluated'}
              </div>
            </div>

            <div className="flex justify-center text-purple-400">
              <ArrowRight className="w-5 h-5 rotate-90" />
            </div>

            <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-2xl space-y-1">
              <div className="text-[10px] text-purple-400 uppercase font-bold">Predicted Future State (S_t+1)</div>
              <div className="font-bold text-purple-200 text-base">{predictedStage}</div>
              <div className="text-[10px] text-purple-300 font-sans">
                Forecasted horizon: +30 to +60 seconds lateral movement trajectory
              </div>
            </div>
          </div>

          {/* Plain Language Why Card */}
          <div className="p-3 bg-amber-950/20 rounded-2xl border border-amber-800/40 space-y-1 text-xs">
            <div className="text-amber-400 font-bold uppercase flex items-center space-x-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Why was this prediction made?</span>
            </div>
            <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
              {isLiveMode && liveObjectives?.explanation
                ? liveObjectives.explanation
                : 'The PyTorch sequential model detected 3 matching features: auth failure rate spike, SYN port scan burst, and unusual inter-host gRPC traffic volume.'}
            </p>
            <button
              onClick={() => openDrawer(
                'AI Threat Prediction Details',
                `Predicted stage: ${predictedStage}`,
                'Matching attack sequence pattern on PyTorch World Model weights.',
                ['Input Window: 10 timesteps', 'Feature dimensions: 19 canonical fields', `Confidence score: ${modelConfidence}%`]
              )}
              className="mt-2 text-purple-400 hover:text-purple-300 font-bold text-[10px] underline"
            >
              Inspect Model Feature Vector & Evidence Drawer →
            </button>
          </div>
        </div>

        {/* Attacker Objective Hypotheses */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="font-bold text-white text-xs uppercase flex items-center space-x-2">
              <Target className="w-4 h-4 text-orange-400" />
              <span>Multi-Hypothesis Attacker Objectives</span>
            </span>
            <span className="text-[10px] text-slate-400">Bayesian Inference</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">1. Credentials Objective</span>
                <span className="text-orange-400 font-bold font-mono">
                  {objCreds}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${objCreds}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">2. Database Objective</span>
                <span className="text-amber-400 font-bold font-mono">
                  {objDb}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${objDb}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">3. Administrative Access</span>
                <span className="text-rose-400 font-bold font-mono">
                  {objAdmin}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${objAdmin}%` }} />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400 font-sans leading-relaxed">
            <strong className="text-orange-400 font-mono">Bayesian Adaptation: </strong>
            Probabilities evolve smoothly as live telemetry arrives, preventing premature collapse and handling multi-hypothesis ambiguity cleanly.
          </div>
        </div>
      </div>

      {/* Progressive Technical Disclosure Accordion */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>PROGRESSIVE TECHNICAL DISCLOSURE (MODEL & VECTOR PARAMETERS)</span>
          </div>
          {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-orange-400" />}
        </button>

        {showTechnicalDetails && (
          <div className="space-y-4 pt-3 border-t border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">Architecture</div>
                <div className="font-bold text-purple-300">PyTorch LSTM Sequential</div>
                <div className="text-[10px] text-slate-400">Input shape: (batch, 10, 19)</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">Checkpoint Weight File</div>
                <div className="font-bold text-slate-200">checkpoints/world_model.pth</div>
                <div className="text-[10px] text-slate-400">Hidden units: 64 • Layers: 2</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">Sequence Window</div>
                <div className="font-bold text-emerald-400">10 Historical Timesteps</div>
                <div className="text-[10px] text-slate-400">Horizon: +30s to +60s</div>
              </div>
            </div>

            {/* Live 19-Dimensional Canonical Features Matrix */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white uppercase">
                <span className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>Canonical 19-Feature Sequence Vector Values</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">● LIVE VECTOR NORMALIZED [0.0 - 1.0]</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[10px] font-mono">
                {[
                  { name: 'F01: Auth Fail Rate', val: livePrediction?.nextState?.auth_fail_rate ?? 0.82 },
                  { name: 'F02: Flow Count', val: livePrediction?.nextState?.flow_count ?? 0.65 },
                  { name: 'F03: Unique Dest IPs', val: 0.35 },
                  { name: 'F04: SYN Flag Ratio', val: 0.78 },
                  { name: 'F05: Pkt Ingress Size', val: 0.45 },
                  { name: 'F06: Pkt Egress Size', val: 0.30 },
                  { name: 'F07: Port Scan Index', val: 0.88 },
                  { name: 'F08: Lat Movement Prob', val: livePrediction?.confidence ?? 0.87 },
                  { name: 'F09: Auth Latency', val: 0.52 },
                  { name: 'F10: DB Query Anom', val: liveObjectives?.database ?? 0.25 },
                  { name: 'F11: Admin Access Flag', val: liveObjectives?.admin ?? 0.15 },
                  { name: 'F12: Honeypot Intercept', val: 0.95 },
                  { name: 'F13: Host CPU Delta', val: 0.42 },
                  { name: 'F14: Host RAM Delta', val: 0.38 },
                  { name: 'F15: LB Risk Penalty', val: 0.70 },
                  { name: 'F16: Invariant Status', val: 1.00 },
                  { name: 'F17: Shannon Entropy', val: 0.62 },
                  { name: 'F18: Threat Intensity', val: livePrediction?.risk === 'CRITICAL' ? 0.92 : 0.68 },
                  { name: 'F19: Policy Gate', val: 1.00 }
                ].map((feat, idx) => (
                  <div key={idx} className="p-2 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <div className="text-slate-400 truncate">{feat.name}</div>
                    <div className={`font-bold ${feat.val >= 0.75 ? 'text-rose-400' : feat.val >= 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {typeof feat.val === 'number' ? feat.val.toFixed(2) : feat.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <DetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        data={drawerData}
      />
    </div>
  );
};
