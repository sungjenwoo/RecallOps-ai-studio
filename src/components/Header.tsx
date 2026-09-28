import React from 'react';
import { CheckCircle2, Database, GitCompare, LayoutDashboard } from 'lucide-react';

interface HeaderProps { activeTab: 'console' | 'lab' | 'memories' | 'checklist'; setActiveTab: (tab: 'console' | 'lab' | 'memories' | 'checklist') => void; memoryCount: number; isEngineActive: boolean; activeService?: string; hasAnalyzed: boolean; }

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, memoryCount, hasAnalyzed }) => {
  const tabs = [
    { id: 'console' as const, label: 'Incident console', icon: LayoutDashboard },
    { id: 'lab' as const, label: 'Why memory matters', icon: GitCompare },
    { id: 'memories' as const, label: 'Team memory', icon: Database, count: memoryCount },
    { id: 'checklist' as const, label: 'Judge checklist', icon: CheckCircle2 },
  ];
  return <header className="topbar"><div className="topbar-inner"><button className="brand" onClick={() => setActiveTab('console')}><span className="brand-mark">RO</span><span><b>RecallOps</b><small>Production incident memory</small></span></button><nav className="nav-pills">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={activeTab === tab.id ? 'nav-pill selected' : 'nav-pill'}><Icon className="h-3.5 w-3.5" />{tab.label}{tab.count !== undefined && <em>{tab.count}</em>}{tab.id === 'console' && hasAnalyzed && <i />}</button>; })}</nav><div className="hindsight-status"><span className="status-dot" /><span><b>Hindsight connected</b><small>{memoryCount} lessons ready</small></span></div></div></header>;
};
