import React, { useState } from 'react';
import { X, Search, BookOpen, Trash2, Copy, Clock, Calendar, Sparkles } from 'lucide-react';
import { BibleStudyManuscript } from '../types/manuscript';
import { samplePresets } from '../data/samplePresets';

interface SavedManuscriptsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedManuscripts: BibleStudyManuscript[];
  currentManuscriptId: string;
  onSelectManuscript: (manuscript: BibleStudyManuscript) => void;
  onDeleteManuscript: (id: string) => void;
  onDuplicateManuscript: (manuscript: BibleStudyManuscript) => void;
  onOpenGenerator: () => void;
}

export const SavedManuscriptsDrawer: React.FC<SavedManuscriptsDrawerProps> = ({
  isOpen,
  onClose,
  savedManuscripts,
  currentManuscriptId,
  onSelectManuscript,
  onDeleteManuscript,
  onDuplicateManuscript,
  onOpenGenerator,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Combine user saved manuscripts and sample presets, eliminating duplicate IDs
  const allList: { item: BibleStudyManuscript; isSample: boolean }[] = [
    ...savedManuscripts.map((item) => ({ item, isSample: false })),
    ...samplePresets
      .filter((s) => !savedManuscripts.some((u) => u.id === s.id))
      .map((item) => ({ item, isSample: true })),
  ];

  const filtered = allList.filter(({ item }) => {
    const term = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      item.passage.toLowerCase().includes(term) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(term))) ||
      item.targetAudience.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div>
            <h2 className="font-serif font-bold text-stone-900 text-base">
              원고 보관함 및 프리셋
            </h2>
            <p className="text-xs text-stone-500">
              총 {allList.length}편의 성경공부 교재 및 원고
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-4 border-b border-stone-100 space-y-2">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="본문, 제목, 키워드 검색..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenGenerator();
            }}
            className="w-full py-2 px-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>AI 맞춤 원고 새로 집필하기</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              검색된 성경공부 원고가 없습니다.
            </div>
          ) : (
            filtered.map(({ item, isSample }) => {
              const isSelected = item.id === currentManuscriptId;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectManuscript(item);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all space-y-2 relative group ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/60 ring-1 ring-amber-500/20 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                      {item.passage}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {isSample ? '추천 표준 원고' : '내 보관함'}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-stone-900 text-sm line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-stone-500 line-clamp-1">
                    {item.subtitle}
                  </p>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.estimatedTimeMinutes}분</span>
                    </div>

                    <div
                      className="flex items-center gap-1 opacity-80 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onDuplicateManuscript(item)}
                        className="p-1 hover:text-stone-800 rounded hover:bg-stone-100"
                        title="원고 복제"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {!isSample && (
                        <button
                          onClick={() => onDeleteManuscript(item.id)}
                          className="p-1 hover:text-red-700 rounded hover:bg-red-50"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-stone-400 hover:text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
