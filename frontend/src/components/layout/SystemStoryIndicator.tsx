import React from 'react';
import { useRealtime } from '../../context/RealtimeContext';

export interface WorkflowStage {
  id: string;
  label: string;
  stepNum: number;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  { id: 'OBSERVE', label: 'OBSERVE', stepNum: 1 },
  { id: 'MODEL', label: 'MODEL', stepNum: 3 },
  { id: 'PREDICT', label: 'PREDICT', stepNum: 4 },
  { id: 'ASSESS', label: 'ASSESS', stepNum: 6 },
  { id: 'DECIDE', label: 'DECIDE', stepNum: 7 },
  { id: 'ACT', label: 'ACT', stepNum: 9 },
  { id: 'FEEDBACK', label: 'FEEDBACK', stepNum: 11 }
];

export const SystemStoryIndicator: React.FC = () => {
  const { judgeDemoStep } = useRealtime();

  const getStageStatus = (stageStepNum: number) => {
    if (judgeDemoStep > stageStepNum + 1) return 'COMPLETED';
    if (judgeDemoStep >= stageStepNum - 1 && judgeDemoStep <= stageStepNum + 1) return 'ACTIVE';
    return 'UPCOMING';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 font-mono text-xs select-none shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="text-slate-700 dark:text-slate-400 font-bold uppercase">System Defence Cycle:</span>
          <span className="text-orange-700 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800/40 text-[10px]">
            OBSERVE → PREDICT → DEFEND → DECEIVE → LEARN
          </span>
        </div>

        {/* Stepper Flow */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-0.5">
          {WORKFLOW_STAGES.map((stage, idx) => {
            const status = getStageStatus(stage.stepNum);
            return (
              <React.Fragment key={stage.id}>
                <div
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    status === 'ACTIVE'
                      ? 'bg-orange-500 text-white border-orange-600 shadow-sm ring-2 ring-orange-400/40 animate-pulse'
                      : status === 'COMPLETED'
                      ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-slate-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900 shadow-xs'
                  }`}
                  title={`Stage ${stage.label}`}
                >
                  <span>{stage.label}</span>
                  {status === 'COMPLETED' && <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">✓</span>}
                  {status === 'ACTIVE' && <span className="text-white">●</span>}
                  {status === 'UPCOMING' && <span className="text-slate-500 dark:text-slate-600">○</span>}
                </div>

                {idx < WORKFLOW_STAGES.length - 1 && (
                  <span className="text-slate-400 dark:text-slate-600 text-[10px] font-bold">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
