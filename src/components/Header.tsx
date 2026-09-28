import React from 'react';
import { 
  Terminal, 
  GitCompare, 
  Database, 
  CheckCircle2, 
  Radio
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'console' | 'lab' | 'memories' | 'checklist';
  setActiveTab: (tab: 'console' | 'lab' | 'memories' | 'checklist') => void;
  memoryCount: number;
  isEngineActive: boolean;
  activeService?: string;
  hasAnalyzed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  memoryCount,
  hasAnalyzed
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#080c14]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs tracking-wider">
              RO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-white tracking-tight">RecallOps</span>
                <span className="text-xs text-slate-500 font-normal">/</span>
                <span className="text-xs text-slate-400 font-medium">Incident Memory & Response</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Hindsight store: {memoryCount} precedents</span>
                <span className="text-slate-700">·</span>
                <span>Advisory engine</span>
              </div>
            </div>
          </div>

          {/* Navigation segmented control */}
          <nav className="flex items-center gap-1 bg-[#0e1422] p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'console'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Incident Console</span>
              {hasAnalyzed && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('lab')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'lab'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Before & After Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('memories')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'memories'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Memory Bank</span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                ({memoryCount})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'checklist'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Submission Checklist</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
