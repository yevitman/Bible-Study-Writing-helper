import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Quote,
  Clock,
} from 'lucide-react';
import { BibleStudyManuscript } from '../types/manuscript';

interface PresentationModeProps {
  manuscript: BibleStudyManuscript;
  onExit: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  manuscript,
  onExit,
}) => {
  const [fontSize, setFontSize] = useState<number>(18);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Steps for presentation
  const steps = [
    {
      title: '도입 & 성경 본문',
      subtitle: manuscript.passage,
      content: (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200">
            <Quote className="w-8 h-8 text-amber-700 opacity-60 mb-2" />
            <p className="font-serif italic font-medium leading-relaxed">
              "{manuscript.keyVerse}"
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-amber-800">도입 질문</h3>
            <p className="font-medium">"{manuscript.iceBreaker.question}"</p>
            <div className="p-4 rounded-xl bg-stone-100 text-stone-700 leading-relaxed text-base">
              {manuscript.iceBreaker.illustration}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '본문 배경 및 원어 묵상',
      subtitle: '역사적 상황과 핵심 단어',
      content: (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-stone-100 space-y-2">
            <h4 className="font-bold text-stone-900">역사적 · 문화적 배경</h4>
            <p className="text-stone-700 leading-relaxed">
              {manuscript.historicalContext.background}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {manuscript.wordStudies.map((w, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-stone-200 bg-white space-y-1">
                <span className="font-serif font-bold text-amber-900 text-lg block">
                  {w.originalWord}
                </span>
                <p className="font-medium text-stone-800">{w.meaning}</p>
                <p className="text-stone-600 text-sm">{w.insight}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Outlines
    ...manuscript.outlines.map((ot, idx) => ({
      title: `${ot.pointNumber}대지: ${ot.title}`,
      subtitle: `본문: ${ot.verses}`,
      content: (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <p className="leading-relaxed whitespace-pre-line text-stone-900">
              {ot.exegesis}
            </p>
            {ot.modernAnalogy && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-stone-800 text-base">
                <span className="font-bold text-amber-900 block mb-1">💡 일상 비유 & 예화</span>
                {ot.modernAnalogy}
              </div>
            )}
          </div>
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
            <span className="font-bold text-emerald-900 block">💬 조원 나눔 질문</span>
            <p className="font-semibold text-emerald-950 text-lg">
              "{ot.discussionQuestion}"
            </p>
          </div>
        </div>
      ),
    })),
    {
      title: '삶의 적용 & 마침 기도',
      subtitle: '결단과 중보',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {manuscript.lifeApplication.map((app, i) => (
              <div key={i} className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
                <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-xs">
                  {app.domain}
                </span>
                <p className="text-stone-800 font-medium leading-relaxed">
                  {app.actionItem}
                </p>
              </div>
            ))}
          </div>
          <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
            <span className="font-bold text-amber-900 text-sm block">🙏 합심 기도문</span>
            <p className="font-serif italic text-stone-900 leading-relaxed text-lg">
              "{manuscript.closingPrayer}"
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[activeStep] || steps[0];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900 text-stone-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Controller Bar */}
      <div className="px-6 py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-amber-400 text-sm sm:text-base">
            {manuscript.passage}
          </span>
          <span className="text-stone-500 text-xs hidden md:inline">|</span>
          <span className="text-stone-300 text-xs truncate max-w-[200px] sm:max-w-[300px] hidden sm:inline">
            {manuscript.title}
          </span>
        </div>

        {/* Stopwatch & Font Size */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700/60 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold text-sm tracking-wider">
              {formatTimer(secondsElapsed)}
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 hover:text-amber-300 transition-colors"
              title={isTimerRunning ? '일시정지' : '시작'}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setSecondsElapsed(0);
              }}
              className="p-1 hover:text-stone-400 transition-colors"
              title="리셋"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-stone-800/80 px-2 py-1 rounded-xl border border-stone-700/60">
            <button
              onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
              className="p-1 text-stone-300 hover:text-white"
              title="글씨 축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-stone-400 w-6 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize((prev) => Math.min(28, prev + 2))}
              className="p-1 text-stone-300 hover:text-white"
              title="글씨 확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onExit}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            title="프롬프터 종료 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content Area */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 max-w-4xl mx-auto w-full flex flex-col justify-between">
        <div className="space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
              <span>단계 {activeStep + 1} / {steps.length}</span>
              <span>{currentStepData.subtitle}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {currentStepData.title}
            </h2>
          </div>

          <div
            className="text-stone-200 leading-relaxed font-sans transition-all"
            style={{ fontSize: `${fontSize}px` }}
          >
            {currentStepData.content}
          </div>
        </div>

        {/* Step Indicator dots & Navigation */}
        <div className="pt-8 flex items-center justify-between border-t border-stone-800/80 mt-8">
          <button
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            이전 단계
          </button>

          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  activeStep === idx
                    ? 'w-6 bg-amber-400'
                    : 'bg-stone-700 hover:bg-stone-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
            disabled={activeStep === steps.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors disabled:opacity-30"
          >
            다음 단계
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
