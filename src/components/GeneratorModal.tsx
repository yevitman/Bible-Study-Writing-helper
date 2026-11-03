import React, { useState } from 'react';
import { Sparkles, X, BookOpen, Clock, Users, BookMarked, Loader2, Compass } from 'lucide-react';
import { BibleStudyManuscript } from '../types/manuscript';

interface GeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStudy: BibleStudyManuscript) => void;
}

const QUICK_PASSAGE_CHIPS = [
  { passage: '로마서 8:28-39', theme: '합력하여 선을 이루시는 은혜', target: '구역예배 / 소그룹' },
  { passage: '시편 23:1-6', theme: '선한 목자의 안식과 인도하심', target: '전교인 / 묵상' },
  { passage: '요한복음 15:1-8', theme: '포도나무와 가지, 참된 연합', target: '청년부 / 제자훈련' },
  { passage: '창세기 12:1-4', theme: '믿음의 순종과 언약의 복', target: '헌신 / 새가족' },
  { passage: '빌립보서 4:4-7', theme: '염려를 뛰어넘는 평강의 기도', target: '직장인 / 청년' },
  { passage: '갈라디아서 5:22-26', theme: '성령의 9가지 열매와 동행', target: '성도 일반' },
  { passage: '마태복음 5:1-12', theme: '산상수훈: 천국 백성의 팔복', target: '성경연구반' },
  { passage: '에베소서 2:1-10', theme: '오직 은혜로 말미암은 구원', target: '새신자 / 교리' },
];

export const GeneratorModal: React.FC<GeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passage, setPassage] = useState('');
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('장년 및 청년 소그룹 (구역예배 / 다락방)');
  const [studyType, setStudyType] = useState('소그룹 나눔 및 강해');
  const [tone, setTone] = useState('은혜와 위로, 개혁주의적 구원의 확신');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleApplyChip = (chip: typeof QUICK_PASSAGE_CHIPS[0]) => {
    setPassage(chip.passage);
    setTopic(chip.theme);
    setTargetAudience(chip.target);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passage.trim() && !topic.trim()) {
      setErrorMsg('성경 본문 또는 주제 중 최소 하나는 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/gemini/generate-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: passage.trim(),
          topic: topic.trim(),
          targetAudience,
          studyType,
          tone,
          specialRequests: specialRequests.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '원고 생성 요청이 실패했습니다.');
      }

      const data = await res.json();
      const newManuscript: BibleStudyManuscript = {
        ...data,
        id: 'study-' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [data.passage.split(' ')[0] || '성경공부', studyType.split(' ')[0]],
      };

      onSuccess(newManuscript);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '원고 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-stone-900 text-base">
                새 성경공부 원고 집필 (AI 작성)
              </h2>
              <p className="text-xs text-stone-500">
                본문과 대상에 꼭 맞춘 강해 주해, 원어 연구, 예화, 3대지, 나눔 질문까지 완전 집필
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Quick Preset Chips */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>추천 성경 본문 바로 선택</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PASSAGE_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyChip(chip)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 text-stone-700 hover:text-amber-900 transition-colors"
                >
                  <span className="font-medium">{chip.passage}</span>
                  <span className="text-stone-400 ml-1">({chip.theme.slice(0, 8)}...)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Inputs: Passage & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                성경 본문 구절 <span className="text-amber-700">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  placeholder="예: 로마서 8:28-39 또는 룻기 1장"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
                <BookOpen className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                핵심 주제 / 제목 (선택)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="비워두면 본문 기반 최적 주제 자동 선정"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>
          </div>

          {/* Audience & Study Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                스터디 대상
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              >
                <option value="장년 및 청년 소그룹 (구역예배 / 다락방)">장년 및 청년 소그룹 (구역예배 / 다락방)</option>
                <option value="청년부 / 대학부 캠퍼스 모임">청년부 / 대학부 캠퍼스 모임</option>
                <option value="새가족반 및 초신자 성경공부">새가족반 및 초신자 성경공부</option>
                <option value="직장인 점심/주중 성경모임">직장인 점심/주중 성경모임</option>
                <option value="청소년부 / 중고등부 주일공과">청소년부 / 중고등부 주일공과</option>
                <option value="제자훈련 / 심화 성경통독반">제자훈련 / 심화 성경통독반</option>
                <option value="어르신 및 시니어 구역예배">어르신 및 시니어 구역예배</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                모임 형태
              </label>
              <select
                value={studyType}
                onChange={(e) => setStudyType(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              >
                <option value="소그룹 나눔 및 강해">소그룹 나눔 및 강해 (인도자+참여자)</option>
                <option value="구역예배 설교형 원고">구역예배 설교형 원고 (15~20분 메시지)</option>
                <option value="QT 나눔 및 묵상 가이드">QT 나눔 및 묵상 가이드</option>
                <option value="귀납적 성경연구(IBS) 심층반">귀납적 성경연구(IBS) 심층반</option>
                <option value="교리 및 성경신학 기초반">교리 및 성경신학 기초반</option>
              </select>
            </div>
          </div>

          {/* Tone & Perspective */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              진행 톤 & 신학적 관점
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { label: '은혜와 위로', val: '은혜와 위로, 개혁주의적 구원의 확신' },
                { label: '실천적 삶의 적용', val: '구체적이고 실천적인 삶의 적용 중심' },
                { label: '성경신학/원어강해', val: '원어와 역사적 맥락에 충실한 강해식' },
                { label: '친근한 대화체', val: '부담 없는 친근한 소그룹 대화체' },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setTone(t.val)}
                  className={`px-2.5 py-2 rounded-xl border text-center transition-all ${
                    tone === t.val
                      ? 'border-amber-600 bg-amber-50/80 text-amber-950 font-semibold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              특별 강조 요청사항 (선택)
            </label>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="예: 이번 주 성도들의 직장 생활 속 스트레스와 염려에 깊이 공감하는 예화를 꼭 넣어주세요."
              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-amber-700 animate-spin shrink-0" />
              <div className="text-xs text-amber-900">
                <p className="font-semibold">성경 본문 주해 및 맞춤형 원고를 집필하고 있습니다...</p>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  본문 역사적 배경, 히브리어/헬라어 원어 연구, 3대지 강해, 나눔 질문을 정성껏 구성 중입니다.
                </p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-stone-900 text-stone-50 hover:bg-stone-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  집필 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  원고 자동 집필 시작
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
