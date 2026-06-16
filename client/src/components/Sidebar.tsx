import React from 'react';
import { LayoutDashboard, Users, History, GraduationCap, PlusCircle } from 'lucide-react';

import type { User } from '../services/api';

interface SidebarProps {
  currentView: 'dashboard' | 'students' | 'logs';
  onViewChange: (view: 'dashboard' | 'students' | 'logs') => void;
  onAddStudentClick: () => void;
  user: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  onAddStudentClick,
  user,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'logs', label: 'Activity Logs', icon: History },
  ] as const;

  return (
    <aside className="w-full md:w-68 glass-panel md:h-screen md:sticky md:top-0 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200/60 transition-all duration-300">
      <div className="flex flex-col gap-8">
        {/* Brand/Logo Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80 glow-indigo">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-600 bg-clip-text text-transparent tracking-wide leading-tight">
              SMS Admin
            </h1>
            <p className="text-xs text-slate-400 font-medium">Academy Portal</p>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={onAddStudentClick}
          className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-98 cursor-pointer"
        >
          <PlusCircle size={18} />
          <span>Add New Student</span>
        </button>

        {/* Navigation Section */}
        <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible py-2 md:py-0 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/80'
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-500'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Session Info */}
      <div className="border-t border-slate-200/80 pt-4 flex flex-col gap-3">
        {user && (
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 font-bold uppercase shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate leading-snug">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate leading-normal">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full py-2.5 px-4 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-xs font-bold border border-rose-100/80 transition-all cursor-pointer shadow-sm hover:shadow-rose-500/10"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};
