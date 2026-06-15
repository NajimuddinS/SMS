import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import type { ActivityLog } from '../services/api';

import { History, ChevronLeft, ChevronRight, RefreshCw, Terminal, Info, Globe } from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const limit = 12;

  // Refresh Trigger
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getActivityLogs(page, limit);
      if (res.success && res.data.logs) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, refreshTrigger]);

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Audit Log</h2>
          <p className="text-slate-500 text-sm mt-1">Audit trail of actions, additions, and updates made to student data.</p>
        </div>
        <button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-750 rounded-xl font-semibold text-xs flex items-center gap-2 border border-slate-200 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Main logs display */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
            <span className="text-slate-500 text-sm font-medium">Reading secure audit history...</span>
          </div>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center rounded-2xl border-red-100">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl flex flex-col items-center gap-4">
          <div className="p-4 bg-slate-100 text-slate-450 rounded-full border border-slate-200">
            <History size={32} />
          </div>
          <div>
            <h4 className="text-slate-800 font-bold">Audit Feed Empty</h4>
            <p className="text-slate-500 text-xs mt-1">Activities will appear here once CRUD operations are performed.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Logs List */}
          <div className="flex flex-col gap-3">
            {logs.map((log) => {
              // Badge color formatting
              let badgeStyle = 'text-indigo-600 bg-indigo-50 border-indigo-100/60';
              if (log.action === 'CREATE_STUDENT') badgeStyle = 'text-emerald-600 bg-emerald-50 border-emerald-100/60';
              if (log.action === 'DELETE_STUDENT') badgeStyle = 'text-rose-600 bg-rose-50 border-rose-100/60';
              if (log.action === 'UPDATE_STUDENT') badgeStyle = 'text-amber-600 bg-amber-50 border-amber-100/60';

              return (
                <div key={log._id} className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Action and description */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2 bg-slate-100 text-slate-500 rounded-xl shrink-0 mt-0.5">
                      <Terminal size={18} />
                    </div>
                    <div className="min-w-0 flex flex-col gap-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold tracking-wide uppercase ${badgeStyle}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 font-semibold">•</span>
                        <span className="text-slate-550 font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-705 text-sm font-medium leading-relaxed truncate-2-lines break-all" title={log.details}>
                        {log.details}
                      </p>
                    </div>
                  </div>

                  {/* Meta data (IP/UA) */}
                  <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2.5 text-[10px] text-slate-450 shrink-0 self-end md:self-auto border-t md:border-t-0 border-slate-200 pt-2.5 md:pt-0">
                    {log.ipAddress && (
                      <span className="flex items-center gap-1.5 font-mono">
                        <Globe size={11} className="text-slate-500" />
                        IP: {log.ipAddress.includes('::') ? '127.0.0.1' : log.ipAddress}
                      </span>
                    )}
                    {log.userAgent && (
                      <span className="flex items-center gap-1.5 font-medium max-w-xs truncate" title={log.userAgent}>
                        <Info size={11} className="text-slate-500 shrink-0" />
                        UA: {log.userAgent.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 px-2">
            <span className="text-xs text-slate-450 font-semibold">
              Showing page <span className="text-slate-800 font-bold">{page}</span> of <span className="text-slate-800 font-bold">{pages}</span> ({total} logs)
            </span>

            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-650 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
                className="p-2 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-650 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
