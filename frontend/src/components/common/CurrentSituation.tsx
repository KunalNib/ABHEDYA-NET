import React from 'react';
import { AlertTriangle, Clock, MapPin, ShieldAlert, ArrowRight, Activity, HelpCircle } from 'lucide-react';

export interface CurrentSituationProps {
  what: string;
  where: string;
  when: string;
  severity: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  why: string;
  whatNext: string;
  affectedAssets?: string[];
  compact?: boolean;
}

export const CurrentSituation: React.FC<CurrentSituationProps> = ({
  what,
  where,
  when,
  severity,
  why,
  whatNext,
  affectedAssets = [],
  compact = false
}) => {
  const getSeverityBadge = () => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-extrabold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CRITICAL SITUATION</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/40 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>HIGH RISK</span>
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>ELEVATED ANOMALY</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>NOMINAL BASELINE</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 font-mono select-none relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-orange-500 dark:text-orange-400" />
          <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
            Current Situation Assessment
          </h3>
        </div>
        {getSeverityBadge()}
      </div>

      {/* Main Grid: WHAT, WHERE, WHEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-orange-500 dark:text-orange-400" />
            <span>WHAT HAS HAPPENED</span>
          </div>
          <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">{what}</div>
        </div>

        <div className="p-3 bg-blue-50/70 dark:bg-slate-950/80 rounded-2xl border border-blue-200 dark:border-slate-800 space-y-1">
          <div className="text-[10px] text-blue-700 dark:text-blue-400 uppercase font-bold flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>WHERE (TARGET ASSET)</span>
          </div>
          <div className="font-bold text-blue-900 dark:text-blue-300 text-xs truncate">{where}</div>
          {affectedAssets.length > 0 && (
            <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
              Also: {affectedAssets.join(', ')}
            </div>
          )}
        </div>

        <div className="p-3 bg-purple-50/70 dark:bg-slate-950/80 rounded-2xl border border-purple-200 dark:border-slate-800 space-y-1">
          <div className="text-[10px] text-purple-700 dark:text-purple-400 uppercase font-bold flex items-center space-x-1">
            <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>WHEN / TIMESTAMP</span>
          </div>
          <div className="font-bold text-purple-900 dark:text-purple-200 text-xs font-mono">{when}</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Live Telemetry Stream</div>
        </div>
      </div>

      {/* WHY & WHAT NEXT Explanations */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-amber-50/90 dark:bg-slate-950/50 rounded-2xl border border-amber-200 dark:border-slate-800/80 space-y-1">
            <div className="text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase flex items-center space-x-1">
              <HelpCircle className="w-3 h-3" />
              <span>WHY (TOP EVIDENTIAL REASON)</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-sans">{why}</p>
          </div>

          <div className="p-3 bg-indigo-50/90 dark:bg-purple-950/20 rounded-2xl border border-indigo-200 dark:border-purple-800/40 space-y-1">
            <div className="text-[10px] text-indigo-800 dark:text-purple-400 font-bold uppercase flex items-center space-x-1">
              <ArrowRight className="w-3 h-3" />
              <span>WHAT NEXT (AI FORECAST)</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-purple-200 leading-relaxed font-sans">{whatNext}</p>
          </div>
        </div>
      )}
    </div>
  );
};
