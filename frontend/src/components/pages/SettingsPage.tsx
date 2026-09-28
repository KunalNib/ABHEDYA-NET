import React, { useState } from 'react';
import { Settings, User as UserIcon, Sliders, Shield, Brain, Radio, CheckCircle2, Clock, Zap, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useTheme } from '../../context/ThemeContext';
import { RoleGuard } from '../auth/RoleGuard';

export const SettingsPage: React.FC = () => {
  const { user, environment, setEnvironment } = useAuth();
  const { role } = usePermission();
  const { demoPaceSeconds, setDemoPaceSeconds, systemMode } = useRealtime();
  const { theme, toggleTheme } = useTheme();

  // Active configurable parameters
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('chronos_conf_thresh');
    return saved ? parseFloat(saved) : 0.75;
  });
  const [predictionHorizon, setPredictionHorizon] = useState<string>(() => {
    return localStorage.getItem('chronos_pred_horizon') || '+30s';
  });
  const [alertSensitivity, setAlertSensitivity] = useState<string>(() => {
    return localStorage.getItem('chronos_alert_sens') || 'HIGH';
  });
  const [decoyPort, setDecoyPort] = useState<number>(5433);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('chronos_conf_thresh', confidenceThreshold.toString());
    localStorage.setItem('chronos_pred_horizon', predictionHorizon);
    localStorage.setItem('chronos_alert_sens', alertSensitivity);
    localStorage.setItem('chronos_decoy_port', decoyPort.toString());

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Header Bar */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-orange-400" />
            <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">
              Command Center Configuration
            </h1>
            <span className="badge-orange">ACTIVE PARAMETERS</span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            System configurations, model inference thresholds, demo pacing, and environment policies
          </p>
        </div>

        {saveSuccess && (
          <div className="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-400 text-xs font-bold flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configuration saved & active</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operator Profile & Environment */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <UserIcon className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-white text-xs uppercase">Operator Session & Environment</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Operator Identity:</span>
              <strong className="text-white">{user?.name || 'Administrator'}</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Authenticated Email:</span>
              <strong className="text-slate-300">{user?.email || 'admin@defence.local'}</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Assigned RBAC Role:</span>
              <span className="badge-orange">{role}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Active Testbed Mode:</span>
              <strong className="text-emerald-400">{systemMode}</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Appearance Mode:</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold hover:border-slate-700 transition-colors"
              >
                {theme === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
                <span className={theme === 'light' ? 'text-amber-600' : 'text-slate-300'}>{theme.toUpperCase()} MODE</span>
              </button>
            </div>
            <div className="space-y-1.5 pt-1">
              <label className="text-slate-400 text-[11px] uppercase font-bold">Execution Environment:</label>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {(['LOCAL DEFENCE LAB', 'DATASET REPLAY', 'JUDGE DEMO'] as const).map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setEnvironment(env)}
                    className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all ${
                      environment === env
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Realtime & Model Thresholds Form */}
        <form onSubmit={handleSaveConfig} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white text-xs uppercase">AI World Model & Live Cadence Parameters</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Confidence Threshold Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Prediction Confidence Gate:</span>
                <span className="font-bold text-emerald-400">
                  {Math.round(confidenceThreshold * 100)}% Threshold
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-[10px] text-slate-500 font-sans">
                Only predictions with confidence above this gate trigger autonomous mitigation actions.
              </p>
            </div>

            {/* Prediction Horizon */}
            <div className="space-y-1.5">
              <span className="text-slate-400">LSTM Forecast Horizon:</span>
              <div className="grid grid-cols-3 gap-2">
                {['+15s', '+30s', '+60s'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setPredictionHorizon(h)}
                    className={`py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      predictionHorizon === h
                        ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {h} Horizon
                  </button>
                ))}
              </div>
            </div>

            {/* Live Demo Pacing Cadence */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Live Demo Cycle Cadence:</span>
                </span>
                <span className="font-bold text-orange-400">{demoPaceSeconds}s per cycle</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { pace: 4.0, label: '4.0s Fast' },
                  { pace: 6.0, label: '6.0s Default' },
                  { pace: 8.0, label: '8.0s Slow' }
                ].map((item) => (
                  <button
                    key={item.pace}
                    type="button"
                    onClick={() => setDemoPaceSeconds(item.pace)}
                    className={`py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      demoPaceSeconds === item.pace
                        ? 'bg-orange-600/30 border-orange-500 text-orange-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 font-sans">
                Controls the time between automated closed-loop steps to provide sufficient time for judge evaluation.
              </p>
            </div>

            {/* Deception Honeypot Configuration */}
            <div className="flex justify-between items-center py-2 border-t border-slate-800/60">
              <span className="text-slate-400">Decoy DB Port (VLAN 99):</span>
              <input
                type="number"
                value={decoyPort}
                onChange={(e) => setDecoyPort(parseInt(e.target.value) || 5433)}
                className="w-24 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-right text-orange-400 font-mono font-bold"
              />
            </div>
          </div>

          <RoleGuard permission="manage_config" mode="disable">
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs uppercase rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>SAVE & APPLY CONFIGURATION</span>
            </button>
          </RoleGuard>
        </form>
      </div>
    </div>
  );
};
