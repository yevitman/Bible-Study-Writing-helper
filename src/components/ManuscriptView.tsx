import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Quote,
  Scroll,
  MessageCircle,
  HeartHandshake,
  CheckCircle2,
  FileEdit,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Flame,
  Plus,
  Trash2,
} from 'lucide-react';
import { BibleStudyManuscript } from '../types/manuscript';

interface ManuscriptViewProps {
  manuscript: BibleStudyManuscript;
  onUpdate: (updated: BibleStudyManuscript) => void;
  onOpenToolkitWithText?: (text: string) => void;
}

export const ManuscriptView: React.FC<ManuscriptViewProps> = ({
  manuscript,
  onUpdate,
  onOpenToolkitWithText,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdateField = (path: string[], value: any) => {
    const updated = JSON.parse(JSON.stringify(manuscript));
    let cur = updated;
    for (let i = 0; i < path.length - 1; i++) {
      cur = cur[path[i]];
    }
    cur[path[path.length - 1]] = value;
    cur.updatedAt = new Date().toISOString();
    onUpdate(updated);
  };

  const calculateTotalWords = () => {
    const text = JSON.stringify(manuscript);
    return text.replace(/[^\w\s가-힣]/g, '').length;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header Card */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 via-transparent to-transparent pointer-events-none rounded-tr-2xl" />

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            {manuscript.passage}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
            {manuscript.targetAudience}
          </span>
          {manuscript.studyType && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
              {manuscript.studyType}
            </span>
          )}
          <div className="ml-auto flex items-center text-xs text-stone-500 gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>예상 {manuscript.estimatedTimeMinutes}분</span>
            <span className="text-stone-300">·</span>
            <span>약 {calculateTotalWords()}자</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight leading-snug">
            {manuscript.title}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {manuscript.subtitle}
          </p>
        </div>

        {/* Key Scripture Quote Callout */}
        <div className="mt-6 p-4 sm:p-5 rounded-xl bg-amber-50/70 border-l-4 border-amber-600 border-stone-200 text-amber-950">
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 opacity-80" />
            <div>
              <p className="font-serif text-sm sm:text-base font-medium leading-relaxed italic">
                "{manuscript.keyVerse}"
              </p>
              <p className="text-xs text-amber-800 font-semibold mt-1">
                — 본문 핵심 요절
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Ice Breaker (도입 및 예화) */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-700" />
            </div>
            <h2 className="font-serif font-bold text-stone-900 text-lg">
              1. 마음을 여는 도입 (Ice Breaker & Hook)
            </h2>
          </div>
          <button
            onClick={() => toggleSection('iceBreaker')}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            {collapsedSections['iceBreaker'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!collapsedSections['iceBreaker'] && (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-100">
              <span className="text-xs font-semibold text-orange-900 uppercase tracking-wide block mb-1">
                💬 나눔을 여는 질문 ({manuscript.iceBreaker.title})
              </span>
              <p className="text-sm font-medium text-stone-800">
                "{manuscript.iceBreaker.question}"
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-stone-500">
                  📖 도입 스토리 / 예화
                </span>
                {onOpenToolkitWithText && (
                  <button
                    onClick={() => onOpenToolkitWithText(manuscript.iceBreaker.illustration)}
                    className="text-[11px] text-amber-800 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    예화 다듬기
                  </button>
                )}
              </div>
              <p className="text-sm text-stone-700 leading-relaxed bg-stone-50/60 p-4 rounded-xl border border-stone-100 whitespace-pre-line">
                {manuscript.iceBreaker.illustration}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. Historical & Theological Context (배경 및 신학적 주제) */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Scroll className="w-4 h-4 text-blue-700" />
            </div>
            <h2 className="font-serif font-bold text-stone-900 text-lg">
              2. 본문 배경 및 신학적 통찰 (Context & Theology)
            </h2>
          </div>
          <button
            onClick={() => toggleSection('historical')}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            {collapsedSections['historical'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!collapsedSections['historical'] && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-100 space-y-1.5">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                🏛️ 역사적 · 문화적 맥락
              </span>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {manuscript.historicalContext.background}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-1.5">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                ✝️ 핵심 신학적 주제
              </span>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {manuscript.historicalContext.theologicalTheme}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 4. Greek / Hebrew Word Study (원어 연구) */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
              <Layers className="w-4 h-4 text-purple-700" />
            </div>
            <h2 className="font-serif font-bold text-stone-900 text-lg">
              3. 히브리어 · 헬라어 원어 심층 묵상 (Word Study)
            </h2>
          </div>
          <button
            onClick={() => toggleSection('words')}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            {collapsedSections['words'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!collapsedSections['words'] && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {manuscript.wordStudies.map((w, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:border-purple-200 hover:bg-purple-50/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif font-bold text-sm text-purple-950">
                      {w.originalWord}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800">
                      원어 어근
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-stone-800 mb-1.5">
                    {w.meaning}
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {w.insight}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. 3-Point Exegetical Outline (3대지 본문 강해 & 조별 나눔) */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-stone-900 text-lg">
                4. 대지별 본문 강해 및 나눔 (Exegesis & Outline)
              </h2>
              <p className="text-xs text-stone-500">
                각 대지마다 본문 주해, 일상 비유, 소그룹 나눔 질문이 유기적으로 연결됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleSection('outlines')}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            {collapsedSections['outlines'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!collapsedSections['outlines'] && (
          <div className="space-y-6 pt-1">
            {manuscript.outlines.map((outline, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden"
              >
                {/* Outline Header */}
                <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-700 text-amber-50 font-bold text-xs flex items-center justify-center">
                      {outline.pointNumber}
                    </span>
                    <h3 className="font-serif font-bold text-stone-900 text-base">
                      {outline.title}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-stone-200 text-stone-600">
                    본문: {outline.verses}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Exegesis */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-stone-500">
                        📖 성경 강해 및 해설 (Exegesis)
                      </span>
                      {onOpenToolkitWithText && (
                        <button
                          onClick={() => onOpenToolkitWithText(outline.exegesis)}
                          className="text-[11px] text-amber-800 hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          문체 다듬기
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line">
                      {outline.exegesis}
                    </p>
                  </div>

                  {/* Modern Analogy */}
                  {outline.modernAnalogy && (
                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-stone-700">
                      <span className="font-semibold text-amber-900 block mb-1">
                        💡 삶의 비유 및 예시:
                      </span>
                      {outline.modernAnalogy}
                    </div>
                  )}

                  {/* Discussion Question */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-stone-800">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1 mb-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                      이 대지에 대한 소그룹 나눔 질문:
                    </span>
                    <p className="font-medium text-stone-900">
                      "{outline.discussionQuestion}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Inductive Discussion Questions (귀납적 3단계 나눔 질문) */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-emerald-700" />
            </div>
            <h2 className="font-serif font-bold text-stone-900 text-lg">
              5. 귀납적 성경연구(IBS) 3단계 나눔 질문
            </h2>
          </div>
          <button
            onClick={() => toggleSection('deepQuestions')}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            {collapsedSections['deepQuestions'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!collapsedSections['deepQuestions'] && (
          <div className="space-y-4 pt-1">
            {/* Observation */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                1단계: 관찰 질문 (Observation - 본문 사실 확인)
              </h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-stone-700 pl-4 list-disc marker:text-blue-500">
                {manuscript.deepQuestions.observation.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            {/* Interpretation */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2">
              <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                2단계: 해석 질문 (Interpretation - 영적 의미와 원리 탐구)
              </h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-stone-700 pl-4 list-disc marker:text-purple-500">
                {manuscript.deepQuestions.interpretation.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            {/* Application */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                3단계: 적용 질문 (Application - 나의 삶과 내면 나누기)
              </h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-stone-700 pl-4 list-disc marker:text-emerald-500">
                {manuscript.deepQuestions.application.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* 7. Life Application (삶의 실천적 적용) */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
            </div>
            <h2 className="font-serif font-bold text-stone-900 text-lg">
              6. 삶의 구체적 실천 과제 (Life Application)
            </h2>
          </div>
          <button
            onClick={() => toggleSection('lifeApp')}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            {collapsedSections['lifeApp'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!collapsedSections['lifeApp'] && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {manuscript.lifeApplication.map((app, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1.5"
              >
                <span className="text-xs font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md inline-block">
                  {app.domain}
                </span>
                <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
                  {app.actionItem}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 8. Closing Prayer (마침 기도문) */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-stone-700" />
            </div>
            <h2 className="font-serif font-bold text-stone-900 text-lg">
              7. 마침 및 합심 기도문 (Closing Prayer)
            </h2>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-amber-50/30 border border-amber-200/50 space-y-2">
          <p className="text-sm font-serif text-stone-800 leading-relaxed whitespace-pre-line italic">
            "{manuscript.closingPrayer}"
          </p>
        </div>
      </section>
    </div>
  );
};
