import React from 'react';
import {
  Shield,
  Activity,
  Brain,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime, SystemExecutionMode } from '../../context/RealtimeContext';

export const GlobalContextBar: React.FC = () => {
  const {
    systemMode,
    switchSystemMode,
    sensorBadges,
    isLiveTestRunning,
    startLiveTest,
    stopLiveTest,
    stepLiveTest,
    resetLiveEnvironment,
    stepDatasetReplay,
    datasetFrame,
    judgeDemoActive,
    judgeDemoStep,
    startJudgeDemo,
    stopJudgeDemo,
    resetJudgeDemo,
    triggerDeterministicDemo
  } = useRealtime();

  return (
    <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2 font-mono text-xs select-none shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Left: 3-Way Mode Switcher */}
      <div className="flex items-center space-x-2">
        <span className="text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1">
          <SlidersHorizontal className="w-3 h-3 text-orange-500 dark:text-orange-400" />
          <span>SYSTEM MODE:</span>
        </span>

        <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-xl">
          <button
            onClick={() => switchSystemMode('LIVE_CONTROLLED_TEST')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1.5 ${
              systemMode === 'LIVE_CONTROLLED_TEST'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${systemMode === 'LIVE_CONTROLLED_TEST' ? 'bg-emerald-300 animate-ping' : 'bg-slate-400 dark:bg-slate-600'}`} />
            <span>LIVE CONTROLLED TEST</span>
          </button>

          <button
            onClick={() => switchSystemMode('DATASET_REPLAY')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1.5 ${
              systemMode === 'DATASET_REPLAY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${systemMode === 'DATASET_REPLAY' ? 'bg-cyan-300' : 'bg-slate-400 dark:bg-slate-600'}`} />
            <span>DATASET REPLAY</span>
          </button>

          <button
            onClick={() => switchSystemMode('JUDGE_DEMO')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1.5 ${
              systemMode === 'JUDGE_DEMO'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${systemMode === 'JUDGE_DEMO' ? 'bg-amber-300' : 'bg-slate-400 dark:bg-slate-600'}`} />
            <span>JUDGE DEMO</span>
          </button>
        </div>
      </div>

      {/* Center: Mandated Live Mode Badges */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        {/* Telemetry Badge */}
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold">Telemetry:</span>
          <span className="flex items-center space-x-1 font-extrabold text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>● LIVE</span>
          </span>
        </div>

        {/* Network State Badge */}
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold">Network State:</span>
          <span className="flex items-center space-x-1 font-extrabold text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>● LIVE</span>
          </span>
        </div>

        {/* AI Badge */}
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold">AI:</span>
          <span className="flex items-center space-x-1 font-extrabold text-purple-700 dark:text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-spin" />
            <span>● RUNNING</span>
          </span>
        </div>

        {/* LLM Badge */}
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold">LLM:</span>
          <span className={`font-extrabold ${sensorBadges.llm === 'CONNECTED' ? 'text-sky-700 dark:text-cyan-400' : 'text-amber-700 dark:text-amber-400'}`}>
            ● {sensorBadges.llm}
          </span>
        </div>

        {/* Deception Badge */}
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold">Deception:</span>
          <span className={`font-extrabold ${sensorBadges.deception === 'ACTIVE' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {sensorBadges.deception}
          </span>
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="flex items-center space-x-2">
        {systemMode === 'LIVE_CONTROLLED_TEST' && (
          <>
            <button
              onClick={stepLiveTest}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-[11px] rounded-lg flex items-center space-x-1 shadow-sm border border-indigo-500 transition-all"
              title="Execute 1 Live Pipeline Step"
            >
              <Zap className="w-3 h-3 text-amber-300 fill-current" />
              <span>STEP</span>
            </button>

            {isLiveTestRunning ? (
              <button
                onClick={stopLiveTest}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-[11px] rounded-lg flex items-center space-x-1 shadow-sm border border-rose-500 transition-all"
              >
                <Pause className="w-3 h-3 text-white fill-current" />
                <span>STOP LIVE TEST</span>
              </button>
            ) : (
              <button
                onClick={startLiveTest}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[11px] rounded-lg flex items-center space-x-1 shadow-sm border border-emerald-500 transition-all"
              >
                <Play className="w-3 h-3 text-white fill-current" />
                <span>START LIVE TEST</span>
              </button>
            )}

            <button
              onClick={resetLiveEnvironment}
              className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg text-[11px] font-bold shadow-xs transition-colors"
              title="Reset Live Environment to Baseline"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </>
        )}

        {systemMode === 'DATASET_REPLAY' && (
          <>
            <button
              onClick={stepDatasetReplay}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-[11px] rounded-lg flex items-center space-x-1 shadow-sm border border-blue-500 transition-all"
            >
              <Zap className="w-3 h-3 text-cyan-200" />
              <span>STEP DATASET (#{datasetFrame})</span>
            </button>

            <button
              onClick={resetLiveEnvironment}
              className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg text-[11px] font-bold shadow-xs transition-colors"
              title="Reset Dataset Replay"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </>
        )}

        {systemMode === 'JUDGE_DEMO' && (
          <>
            <button
              onClick={() => triggerDeterministicDemo(42)}
              className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 active:scale-95 text-white font-extrabold text-[11px] rounded-lg flex items-center space-x-1 shadow-sm border border-orange-400 transition-all"
            >
              <Sparkles className="w-3 h-3 text-white" />
              <span>START JUDGE DEMO</span>
            </button>

            {judgeDemoActive ? (
              <button
                onClick={stopJudgeDemo}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs border border-rose-500 flex items-center justify-center"
              >
                <Pause className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={startJudgeDemo}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs border border-emerald-500 flex items-center justify-center"
              >
                <Play className="w-3 h-3 fill-current" />
              </button>
            )}

            <button
              onClick={resetJudgeDemo}
              className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg text-[11px] font-bold shadow-xs transition-colors"
              title="RESET DEMO"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
