import React, { useState } from 'react';
import { Printer, Eye, EyeOff, BookOpen, Quote, CheckSquare, PenLine } from 'lucide-react';
import { BibleStudyManuscript } from '../types/manuscript';

interface ParticipantHandoutViewProps {
  manuscript: BibleStudyManuscript;
}

export const ParticipantHandoutView: React.FC<ParticipantHandoutViewProps> = ({
  manuscript,
}) => {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner with Quick Actions (Hidden in Print) */}
      <div className="no-print bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            A4
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-950">
              소그룹 참여자용 나눔지 (1~2페이지 맞춤 규격)
            </h3>
            <p className="text-[11px] text-emerald-800">
              구역식구, 소그룹 조원, 학생들에게 배포하거나 출력하여 나누는 요약본입니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 transition-colors"
          >
            {showAnswers ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>빈칸 가리기(인쇄용)</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>빈칸 정답 보기</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>나눔지 바로 인쇄</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 styling) */}
      <div className="bg-white rounded-2xl border border-stone-300 shadow-sm p-8 sm:p-10 space-y-6 font-sans text-stone-900 print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="border-b-2 border-stone-800 pb-4 text-center space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>말씀과 나눔 · 성경공부</span>
            <span>일시: ______년 ___월 ___일 / 성명: ________</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-stone-900 tracking-tight">
            {manuscript.title}
          </h1>
          <p className="text-sm font-medium text-stone-600">
            {manuscript.subtitle}
          </p>
          <div className="pt-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-stone-100 text-stone-800 font-bold text-xs border border-stone-200">
              본문: {manuscript.passage}
            </span>
          </div>
        </div>

        {/* Key Scripture */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
          <div className="flex items-start gap-2.5">
            <Quote className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-serif text-sm font-medium leading-relaxed italic text-stone-900">
                "{manuscript.keyVerse}"
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            오늘의 말씀 요약 (Message Summary)
          </h2>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-stone-50/50 p-3.5 rounded-xl border border-stone-100">
            {manuscript.participantHandout.summary}
          </p>
        </div>

        {/* Fill in the Blanks */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1">
            <PenLine className="w-3.5 h-3.5 text-blue-700" />
            말씀 묵상 빈칸 채우기
          </h2>
          <div className="space-y-2 pt-1">
            {manuscript.participantHandout.fillInTheBlanks.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-800"
              >
                {showAnswers ? (
                  <span className="font-medium text-emerald-900">{item}</span>
                ) : (
                  <span>{item}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3 Outline Points Summary */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1">
            <span className="w-2 h-2 rounded-full bg-amber-700" />
            말씀의 핵심 대지
          </h2>
          <div className="grid grid-cols-1 gap-2 pt-1">
            {manuscript.outlines.map((ot, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-stone-200 bg-white space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-xs sm:text-sm text-stone-900">
                    {ot.pointNumber}. {ot.title}
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium">
                    ({ot.verses})
                  </span>
                </div>
                <p className="text-xs text-stone-600 line-clamp-2">
                  {ot.exegesis}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Small Group Discussion Questions & Note Space */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            함께 나누는 삶의 질문 (Discussion & Sharing)
          </h2>
          <div className="space-y-3 pt-1">
            {manuscript.deepQuestions.application.slice(0, 3).map((q, idx) => (
              <div key={idx} className="space-y-1.5">
                <p className="text-xs sm:text-sm font-semibold text-stone-800">
                  Q{idx + 1}. {q}
                </p>
                <div className="h-14 border border-dashed border-stone-300 rounded-lg p-2 text-[11px] text-stone-400 bg-stone-50/40">
                  나의 묵상 및 조원들의 나눔 기록...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Mission & Closing */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
            <CheckSquare className="w-4 h-4 text-amber-800" />
            <span>이번 주 나의 생활 실천 미션 (Weekly Mission)</span>
          </div>
          <p className="text-xs text-stone-800 leading-relaxed pl-5 font-medium">
            {manuscript.participantHandout.weeklyMission}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-stone-200 text-center text-[11px] text-stone-400">
          "주의 말씀은 내 발에 등이요 내 길에 빛이니이다" (시편 119:105)
        </div>
      </div>
    </div>
  );
};
