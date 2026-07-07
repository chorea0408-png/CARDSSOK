import React, { useRef, useState } from 'react';
import { useEditorStore } from '../store';
import { PlusCircle, AlertCircle, Trash2, Copy, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';

const LeftPanelImpl: React.FC = () => {
  const {
    slides, selectedSlideId, multiSelectedIds,
    selectSlide, toggleMultiSelect, clearMultiSelect,
    addSlide, deleteSlide, deleteSelected, duplicateSlide, reorderSlides,
  } = useEditorStore();

  const hasMulti = multiSelectedIds.length > 0;

  // ── 드래그 순서 변경 상태 ────────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const listRef   = useRef<HTMLDivElement>(null);
  const itemRefs  = useRef<(HTMLDivElement | null)[]>([]);

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIndex(index);
    setOverIndex(index);
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragIndex === null || !listRef.current) return;
    const y = e.clientY;
    let nearest = dragIndex;
    let minDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(y - center);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    setOverIndex(nearest);
  };

  const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      reorderSlides(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

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

        <div ref={listRef} className="space-y-2">
          {slides.map((slide, index) => {
            const isSelected   = slide.slide_id === selectedSlideId;
            const isMulti      = multiSelectedIds.includes(slide.slide_id);
            const hasError     = slide.content.headline.replace(/\n/g, '').length > slide.constraints.max_headline_length;
            const isDragging   = dragIndex === index;
            const isOver       = overIndex === index && dragIndex !== null && dragIndex !== index;

            return (
              <div
                key={slide.slide_id}
                ref={el => { itemRefs.current[index] = el; }}
                className={clsx(
                  'relative group/item transition-all',
                  isDragging && 'opacity-40',
                  isOver && 'ring-2 ring-blue-400 ring-offset-1 rounded-lg',
                )}
              >
                {/* 다중선택 체크박스 */}
                <div
                  className={clsx(
                    'absolute left-7 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
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

                {/* 드래그 핸들 */}
                <div
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1 cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover/item:opacity-100 transition-opacity"
                  onPointerDown={(e) => handleDragStart(e, index)}
                  onPointerMove={handleDragMove}
                  onPointerUp={handleDragEnd}
                  onPointerCancel={handleDragEnd}
                  title="드래그해서 순서 변경"
                >
                  <GripVertical size={13} className="text-gray-400" />
                </div>

                <button
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      toggleMultiSelect(slide.slide_id);
                    } else {
                      selectSlide(slide.slide_id);
                    }
                  }}
                  className={clsx(
                    'w-full text-left p-3 pl-10 pr-16 rounded-lg border text-sm transition-all',
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

                {/* 액션 버튼들 — hover 시 표시 (다중선택 아닐 때) */}
                {!isMulti && (
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    {/* 복제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSlide(slide.slide_id);
                      }}
                      title="슬라이드 복제"
                      className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Copy size={12} />
                    </button>
                    {/* 삭제 버튼 */}
                    {slides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(slide.slide_id);
                        }}
                        title="슬라이드 삭제"
                        className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
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

        <p className="mt-3 text-center text-[10px] text-gray-400">
          ≡ 드래그로 순서 변경 · Ctrl+클릭으로 다중 선택
        </p>
      </div>
    </aside>
  );
};

// 패널 리사이즈 드래그 중 부모(App)가 재렌더링되어도 불필요하게 다시 그려지지 않도록 memo 처리
export const LeftPanel = React.memo(LeftPanelImpl);
