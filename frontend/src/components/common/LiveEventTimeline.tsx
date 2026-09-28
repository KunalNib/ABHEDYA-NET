import React, { useState } from 'react';
import { Clock, Shield, AlertTriangle, Filter, RefreshCw, Radio } from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext';
import { LiveTimelineEvent } from '../../services/api';

export const LiveEventTimeline: React.FC = () => {
  const { timelineEvents, refreshTimeline, systemMode } = useRealtime();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredEvents = timelineEvents.filter((ev) => {
    if (filterSeverity === 'ALL') return true;
    return ev.severity === filterSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/50">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/40">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950/60 text-yellow-300 border border-yellow-800/30">
            LOW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/60 text-blue-300 border border-blue-800/30">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 font-mono select-none">
      {/* Timeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">
                Visible Live Event Timeline
              </h3>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2 py-0.2 rounded-full font-bold">
                {timelineEvents.length} Recorded
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              Strict Ingestion Stream: Sensor Source, Asset Target, Event Type, Severity & Realtime Description
            </p>
          </div>
        </div>

        {/* Severity Filter & Refresh */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-[11px]">
            <Filter className="w-3 h-3 text-slate-500 ml-1" />
            {(['ALL', 'CRITICAL', 'HIGH', 'LOW', 'INFO'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                  filterSeverity === sev
                    ? 'bg-slate-800 text-orange-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={() => refreshTimeline()}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition-colors"
            title="Refresh Timeline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Events Table / Feed */}
      <div className="overflow-x-auto max-h-80 overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No events logged yet. Click <span className="text-orange-400 font-bold">START LIVE TEST</span> or <span className="text-purple-400 font-bold">STEP TESTBED</span> to generate traffic.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-2.5">Timestamp</th>
                <th className="py-2 px-2.5">Source Sensor</th>
                <th className="py-2 px-2.5">Target Asset</th>
                <th className="py-2 px-2.5">Event Type</th>
                <th className="py-2 px-2.5">Severity</th>
                <th className="py-2 px-2.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredEvents.map((ev, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="py-2 px-2.5 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                    {ev.timestamp}
                  </td>
                  <td className="py-2 px-2.5 font-bold text-slate-200 whitespace-nowrap">
                    {ev.source}
                  </td>
                  <td className="py-2 px-2.5 text-orange-400 font-mono text-[11px] whitespace-nowrap">
                    {ev.asset}
                  </td>
                  <td className="py-2 px-2.5 text-slate-300 font-bold text-[11px] whitespace-nowrap">
                    {ev.event_type}
                  </td>
                  <td className="py-2 px-2.5 whitespace-nowrap">
                    {getSeverityBadge(ev.severity)}
                  </td>
                  <td className="py-2 px-2.5 text-slate-300 font-sans text-xs max-w-md">
                    {ev.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
