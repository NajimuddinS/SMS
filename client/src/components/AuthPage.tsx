import React, { useState } from 'react';
import { api } from '../services/api';
import type { User } from '../services/api';
import { GraduationCap, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  
  // Form fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        // Log in
        const res = await api.login({ email, password });
        if (res.success) {
          onAuthSuccess(res.token, res.data);
        }
      } else {
        // Sign up
        const res = await api.signup({ name, email, password });
        if (res.success) {
          onAuthSuccess(res.token, res.data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#f4f6fa] p-4 md:p-6 overflow-hidden">
      {/* Background ambient glow bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[130px]"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[130px]"></div>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-200/60 shadow-xl flex flex-col gap-6 glow-indigo">
        {/* Portal Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/80 glow-indigo">
            <GraduationCap size={36} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-wide">
              SMS Academy Portal
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {isLogin ? 'Sign in to access student management tools' : 'Register a new administrative account'}
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
          <button
            type="button"
            disabled={loading}
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isLogin
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isLogin
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error panel */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name input (only for register) */}
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  disabled={loading}
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm placeholder-slate-400 disabled:opacity-50"
                  required
                />
              </div>
            </div>
          )}

          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                disabled={loading}
                placeholder="you@academy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm placeholder-slate-400 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                disabled={loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm placeholder-slate-400 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Confirm Password input (only for register) */}
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  disabled={loading}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm placeholder-slate-400 disabled:opacity-50"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-500/80 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-98 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Please wait...</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Register'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
