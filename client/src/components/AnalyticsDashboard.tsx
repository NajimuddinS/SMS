import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AnalyticsData, ActivityLog } from '../services/api';

import { Users, GraduationCap, Clock, Award, TrendingUp, Info } from 'lucide-react';

export const AnalyticsDashboard: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, logsRes] = await Promise.all([
          api.getAnalytics(),
          api.getActivityLogs(1, 5), // Fetch the 5 most recent logs
        ]);

        if (analyticsRes.success) setAnalytics(analyticsRes.data);
        if (logsRes.success && logsRes.data.logs) setRecentLogs(logsRes.data.logs);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Retrieving academy metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-xl mx-auto glass-card p-6 border-red-500/20 text-center rounded-2xl">
          <Info className="mx-auto text-red-400 mb-3" size={32} />
          <h3 className="text-lg font-bold text-white mb-1">Failed to load analytics</h3>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Derived properties
  const totalStudents = analytics?.totalStudents || 0;
  const courseCount = analytics?.courseBreakdown.length || 0;
  const popularCourse = analytics?.courseBreakdown[0]?._id || 'N/A';
  const popularCourseCount = analytics?.courseBreakdown[0]?.count || 0;

  // Maximum value for scaling charts
  const maxCourseStudents = Math.max(...(analytics?.courseBreakdown.map((c) => c.count) || [1]));
  const maxYearStudents = Math.max(...(analytics?.yearBreakdown.map((y) => y.count) || [1]));

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-8">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Administrative Overview</h2>
        <p className="text-slate-500 text-sm mt-1">Real-time statistics, demographics, and operations log.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Students */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 glow-indigo">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enrollment</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalStudents}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Active Student Records</p>
          </div>
        </div>

        {/* Unique Courses */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 glow-purple">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100/80">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Courses</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{courseCount}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Departments Represented</p>
          </div>
        </div>

        {/* Most Popular Course */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/80">
            <Award size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Department</p>
            <h3 className="text-lg font-extrabold text-slate-800 mt-1 truncate" title={popularCourse}>
              {popularCourse}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{popularCourseCount} Students</p>
          </div>
        </div>

        {/* Activity Meter */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100/80">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Portal Logs</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{recentLogs.length}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Recent Operations Listed</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Year Distribution Chart */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-800">Enrollment by Academic Year</h4>
            <div className="text-[11px] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/80 flex items-center gap-1.5">
              <TrendingUp size={12} /> Live Distribution
            </div>
          </div>

          <div className="h-64 flex items-end gap-6 md:gap-12 px-4 border-b border-slate-200 pb-2">
            {/* Display years 1 to 4 */}
            {[1, 2, 3, 4].map((yearNum) => {
              const yearRecord = analytics?.yearBreakdown.find((y) => y._id === yearNum);
              const count = yearRecord ? yearRecord.count : 0;
              // Percentage calculation
              const percentage = maxYearStudents > 0 ? (count / maxYearStudents) * 80 : 0; // scale up to 80% height

              return (
                <div key={yearNum} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-lg absolute -translate-y-18 duration-200">
                    {count} Students
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: `${percentage}%` }}
                    className="w-full min-h-[4px] rounded-t-lg bg-gradient-to-t from-indigo-500 to-purple-500 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-500 glow-indigo"
                  />
                  {/* Label */}
                  <span className="text-xs text-slate-500 group-hover:text-slate-800 font-medium mt-1">
                    Year {yearNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gender Demographics Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between gap-6">
          <div>
            <h4 className="text-base font-bold text-slate-800">Gender Demographics</h4>
            <p className="text-xs text-slate-500 mt-0.5">Diversity and breakdown across enrollment.</p>
          </div>

          <div className="flex flex-col gap-4">
            {['Male', 'Female', 'Other'].map((gender) => {
              const record = analytics?.genderBreakdown.find((g) => g._id === gender);
              const count = record ? record.count : 0;
              const percent = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;

              // Color classes
              let barColor = 'bg-indigo-500';
              if (gender === 'Female') barColor = 'bg-purple-500';
              if (gender === 'Other') barColor = 'bg-amber-500';

              return (
                <div key={gender} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{gender}</span>
                    <span className="text-slate-500">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`${barColor} h-full rounded-full transition-all duration-1000`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>Aggregated database count</span>
            <span className="font-semibold text-slate-700">{totalStudents} Total</span>
          </div>
        </div>
      </div>

      {/* Analytics Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Popularity List */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-800">Enrollment by Course</h4>
            <p className="text-xs text-slate-500 mt-0.5">Active course enrollment sizes ordered by popularity.</p>
          </div>

          <div className="flex flex-col gap-3.5 max-h-72 overflow-y-auto pr-1">
            {analytics?.courseBreakdown.map((course) => {
              const percent = maxCourseStudents > 0 ? Math.round((course.count / totalStudents) * 100) : 0;
              return (
                <div key={course._id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 truncate pr-4">{course._id}</span>
                    <span className="text-slate-500 shrink-0">{course.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="bg-indigo-500/80 h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
            {courseCount === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No course records available yet.</p>
            )}
          </div>
        </div>

        {/* Live Admin Audit Feed */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-800">Administrative Activity Log</h4>
            <p className="text-xs text-slate-500 mt-0.5">Audit log of student mutations performed.</p>
          </div>

          <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
            {recentLogs.map((log) => {
              // Action color formatting
              let badgeColor = 'text-indigo-600 bg-indigo-50 border-indigo-100/60';
              if (log.action === 'CREATE_STUDENT') badgeColor = 'text-emerald-600 bg-emerald-50 border-emerald-100/60';
              if (log.action === 'DELETE_STUDENT') badgeColor = 'text-rose-600 bg-rose-50 border-rose-100/60';
              if (log.action === 'UPDATE_STUDENT') badgeColor = 'text-amber-600 bg-amber-50 border-amber-100/60';

              return (
                <div key={log._id} className="p-3 bg-slate-50/50 border border-slate-200/50 rounded-xl flex items-start justify-between gap-3 text-xs">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold w-max ${badgeColor}`}>
                      {log.action.replace('_', ' ')}
                    </span>
                    <p className="text-slate-600 font-medium leading-relaxed truncate-2-lines break-all" title={log.details}>
                      {log.details}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {recentLogs.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No system logs logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
