import React, { useState } from 'react';
import {
  Wand2,
  X,
  Lightbulb,
  Search,
  MessageSquare,
  Compass,
  FileEdit,
  Loader2,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { BibleStudyManuscript } from '../types/manuscript';

interface AIToolkitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentManuscript: BibleStudyManuscript;
  onInsertWordStudy?: (word: any) => void;
  onInsertIllustration?: (story: string) => void;
  onInsertQuestion?: (stage: 'observation' | 'interpretation' | 'application', q: string) => void;
}

type ToolkitTab = 'illustration' | 'wordStudy' | 'questions' | 'crossRef' | 'refine';

export const AIToolkitModal: React.FC<AIToolkitModalProps> = ({
  isOpen,
  onClose,
  currentManuscript,
  onInsertWordStudy,
  onInsertIllustration,
  onInsertQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<ToolkitTab>('illustration');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Sub-tool states
  // 1. Illustration
  const [illPassage, setIllPassage] = useState(currentManuscript.passage);
  const [illTheme, setIllTheme] = useState(currentManuscript.title);
  const [illStyle, setIllStyle] = useState('현대적 일상 및 감동 실화');
  const [illustrations, setIllustrations] = useState<any[]>([]);
  const [loadingIll, setLoadingIll] = useState(false);

  // 2. Word Study
  const [wordPassage, setWordPassage] = useState(currentManuscript.passage);
  const [wordKeyword, setWordKeyword] = useState('사랑, 은혜, 섭리, 승리');
  const [wordStudies, setWordStudies] = useState<any[]>([]);
  const [loadingWord, setLoadingWord] = useState(false);

  // 3. Questions
  const [qPassage, setQPassage] = useState(currentManuscript.passage);
  const [qTopic, setQTopic] = useState(currentManuscript.title);
  const [qFocus, setQFocus] = useState('삶의 변화와 솔직한 마음 나눔');
  const [questionData, setQuestionData] = useState<any>(null);
  const [loadingQ, setLoadingQ] = useState(false);

  // 4. Cross-references
  const [crossPassage, setCrossPassage] = useState(currentManuscript.passage);
  const [crossTheme, setCrossTheme] = useState(currentManuscript.title);
  const [crossRefs, setCrossRefs] = useState<any[]>([]);
  const [loadingCross, setLoadingCross] = useState(false);

  // 5. Refine text
  const [textToRefine, setTextToRefine] = useState('');
  const [refineAction, setRefineAction] = useState('warm_grace');
  const [customRefineInstruction, setCustomRefineInstruction] = useState('');
  const [refinedResult, setRefinedResult] = useState('');
  const [loadingRefine, setLoadingRefine] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idKey);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Handlers
  const handleFetchIllustrations = async () => {
    setLoadingIll(true);
    try {
      const res = await fetch('/api/gemini/generate-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: illPassage,
          theme: illTheme,
          targetAudience: currentManuscript.targetAudience,
          style: illStyle,
        }),
      });
      const data = await res.json();
      setIllustrations(data.illustrations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIll(false);
    }
  };

  const handleFetchWordStudy = async () => {
    setLoadingWord(true);
    try {
      const res = await fetch('/api/gemini/generate-word-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: wordPassage,
          keyword: wordKeyword,
        }),
      });
      const data = await res.json();
      setWordStudies(data.wordStudies || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWord(false);
    }
  };

  const handleFetchQuestions = async () => {
    setLoadingQ(true);
    try {
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: qPassage,
          topic: qTopic,
          targetAudience: currentManuscript.targetAudience,
          focus: qFocus,
        }),
      });
      const data = await res.json();
      setQuestionData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQ(false);
    }
  };

  const handleFetchCrossRefs = async () => {
    setLoadingCross(true);
    try {
      const res = await fetch('/api/gemini/cross-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: crossPassage,
          theme: crossTheme,
        }),
      });
      const data = await res.json();
      setCrossRefs(data.crossReferences || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCross(false);
    }
  };

  const handleRefineText = async () => {
    if (!textToRefine.trim()) return;
    setLoadingRefine(true);
    try {
      const res = await fetch('/api/gemini/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: textToRefine,
          actionType: refineAction,
          instruction: customRefineInstruction,
        }),
      });
      const data = await res.json();
      setRefinedResult(data.refinedText || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRefine(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-amber-50 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-amber-100" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-stone-900 text-base">
                성경공부 집필 AI 툴킷
              </h2>
              <p className="text-xs text-stone-500">
                현재 본문: <span className="font-medium text-amber-900">{currentManuscript.passage}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 px-6 bg-white overflow-x-auto gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('illustration')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'illustration'
                ? 'border-amber-700 text-amber-900 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            도입 예화 발굴기
          </button>
          <button
            onClick={() => setActiveTab('wordStudy')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'wordStudy'
                ? 'border-amber-700 text-amber-900 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            원어(히브리/헬라어) 사전
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'questions'
                ? 'border-amber-700 text-amber-900 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            3단계 나눔 질문 빌더
          </button>
          <button
            onClick={() => setActiveTab('crossRef')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'crossRef'
                ? 'border-amber-700 text-amber-900 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            성경 상호관주
          </button>
          <button
            onClick={() => setActiveTab('refine')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'refine'
                ? 'border-amber-700 text-amber-900 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            원고 문체 다듬기
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: ILLUSTRATION */}
          {activeTab === 'illustration' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">본문 구절</label>
                  <input
                    type="text"
                    value={illPassage}
                    onChange={(e) => setIllPassage(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">핵심 주제</label>
                  <input
                    type="text"
                    value={illTheme}
                    onChange={(e) => setIllTheme(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">예화 스타일</label>
                  <select
                    value={illStyle}
                    onChange={(e) => setIllStyle(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                  >
                    <option value="현대적 일상 및 감동 실화">현대적 일상 및 감동 실화</option>
                    <option value="역사적 일화 및 위인 전기">역사적 일화 및 위인 전기</option>
                    <option value="자연 과학 및 우주 비유">자연 과학 및 우주 비유</option>
                    <option value="직장과 비즈니스 스토리">직장과 비즈니스 스토리</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleFetchIllustrations}
                  disabled={loadingIll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-colors disabled:opacity-50"
                >
                  {loadingIll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                  맞춤 예화 3개 찾기
                </button>
              </div>

              {illustrations.length > 0 && (
                <div className="space-y-3 mt-4">
                  {illustrations.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-white transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(item.story, `ill-${idx}`)}
                            className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1 px-2 py-1 rounded-md hover:bg-stone-100"
                          >
                            {copiedIndex === `ill-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            복사
                          </button>
                          {onInsertIllustration && (
                            <button
                              onClick={() => onInsertIllustration(item.story)}
                              className="text-amber-800 hover:text-amber-950 text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100/70 hover:bg-amber-200"
                            >
                              <Plus className="w-3 h-3" />
                              도입부에 적용
                            </button>
                          )}
                        </div>
                      </div>
                      <h4 className="font-serif font-bold text-stone-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">{item.story}</p>
                      <div className="pt-2 border-t border-stone-200/60 text-xs text-stone-500">
                        <span className="font-semibold text-amber-800">성경적 연결점:</span> {item.biblicalBridge}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WORD STUDY */}
          {activeTab === 'wordStudy' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">성경 구절</label>
                  <input
                    type="text"
                    value={wordPassage}
                    onChange={(e) => setWordPassage(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">연구할 핵심 단어(쉼표 구분)</label>
                  <input
                    type="text"
                    value={wordKeyword}
                    onChange={(e) => setWordKeyword(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleFetchWordStudy}
                  disabled={loadingWord}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {loadingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  원어(헬라어/히브리어) 심층 분석
                </button>
              </div>

              {wordStudies.length > 0 && (
                <div className="space-y-3 mt-4">
                  {wordStudies.map((w, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-serif font-bold text-amber-950">{w.word}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                            {w.language} {w.strongNumber ? `· ${w.strongNumber}` : ''}
                          </span>
                        </div>
                        {onInsertWordStudy && (
                          <button
                            onClick={() =>
                              onInsertWordStudy({
                                originalWord: w.word,
                                meaning: w.literalMeaning,
                                insight: w.theologicalDepth,
                              })
                            }
                            className="text-xs text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-md flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            원고에 추가
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-stone-800 font-medium">기본 의미: {w.literalMeaning}</p>
                      <p className="text-xs text-stone-600 leading-relaxed">{w.theologicalDepth}</p>
                      <div className="p-2.5 rounded-lg bg-white/70 border border-stone-200/80 text-[11px] text-stone-600">
                        <span className="font-semibold text-stone-800">💡 인도자 티칭 팁:</span> {w.teachingTip}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">본문 구절</label>
                  <input
                    type="text"
                    value={qPassage}
                    onChange={(e) => setQPassage(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">나눔 주제</label>
                  <input
                    type="text"
                    value={qTopic}
                    onChange={(e) => setQTopic(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">강조 포인트</label>
                  <input
                    type="text"
                    value={qFocus}
                    onChange={(e) => setQFocus(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleFetchQuestions}
                  disabled={loadingQ}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors disabled:opacity-50"
                >
                  {loadingQ ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  귀납적 3단계 질문 생성
                </button>
              </div>

              {questionData && (
                <div className="space-y-4 mt-4">
                  {/* Observation */}
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                    <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <span>1단계: 관찰 질문 (Fact Finding)</span>
                    </h4>
                    <div className="space-y-1.5">
                      {questionData.observationQuestions?.map((q: any, i: number) => (
                        <div key={i} className="text-xs text-stone-700 flex items-start justify-between gap-2 p-1.5 rounded-md hover:bg-white/80">
                          <span>• {q.question}</span>
                          {onInsertQuestion && (
                            <button
                              onClick={() => onInsertQuestion('observation', q.question)}
                              className="text-[11px] text-blue-800 hover:underline shrink-0"
                            >
                              + 추가
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interpretation */}
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                    <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <span>2단계: 해석 질문 (Spiritual Meaning)</span>
                    </h4>
                    <div className="space-y-1.5">
                      {questionData.interpretationQuestions?.map((q: any, i: number) => (
                        <div key={i} className="text-xs text-stone-700 flex items-start justify-between gap-2 p-1.5 rounded-md hover:bg-white/80">
                          <div>
                            <p>• {q.question}</p>
                            <p className="text-[11px] text-purple-800 font-medium pl-3 mt-0.5">의도: {q.intent}</p>
                          </div>
                          {onInsertQuestion && (
                            <button
                              onClick={() => onInsertQuestion('interpretation', q.question)}
                              className="text-[11px] text-purple-800 hover:underline shrink-0"
                            >
                              + 추가
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Application */}
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span>3단계: 삶의 적용 질문 (Heart & Life Sharing)</span>
                    </h4>
                    <div className="space-y-1.5">
                      {questionData.applicationQuestions?.map((q: any, i: number) => (
                        <div key={i} className="text-xs text-stone-700 flex items-start justify-between gap-2 p-1.5 rounded-md hover:bg-white/80">
                          <div>
                            <p>• {q.question}</p>
                            {q.sharingTip && <p className="text-[11px] text-amber-800 pl-3 mt-0.5">팁: {q.sharingTip}</p>}
                          </div>
                          {onInsertQuestion && (
                            <button
                              onClick={() => onInsertQuestion('application', q.question)}
                              className="text-[11px] text-amber-800 hover:underline shrink-0"
                            >
                              + 추가
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CROSS-REFERENCES */}
          {activeTab === 'crossRef' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">성경 본문</label>
                  <input
                    type="text"
                    value={crossPassage}
                    onChange={(e) => setCrossPassage(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">주제</label>
                  <input
                    type="text"
                    value={crossTheme}
                    onChange={(e) => setCrossTheme(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleFetchCrossRefs}
                  disabled={loadingCross}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
                >
                  {loadingCross ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                  성경 전권 연결 구절 찾기
                </button>
              </div>

              {crossRefs.length > 0 && (
                <div className="space-y-3 mt-4">
                  {crossRefs.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-stone-900">
                          {item.verseReference}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
                          {item.testament}
                        </span>
                      </div>
                      {item.verseSummary && (
                        <p className="text-xs text-stone-700 italic">"{item.verseSummary}"</p>
                      )}
                      <p className="text-xs text-stone-600 leading-relaxed">
                        <span className="font-semibold text-amber-900">연결 해설:</span> {item.connectionInsight}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REFINE TEXT */}
          {activeTab === 'refine' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  다듬고 싶은 원고 단락을 입력하세요
                </label>
                <textarea
                  rows={4}
                  value={textToRefine}
                  onChange={(e) => setTextToRefine(e.target.value)}
                  placeholder="원고 내용의 일부분을 붙여넣으세요..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">변환 스타일</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {[
                    { label: '따뜻한 은혜체', val: 'warm_grace' },
                    { label: '신학적 깊이 보강', val: 'theological_depth' },
                    { label: '풍성한 확장', val: 'expand' },
                    { label: '명확한 요약', val: 'summarize' },
                    { label: '소그룹 대화체', val: 'conversational' },
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      onClick={() => setRefineAction(btn.val)}
                      className={`px-2 py-1.5 rounded-lg border text-center transition-all ${
                        refineAction === btn.val
                          ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRefineText}
                  disabled={loadingRefine || !textToRefine.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-colors disabled:opacity-50"
                >
                  {loadingRefine ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileEdit className="w-3.5 h-3.5" />}
                  원고 문체 리라이팅
                </button>
              </div>

              {refinedResult && (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">수정 완료된 문장:</span>
                    <button
                      onClick={() => copyToClipboard(refinedResult, 'refined-text')}
                      className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"
                    >
                      {copiedIndex === 'refined-text' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      복사하기
                    </button>
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line">{refinedResult}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
