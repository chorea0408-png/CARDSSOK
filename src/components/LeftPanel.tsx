import React from 'react';
import { useEditorStore } from '../store';
import { PlusCircle, AlertCircle, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export const LeftPanel: React.FC = () => {
  const {
    slides, selectedSlideId, multiSelectedIds,
    selectSlide, toggleMultiSelect, clearMultiSelect,
    addSlide, deleteSlide, deleteSelected,
  } = useEditorStore();

  const hasMulti = multiSelectedIds.length > 0;

  return (
    <aside className="w-full h-full border-r border-gray-200 bg-gray-50 flex flex-col overflow-y-auto">
      <div className="p-4 flex-1">

        {/* 헤더 — 다중선택 시 배너 표시 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Slide List
          </h2>
          {hasMulti && (
            <button
              onClick={clearMultiSelect}
              className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
            >
              선택 해제
            </button>
          )}
        </div>

        {/* 다중선택 일괄삭제 버튼 */}
        {hasMulti && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-xs text-blue-700 font-medium">
              {multiSelectedIds.length}장 선택됨
            </span>
            <button
              onClick={() => {
                if (slides.length <= multiSelectedIds.length) return;
                deleteSelected();
              }}
              disabled={slides.length <= multiSelectedIds.length}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-40"
            >
              <Trash2 size={11} />
              삭제
            </button>
          </div>
        )}

        <div className="space-y-2">
          {slides.map((slide, index) => {
            const isSelected   = slide.slide_id === selectedSlideId;
            const isMulti      = multiSelectedIds.includes(slide.slide_id);
            const hasError     = slide.content.headline.replace(/\n/g, '').length > slide.constraints.max_headline_length;

            return (
              <div key={slide.slide_id} className="relative group/item">
                {/* 다중선택 체크박스 (hover 시 나타남, 또는 이미 선택된 경우) */}
                <div
                  className={clsx(
                    'absolute left-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                    isMulti
                      ? 'opacity-100 bg-blue-600 border-blue-600'
                      : 'opacity-0 group-hover/item:opacity-100 bg-white border-gray-400'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMultiSelect(slide.slide_id);
                  }}
                >
                  {isMulti && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      // Ctrl/Cmd+클릭: 다중선택 토글
                      toggleMultiSelect(slide.slide_id);
                    } else {
                      selectSlide(slide.slide_id);
                    }
                  }}
                  className={clsx(
                    'w-full text-left p-3 pl-8 rounded-lg border text-sm transition-all',
                    isMulti
                      ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300'
                      : isSelected
                        ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-600'
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={clsx('font-medium', isMulti ? 'text-blue-700' : 'text-gray-900')}>
                      [{index + 1}] {slide.slide_type}
                    </span>
                    {hasError && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 truncate" title={slide.content.headline}>
                    {slide.content.headline.replace(/\n/g, ' ')}
                  </p>
                </button>

                {/* 삭제 버튼 — hover 시 표시 (다중선택 아닐 때) */}
                {slides.length > 1 && !isMulti && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSlide(slide.slide_id);
                    }}
                    title="슬라이드 삭제"
                    className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={addSlide}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <PlusCircle size={16} />
          Add Slide
        </button>

        {/* 다중선택 안내 */}
        <p className="mt-3 text-center text-[10px] text-gray-400">
          Ctrl+클릭으로 여러 슬라이드 선택
        </p>
      </div>
    </aside>
  );
};
