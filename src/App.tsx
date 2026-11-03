import React, { useState, useEffect } from 'react';
import { samplePresets } from './data/samplePresets';
import { BibleStudyManuscript, ViewMode } from './types/manuscript';
import { Header } from './components/Header';
import { ManuscriptView } from './components/ManuscriptView';
import { ParticipantHandoutView } from './components/ParticipantHandoutView';
import { PresentationMode } from './components/PresentationMode';
import { GeneratorModal } from './components/GeneratorModal';
import { AIToolkitModal } from './components/AIToolkitModal';
import { SavedManuscriptsDrawer } from './components/SavedManuscriptsDrawer';

const STORAGE_KEY = 'bible_study_manuscripts_v1';
const CURRENT_ID_KEY = 'bible_study_current_id';

export default function App() {
  const [savedManuscripts, setSavedManuscripts] = useState<BibleStudyManuscript[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
    return samplePresets;
  });

  const [currentManuscript, setCurrentManuscript] = useState<BibleStudyManuscript>(() => {
    try {
      const lastId = localStorage.getItem(CURRENT_ID_KEY);
      if (lastId) {
        const found = savedManuscripts.find((m) => m.id === lastId);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    return samplePresets[0];
  });

  const [viewMode, setViewMode] = useState<ViewMode>('leader');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isToolkitOpen, setIsToolkitOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Auto-persist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedManuscripts));
    } catch (e) {
      console.error('Failed to save manuscripts:', e);
    }
  }, [savedManuscripts]);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_ID_KEY, currentManuscript.id);
    } catch (e) {
      console.error(e);
    }
  }, [currentManuscript.id]);

  const handleUpdateManuscript = (updated: BibleStudyManuscript) => {
    setCurrentManuscript(updated);
    setSavedManuscripts((prev) => {
      const idx = prev.findIndex((m) => m.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      } else {
        return [updated, ...prev];
      }
    });
  };

  const handleSelectManuscript = (m: BibleStudyManuscript) => {
    setCurrentManuscript(m);
  };

  const handleDeleteManuscript = (id: string) => {
    setSavedManuscripts((prev) => {
      const filtered = prev.filter((m) => m.id !== id);
      if (currentManuscript.id === id) {
        const next = filtered[0] || samplePresets[0];
        setCurrentManuscript(next);
      }
      return filtered;
    });
  };

  const handleDuplicateManuscript = (m: BibleStudyManuscript) => {
    const duplicated: BibleStudyManuscript = {
      ...JSON.parse(JSON.stringify(m)),
      id: 'study-' + Date.now(),
      title: `${m.title} (사본)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedManuscripts((prev) => [duplicated, ...prev]);
    setCurrentManuscript(duplicated);
  };

  const handleCreateSuccess = (newStudy: BibleStudyManuscript) => {
    setSavedManuscripts((prev) => [newStudy, ...prev]);
    setCurrentManuscript(newStudy);
    setViewMode('leader');
  };

  // Export Markdown format
  const generateMarkdown = (m: BibleStudyManuscript): string => {
    return `# ${m.title}
*${m.subtitle}*

- **성경 본문**: ${m.passage}
- **핵심 요절**: "${m.keyVerse}"
- **대상**: ${m.targetAudience}
- **예상 소요 시간**: ${m.estimatedTimeMinutes}분

---

## 1. 도입 (Ice Breaker)
**질문**: ${m.iceBreaker.question}

${m.iceBreaker.illustration}

---

## 2. 본문 배경 및 신학적 주제
- **역사적 배경**: ${m.historicalContext.background}
- **핵심 신학 주제**: ${m.historicalContext.theologicalTheme}

---

## 3. 원어(히브리어/헬라어) 묵상
${m.wordStudies
  .map(
    (w) => `### ${w.originalWord}
- **의미**: ${w.meaning}
- **통찰**: ${w.insight}`
  )
  .join('\n\n')}

---

## 4. 대지별 본문 강해 및 나눔
${m.outlines
  .map(
    (ot) => `### ${ot.pointNumber}. ${ot.title} (${ot.verses})
${ot.exegesis}

${ot.modernAnalogy ? `> 💡 **일상 비유**: ${ot.modernAnalogy}\n` : ''}
💬 **소그룹 나눔 질문**: "${ot.discussionQuestion}"`
  )
  .join('\n\n')}

---

## 5. 귀납적 3단계 나눔 질문
### 1) 관찰 질문 (Observation)
${m.deepQuestions.observation.map((q) => `- ${q}`).join('\n')}

### 2) 해석 질문 (Interpretation)
${m.deepQuestions.interpretation.map((q) => `- ${q}`).join('\n')}

### 3) 적용 질문 (Application)
${m.deepQuestions.application.map((q) => `- ${q}`).join('\n')}

---

## 6. 삶의 실천적 적용 (Life Application)
${m.lifeApplication.map((app) => `- **[${app.domain}]** ${app.actionItem}`).join('\n')}

---

## 7. 마침 기도문
> "${m.closingPrayer}"

---

## [부록] 참여자용 요약 및 주간 미션
${m.participantHandout.summary}

### 빈칸 채우기
${m.participantHandout.fillInTheBlanks.map((item, i) => `${i + 1}. ${item}`).join('\n')}

### 이번 주 생활 미션
${m.participantHandout.weeklyMission}
`;
  };

  const handleExportMarkdown = () => {
    const md = generateMarkdown(currentManuscript);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentManuscript.passage.replace(/\s+/g, '_')}_${currentManuscript.title.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = (type: 'all' | 'handout') => {
    let content = '';
    if (type === 'handout') {
      content = `[성경공부 나눔지] ${currentManuscript.title}
본문: ${currentManuscript.passage}

요절: "${currentManuscript.keyVerse}"

[말씀 요약]
${currentManuscript.participantHandout.summary}

[말씀 묵상]
${currentManuscript.participantHandout.fillInTheBlanks.join('\n')}

[소그룹 나눔 질문]
${currentManuscript.deepQuestions.application.map((q, i) => `Q${i + 1}. ${q}`).join('\n')}

[이번 주 실천 미션]
${currentManuscript.participantHandout.weeklyMission}
`;
    } else {
      content = generateMarkdown(currentManuscript);
    }

    navigator.clipboard.writeText(content);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Insertion callbacks from AI Toolkit
  const handleInsertWordStudy = (word: any) => {
    const updated = { ...currentManuscript };
    updated.wordStudies = [...updated.wordStudies, word];
    handleUpdateManuscript(updated);
  };

  const handleInsertIllustration = (story: string) => {
    const updated = { ...currentManuscript };
    updated.iceBreaker.illustration = story;
    handleUpdateManuscript(updated);
  };

  const handleInsertQuestion = (
    stage: 'observation' | 'interpretation' | 'application',
    q: string
  ) => {
    const updated = { ...currentManuscript };
    updated.deepQuestions[stage] = [...updated.deepQuestions[stage], q];
    handleUpdateManuscript(updated);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* Presentation Fullscreen Mode */}
      {viewMode === 'teleprompter' && (
        <PresentationMode
          manuscript={currentManuscript}
          onExit={() => setViewMode('leader')}
        />
      )}

      {/* Main App Navigation */}
      <Header
        currentManuscript={currentManuscript}
        savedManuscripts={savedManuscripts}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenToolkit={() => setIsToolkitOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onSelectPreset={(id) => {
          const found = samplePresets.find((s) => s.id === id);
          if (found) setCurrentManuscript(found);
        }}
        onExportMarkdown={handleExportMarkdown}
        onCopyClipboard={handleCopyClipboard}
        hasCopied={hasCopied}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 pb-16">
        {viewMode === 'leader' && (
          <ManuscriptView
            manuscript={currentManuscript}
            onUpdate={handleUpdateManuscript}
            onOpenToolkitWithText={(text) => {
              setIsToolkitOpen(true);
            }}
          />
        )}

        {viewMode === 'handout' && (
          <ParticipantHandoutView manuscript={currentManuscript} />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print py-6 border-t border-stone-200/80 bg-white text-center text-xs text-stone-500">
        <p className="font-serif">
          말씀과 나눔 · 성경공부 원고집필 도우미
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">
          소그룹 성경공부, 구역예배 강해, QT 묵상 인도자를 위한 원고 집필 동역자
        </p>
      </footer>

      {/* Modals & Slide-overs */}
      <GeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <AIToolkitModal
        isOpen={isToolkitOpen}
        onClose={() => setIsToolkitOpen(false)}
        currentManuscript={currentManuscript}
        onInsertWordStudy={handleInsertWordStudy}
        onInsertIllustration={handleInsertIllustration}
        onInsertQuestion={handleInsertQuestion}
      />

      <SavedManuscriptsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        savedManuscripts={savedManuscripts}
        currentManuscriptId={currentManuscript.id}
        onSelectManuscript={handleSelectManuscript}
        onDeleteManuscript={handleDeleteManuscript}
        onDuplicateManuscript={handleDuplicateManuscript}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
      />
    </div>
  );
}
