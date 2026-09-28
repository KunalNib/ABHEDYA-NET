import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';

export const GlobalStatusBar: React.FC = () => {
  const { environment } = useAuth();
  const { wsConnected, judgeDemoActive, sensorBadges, systemMode } = useRealtime();

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 px-4 py-1.5 font-mono text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2 select-none">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">Backend:</span>
          <span className={`font-bold ${sensorBadges?.network_state === 'LIVE' ? 'text-emerald-400' : 'text-slate-400'}`}>
            {sensorBadges?.network_state === 'LIVE' ? '● ONLINE (Port 8000)' : '○ STANDBY'}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">Database:</span>
          <span className="text-emerald-400 font-bold">● CONNECTED (Relational)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">Telemetry:</span>
          <span className={`font-bold ${sensorBadges?.telemetry === 'LIVE' ? 'text-emerald-400' : 'text-slate-400'}`}>
            {sensorBadges?.telemetry === 'LIVE' ? '● LIVE STREAM' : '○ STANDBY'}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">AI Model:</span>
          <span className={`font-bold ${sensorBadges?.ai === 'RUNNING' ? 'text-purple-400' : 'text-slate-400'}`}>
            {sensorBadges?.ai === 'RUNNING' ? '● LSTM-v1 ACTIVE' : '○ STANDBY'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">WebSocket:</span>
          <span className={`font-bold ${wsConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {wsConnected ? '● CONNECTED' : '○ RECONNECTING'}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">Execution Mode:</span>
          <span className="text-orange-400 font-bold">
            {judgeDemoActive ? 'JUDGE DEMO MODE' : systemMode.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    </footer>
  );
};

