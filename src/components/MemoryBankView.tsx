import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  RotateCcw, 
  Plus, 
  Download,
  ArrowUpRight
} from 'lucide-react';
import { IncidentMemory } from '../types';

interface MemoryBankViewProps {
  memories: IncidentMemory[];
  onInspectEvidence: (code: string) => void;
  onResetMemories: () => void;
  onAddNewMemoryClick: () => void;
}

export const MemoryBankView: React.FC<MemoryBankViewProps> = ({
  memories,
  onInspectEvidence,
  onResetMemories,
  onAddNewMemoryClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const services = ['all', ...Array.from(new Set(memories.map(m => m.service)))];

  const filteredMemories = memories.filter(m => {
    const matchesSearch = 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.rootCause.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesService = selectedService === 'all' || m.service === selectedService;
    const matchesSeverity = selectedSeverity === 'all' || m.severity === selectedSeverity;

    return matchesSearch && matchesService && matchesSeverity;
  });

  const exportMemoriesJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `recallops-hindsight-memories-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">Hindsight Memory Bank</h2>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {memories.length} Precedents Indexed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Persistent repository of verified historical failures, anti-patterns, and effective resolutions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportMemoriesJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={onResetMemories}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={onAddNewMemoryClick}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-slate-950" />
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by keywords, tags, symptoms, or root causes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#090d16] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {services.map(s => (
                <option key={s} value={s}>
                  Service: {s}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">Severity: All</option>
              <option value="SEV1">SEV1 (Critical)</option>
              <option value="SEV2">SEV2 (Major)</option>
              <option value="SEV3">SEV3 (Minor)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Memory Items List */}
      <div className="space-y-4">
        {filteredMemories.length > 0 ? (
          filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="bg-[#0e1422] rounded-xl border border-slate-800 p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
            >
              {/* Header Row: Clean unboxed metadata with typographic separators */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-cyan-400 font-semibold">
                    [{mem.evidenceCode}] {mem.id}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className={`font-mono ${mem.severity === 'SEV1' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {mem.severity}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-slate-300">{mem.service}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-500 font-mono tabular-nums">{mem.incidentDate}</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Responder: {mem.responder}</span>
                  <button
                    onClick={() => onInspectEvidence(mem.evidenceCode)}
                    className="text-cyan-400 hover:text-cyan-300 font-medium text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Inspect Postmortem</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Root cause */}
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1">{mem.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-slate-500 font-medium">Root Cause: </span>
                  {mem.rootCause}
                </p>
              </div>

              {/* Two columns: Failed Actions vs Winning Fix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Failed Actions */}
                <div className="bg-[#140e16] border border-rose-900/30 rounded-lg p-3 text-rose-200/90">
                  <div className="text-[11px] font-mono text-rose-400 uppercase tracking-wider mb-1 font-medium">
                    Failed Actions Attempted:
                  </div>
                  <ul className="space-y-1">
                    {mem.failedActions.map((fa, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                        <span className="text-rose-400">✕</span>
                        <span>{fa}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Successful Fix */}
                <div className="bg-[#0c1817] border border-emerald-900/30 rounded-lg p-3 text-emerald-200/90">
                  <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-1 font-medium">
                    Successful Remediation:
                  </div>
                  <p className="text-[11px] leading-relaxed font-medium">
                    {mem.successfulFix}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    Time to resolve: {mem.timeToResolveMinutes} minutes
                  </div>
                </div>
              </div>

              {/* Key Lessons */}
              <div className="bg-[#090d16] border border-slate-800/80 rounded-lg p-3 text-slate-300 text-xs">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Lessons Learned for Future Responders:
                </div>
                <ul className="space-y-1">
                  {mem.lessonsLearned.map((lesson, idx) => (
                    <li key={idx} className="text-[11px] text-slate-300 leading-relaxed">
                      · {lesson}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags footer as unboxed text */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span>Tags:</span>
                {mem.tags.map((t, idx) => (
                  <span key={idx} className="text-slate-400 hover:text-slate-200 transition-colors">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-8 text-center text-slate-400 text-xs">
            No memories matched your query.
          </div>
        )}
      </div>
    </div>
  );
};
