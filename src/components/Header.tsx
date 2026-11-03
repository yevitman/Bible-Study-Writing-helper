import React from 'react';
import {
  BookOpen,
  Sparkles,
  FileText,
  Monitor,
  Printer,
  Download,
  Copy,
  FolderOpen,
  PlusCircle,
  Wand2,
  Check,
} from 'lucide-react';
import { ViewMode, BibleStudyManuscript } from '../types/manuscript';

interface HeaderProps {
  currentManuscript: BibleStudyManuscript;
  savedManuscripts: BibleStudyManuscript[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenGenerator: () => void;
  onOpenToolkit: (tab?: string) => void;
  onOpenDrawer: () => void;
  onSelectPreset: (presetId: string) => void;
  onExportMarkdown: () => void;
  onCopyClipboard: (type: 'all' | 'handout') => void;
  hasCopied: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentManuscript,
  savedManuscripts,
  viewMode,
  setViewMode,
  onOpenGenerator,
  onOpenToolkit,
  onOpenDrawer,
  onExportMarkdown,
  onCopyClipboard,
  hasCopied,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-stone-900 flex items-center justify-center text-amber-100 shadow-sm shrink-0">
              <BookOpen className="w-5 h-5 text-amber-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-stone-900 tracking-tight truncate">
                  말씀과 나눔
                </span>
                <span className="hidden sm:inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 font-medium">
                  성경공부 원고집필 도우미
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate hidden md:block">
                {currentManuscript.passage} · {currentManuscript.title}
              </p>
            </div>
          </div>

          {/* Center: View Switcher */}
          <div className="hidden lg:flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200/80 text-xs font-medium">
            <button
              onClick={() => setViewMode('leader')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'leader'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              인도자용 전체 원고
            </button>
            <button
              onClick={() => setViewMode('handout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'handout'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              참여자용 나눔지
            </button>
            <button
              onClick={() => setViewMode('teleprompter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'teleprompter'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-blue-700" />
              인도자 프롬프터
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* AI Toolkit Button */}
            <button
              onClick={() => onOpenToolkit()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs"
              title="예화, 원어연구, 나눔질문, 관주 성경 보조도구"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">AI 묵상도구</span>
            </button>

            {/* AI Generate New Button */}
            <button
              onClick={onOpenGenerator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>새 원고 생성</span>
            </button>

            {/* Quick Export/Print Dropdown or Buttons */}
            <div className="flex items-center border-l border-stone-200 pl-2 gap-1">
              <button
                onClick={() => onCopyClipboard(viewMode === 'handout' ? 'handout' : 'all')}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                title={hasCopied ? '복사 완료!' : '클립보드 복사'}
              >
                {hasCopied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={onExportMarkdown}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                title="마크다운(.md) 파일 저장"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => window.print()}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                title="인쇄 및 PDF 저장"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenDrawer}
                className="relative p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                title="원고 보관함"
              >
                <FolderOpen className="w-4 h-4" />
                {savedManuscripts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-stone-100 text-xs">
          <button
            onClick={() => setViewMode('leader')}
            className={`px-2 py-1 rounded-md ${
              viewMode === 'leader' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600'
            }`}
          >
            인도자 원고
          </button>
          <button
            onClick={() => setViewMode('handout')}
            className={`px-2 py-1 rounded-md ${
              viewMode === 'handout' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-stone-600'
            }`}
          >
            참여자 나눔지
          </button>
          <button
            onClick={() => setViewMode('teleprompter')}
            className={`px-2 py-1 rounded-md ${
              viewMode === 'teleprompter' ? 'bg-blue-100 text-blue-900 font-bold' : 'text-stone-600'
            }`}
          >
            발표 프롬프터
          </button>
        </div>
      </div>
    </header>
  );
};
