import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IncidentForm } from './components/IncidentForm';
import { InvestigationPlanView } from './components/InvestigationPlanView';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { OutcomeModal } from './components/OutcomeModal';
import { BeforeAfterLab } from './components/BeforeAfterLab';
import { MemoryBankView } from './components/MemoryBankView';
import { SubmissionChecklistView } from './components/SubmissionChecklistView';
import { ExportModal } from './components/ExportModal';
import { 
  IncidentMemory, 
  IncidentOutcomeInput, 
  IncidentSubmission, 
  InvestigationPlan 
} from './types';
import { 
  getLocalMemories, 
  saveLocalMemories, 
  resetToDefaultMemories, 
  analyzeIncident, 
  commitNewOutcomeToMemories 
} from './services/incidentService';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'console' | 'lab' | 'memories' | 'checklist'>('console');
  const [memories, setMemories] = useState<IncidentMemory[]>([]);
  const [currentIncident, setCurrentIncident] = useState<IncidentSubmission | null>(null);
  const [investigationPlan, setInvestigationPlan] = useState<InvestigationPlan | null>(null);
  const [retrievedEvidence, setRetrievedEvidence] = useState<IncidentMemory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Modals & Drawers
  const [inspectedEvidence, setInspectedEvidence] = useState<IncidentMemory | null>(null);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const loaded = getLocalMemories();
    setMemories(loaded);

    fetch('/api/memories')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.memories) && data.memories.length > 0) {
          const merged = [...data.memories];
          loaded.forEach(lm => {
            if (!merged.some(m => m.id === lm.id)) {
              merged.push(lm);
            }
          });
          setMemories(merged);
          saveLocalMemories(merged);
        }
      })
      .catch(() => {});
  }, []);

  const showNotification = (title: string, message: string) => {
    setNotification({ title, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleAnalyzeIncident = async (incident: IncidentSubmission) => {
    setIsLoading(true);
    setCurrentIncident(incident);

    try {
      const result = await analyzeIncident(incident, memories);
      setInvestigationPlan(result.analysis);
      setRetrievedEvidence(result.retrievedEvidence);

      if (result.retrievedEvidence.length > 0) {
        showNotification(
          'Hindsight Precedents Retrieved',
          `Correlated ${result.retrievedEvidence.length} incident record(s) and flagged known failure traps.`
        );
      } else {
        showNotification(
          'Cold Start Baseline Generated',
          'No prior precedent found for this service. Formulating baseline first-principles investigation.'
        );
      }
    } catch (err: any) {
      console.error('Incident analysis failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspectEvidence = (evidenceCode: string) => {
    const found = memories.find(m => m.evidenceCode === evidenceCode || m.id === evidenceCode);
    if (found) {
      setInspectedEvidence(found);
    } else if (retrievedEvidence.length > 0) {
      setInspectedEvidence(retrievedEvidence[0]);
    }
  };

  const handleSaveOutcome = (outcome: IncidentOutcomeInput) => {
    const { updatedMemories, newMemory } = commitNewOutcomeToMemories(outcome, memories);
    setMemories(updatedMemories);

    showNotification(
      `Precedent [${newMemory.evidenceCode}] Saved`,
      `Incident ${newMemory.id} resolved. New lessons now inform all future on-call recommendations.`
    );

    if (currentIncident) {
      handleAnalyzeIncident(currentIncident);
    }
  };

  const handleResetMemories = () => {
    const defaultMems = resetToDefaultMemories();
    setMemories(defaultMems);
    showNotification('Memory Bank Reset', 'Hindsight memory bank restored to baseline demo state.');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        memoryCount={memories.length}
        isEngineActive={true}
        activeService={currentIncident?.service}
        hasAnalyzed={!!investigationPlan}
      />

      {/* Clean Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#0e1422] border border-cyan-500/40 shadow-xl rounded-xl p-4 text-xs flex items-start gap-3 animate-slideIn">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-white">{notification.title}</div>
            <p className="text-slate-400 mt-0.5 leading-relaxed">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'console' && (
          <div className="space-y-8">
            <IncidentForm
              onSubmit={handleAnalyzeIncident}
              isLoading={isLoading}
            />

            {investigationPlan && (
              <InvestigationPlanView
                plan={investigationPlan}
                retrievedEvidence={retrievedEvidence}
                onInspectEvidence={handleInspectEvidence}
                onOpenOutcomeModal={() => setIsOutcomeModalOpen(true)}
                onExportReport={() => setIsExportModalOpen(true)}
                onOpenBeforeAfterLab={() => setActiveTab('lab')}
              />
            )}
          </div>
        )}

        {activeTab === 'lab' && (
          <BeforeAfterLab
            memories={memories}
            onInspectEvidence={handleInspectEvidence}
          />
        )}

        {activeTab === 'memories' && (
          <MemoryBankView
            memories={memories}
            onInspectEvidence={handleInspectEvidence}
            onResetMemories={handleResetMemories}
            onAddNewMemoryClick={() => setIsOutcomeModalOpen(true)}
          />
        )}

        {activeTab === 'checklist' && (
          <SubmissionChecklistView
            onNavigateToConsole={() => setActiveTab('console')}
            onNavigateToLab={() => setActiveTab('lab')}
            onNavigateToMemories={() => setActiveTab('memories')}
            onInspectEvidence={handleInspectEvidence}
            memoryCount={memories.length}
          />
        )}
      </main>

      {/* Modals & Inspection Drawers */}
      <EvidenceDrawer
        evidence={inspectedEvidence}
        onClose={() => setInspectedEvidence(null)}
      />

      <OutcomeModal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        currentIncident={currentIncident}
        onSaveOutcome={handleSaveOutcome}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        incident={currentIncident}
        plan={investigationPlan}
        evidence={retrievedEvidence}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080c14] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold">RecallOps</span>
            <span className="text-slate-600">·</span>
            <span>Advisory AI Incident-Response Assistant with Persistent Hindsight Experience</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setActiveTab('checklist')}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Submission Checklist
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={() => setActiveTab('lab')}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Before & After Lab
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
