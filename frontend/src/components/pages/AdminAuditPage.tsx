import React, { useState, useEffect } from 'react';
import { FileCode, Shield, CheckCircle2, Lock, RefreshCw } from 'lucide-react';
import { fetchAuditLogs, AuditLogItem } from '../../services/api';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs(50);
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (e) {
      console.warn('Backend audit API fetch notice:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6 font-mono select-none">
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">
            Admin — Immutable System Audit Logs
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Read-only cryptographic audit trail recording all operator actions and security state mutations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>
          <span className="badge-green">READ-ONLY AUDIT TRAIL</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Operator</th>
              <th className="p-4">Role</th>
              <th className="p-4">Action Description</th>
              <th className="p-4">Target System</th>
              <th className="p-4">Result</th>
              <th className="p-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 text-slate-400">{log.timestamp}</td>
                <td className="p-4 font-bold text-white">{log.user}</td>
                <td className="p-4 text-orange-400 font-bold">{log.role}</td>
                <td className="p-4 text-slate-200">{log.action}</td>
                <td className="p-4 text-purple-300">{log.target}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.result === 'SUCCESS' ? 'badge-green' : 'badge-red'
                  }`}>
                    {log.result}
                  </span>
                </td>
                <td className="p-4 text-slate-500 font-mono">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
