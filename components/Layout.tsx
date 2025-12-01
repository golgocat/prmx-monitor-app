import React, { ReactNode } from 'react';
import { Plus, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: 'dashboard' | 'create';
  onTabChange: (tab: 'dashboard' | 'create') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="relative min-h-screen pb-20 overflow-x-hidden bg-slate-50 text-slate-800">
      {/* Ambient Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#8A4AF3] opacity-10 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }}></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#00C48C] opacity-10 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '15s' }}></div>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b md:px-12 backdrop-blur-xl border-white/40 bg-white/60">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => onTabChange('dashboard')}>
          <img src="/prmx-logo.png" alt="PRMX Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-purple-200" />
          <div>
            <h1 className="text-xl font-bold leading-none tracking-tight text-slate-900">PRMX</h1>
            <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Rainfall Protocol</p>
          </div>
        </div>

        <nav className="flex gap-2">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-[#8A4AF3] text-white shadow-lg shadow-purple-200' : 'bg-white/50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden md:inline">Dashboard</span>
          </button>
          <button
            onClick={() => onTabChange('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'create' ? 'bg-[#00C48C] text-white shadow-lg shadow-teal-200' : 'bg-white/50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">New Monitor</span>
          </button>
        </nav>
      </header>

      <main className="relative z-10 px-6 py-8 mx-auto max-w-7xl md:px-12">
        {children}
      </main>
    </div>
  );
};