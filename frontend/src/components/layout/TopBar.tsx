import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Radio,
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationCenter } from './NotificationCenter';
import { CommandPalette } from './CommandPalette';
import { UserRole } from '../../types/auth';

export const TopBar: React.FC = () => {
  const { user, logout, environment, setEnvironment, switchRole } = useAuth();
  const { role } = usePermission();
  const { wsConnected, judgeDemoActive, startJudgeDemo, stopJudgeDemo, livePrediction, currentDemoStepData } = useRealtime();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const currentRisk = livePrediction?.risk || currentDemoStepData?.risk || 'NOMINAL';
  const confidencePercent = livePrediction
    ? Math.round(livePrediction.confidence * 100)
    : (currentDemoStepData as any)?.confidence
    ? Math.round((currentDemoStepData as any).confidence * 100)
    : 85;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEnvMenu, setShowEnvMenu] = useState(false);


  return (
    <header className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 sticky top-0 z-40 backdrop-blur-md font-mono text-xs select-none">
      <div className="flex items-center justify-between">
        {/* Left: Product Identity & Environment Selector */}
        <div className="flex items-center space-x-4">
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="p-2 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl shadow-lg shadow-orange-950/40 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">
                  CHRONOS-WS
                </span>
                <span className="text-[10px] text-orange-400 font-bold bg-orange-950/60 px-1.5 py-0.2 rounded border border-orange-800/40">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans tracking-wide">
                Predict. Defend. Deceive.
              </p>
            </div>
          </div>

          {/* Environment Switcher Badge */}
          <div className="relative">
            <button
              onClick={() => setShowEnvMenu(!showEnvMenu)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs transition-colors"
            >
              <span className="text-slate-500">Env:</span>
              <span className="text-orange-400 font-bold">{environment}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showEnvMenu && (
              <div className="absolute top-10 left-0 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
                {(['LOCAL DEFENCE LAB', 'DATASET REPLAY', 'JUDGE DEMO'] as const).map((env) => (
                  <button
                    key={env}
                    onClick={() => {
                      if (env === 'JUDGE DEMO') startJudgeDemo();
                      else {
                        stopJudgeDemo();
                        setEnvironment(env);
                      }
                      setShowEnvMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                      environment === env
                        ? 'bg-orange-500/20 text-orange-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Realtime Status & Risk Indicator */}
        <div className="hidden md:flex items-center space-x-3">
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            wsConnected
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'animate-pulse' : ''}`} />
            <span>{wsConnected ? 'LIVE STREAM' : 'OFFLINE'}</span>
          </div>

          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
            currentRisk === 'CRITICAL' || currentRisk === 'HIGH'
              ? 'bg-rose-950/60 border-rose-800/40 text-rose-300'
              : currentRisk === 'ELEVATED' || currentRisk === 'MEDIUM'
              ? 'bg-amber-950/60 border-amber-800/40 text-amber-300'
              : 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300'
          }`}>
            <span className="text-slate-400">Risk:</span>
            <span className="uppercase">{currentRisk} ({confidencePercent}%)</span>
          </div>


          {judgeDemoActive && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold text-xs animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>JUDGE DEMO RUNNING</span>
            </div>
          )}
        </div>

        {/* Right: Quick Search, Notifications, User Profile */}
        <div className="flex items-center space-x-3">
          {/* Command Palette Trigger */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-400">Ctrl K</kbd>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-orange-400 relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <NotificationCenter
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* Theme Toggle (Light / Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-orange-400 transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline text-[11px] font-bold text-amber-600">LIGHT</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline text-[11px] font-bold text-slate-300">DARK</span>
              </>
            )}
          </button>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2.5 p-1.5 pl-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-500 to-orange-500 flex items-center justify-center font-bold text-white text-xs">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-slate-200 text-xs leading-none">
                  {user?.name || 'Operator'}
                </div>
                <div className="text-[10px] text-orange-400 font-mono leading-tight mt-0.5">
                  {role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                <div className="p-2 border-b border-slate-800">
                  <div className="font-bold text-white text-xs">{user?.name}</div>
                  <div className="text-[10px] text-slate-400">{user?.email}</div>
                  <div className="mt-1 text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>SESSION ACTIVE</span>
                  </div>
                </div>

                {/* Role Switcher Demo Tool */}
                <div className="p-1">
                  <div className="text-[10px] text-slate-500 uppercase px-2 py-1">Switch Role Demo</div>
                  {(['ADMIN', 'SOC_ANALYST', 'SECURITY_ENGINEER', 'VIEWER'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between ${
                        role === r ? 'bg-orange-500/20 text-orange-300 font-bold' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>{r}</span>
                      {role === r && <span className="text-orange-400">✓</span>}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>LOG OUT</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </header>
  );
};
