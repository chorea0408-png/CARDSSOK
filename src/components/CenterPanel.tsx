import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { FontProfile, GridPosition, SLIDE_SIZE_PRESETS, WatermarkPosition } from '../types';

const FONT_FAMILY: Record<FontProfile, string> = {
  bold_modern: '"Noto Sans KR", sans-serif',
  classic_editorial: '"Nanum Myeongjo", serif',
  clean_sans: '"Noto Sans KR", sans-serif',
  soft_rounded: '"Nanum Gothic", sans-serif',
};

const FONT_WEIGHT: Record<FontProfile, string> = {
  bold_modern: '900',
  classic_editorial: '700',
  clean_sans: '700',
  soft_rounded: '700',
};

const getPositionClasses = (pos: GridPosition): string => {
  const V = pos.startsWith('T') ? 'justify-start' : pos.startsWith('B') ? 'justify-end' : 'justify-center';
  const H = pos.endsWith('L') ? 'items-start' : pos.endsWith('R') ? 'items-end' : 'items-center';
  return `${V} ${H}`;
};

const WATERMARK_POS: Record<WatermarkPosition, string> = {
  TL: 'top-2 left-[8%] text-left',
  TC: 'top-2 left-0 right-0 text-center',
  TR: 'top-2 right-[8%] text-right',
  BL: 'bottom-2 left-[8%] text-left',
  BC: 'bottom-2 left-0 right-0 text-center',
  BR: 'bottom-2 right-[8%] text-right',
};

export const CenterPanel: React.FC = () => {
  const { slides, selectedSlideId, selectSlide, updateSlideDesign, slideRatio } = useEditorStore();
  const sizePreset = SLIDE_SIZE_PRESETS[slideRatio];
  const currentIndex = slides.findIndex(s => s.slide_id === selectedSlideId);
  const slide = slides[currentIndex];
  const [textBlockSelected, setTextBlockSelected] = useState(false);
  const [localWidthPct, setLocalWidthPct] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ handle: 'left' | 'right'; startX: number; startWidth: number; } | null>(null);

  useEffect(() => {
    setTextBlockSelected(false);
    setLocalWidthPct(null);
    dragRef.current = null;
  }, [selectedSlideId]);

  if (!slide) return <main className="flex-1 bg-gray-200" />;

  const goPrev = () => { if (currentIndex > 0) selectSlide(slides[currentIndex - 1].slide_id); };
  const goNext = () => { if (currentIndex < slides.length - 1) selectSlide(slides[currentIndex + 1].slide_id); };

  const {
    theme, font_profile, font_sizes, text_colors, text_shadow,
    text_block_width_pct, overlay_strength, background_color, background_color_2,
    background_image, watermark, logo_image
  } = slide.design;

  const effectiveW = localWidthPct ?? (text_block_width_pct ?? 84);
  const highlightAlign = slide.layout.text_align === 'center' ? 'self-center'
    : slide.layout.text_align === 'right' ? 'self-end' : 'self-start';

  // 동적 색상 지원: background_color(색1), background_color_2(색2) 로 각 테마 색상 커스터마이즈
  const getThemeStyle = (): React.CSSProperties => {
    if (background_image) return {};
    const c1 = background_color;
    const c2 = background_color_2;
    switch (theme) {
      case 'aurora':
        return {
          background: `radial-gradient(circle at 0% 0%, ${c1 ?? '#3b82f6'} 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${c2 ?? '#a855f7'} 0%, transparent 50%), #0f172a`
        };
      case 'gradient_blue':
        return { background: `linear-gradient(to bottom right, ${c1 ?? '#1e3a8a'}, ${c2 ?? '#4c1d95'})` };
      case 'gradient_peach':
        return { background: `linear-gradient(to top right, ${c1 ?? '#fb7185'}, ${c2 ?? '#6366f1'})` };
      case 'dark_glass':
        return { backgroundColor: c1 ?? '#000000' };
      default: // solid
        return { backgroundColor: c1 ?? '#1e293b' };
    }
  };

  // 글자 그림자: 4방향 outline + 소프트 글로우 → 어두운 배경 / 배경이미지 모두에서 선명하게 보임
  const safeTextShadow = text_shadow
    ? '-1px -1px 0 rgba(0,0,0,0.75), 1px -1px 0 rgba(0,0,0,0.75), -1px 1px 0 rgba(0,0,0,0.75), 1px 1px 0 rgba(0,0,0,0.75), 0 2px 8px rgba(0,0,0,0.9)'
    : undefined;

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>, handle: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { handle, startX: e.clientX, startWidth: text_block_width_pct ?? 84 };
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !canvasRef.current) return;
    const deltaPct = ((e.clientX - dragRef.current.startX) / (canvasRef.current.offsetWidth * 0.84)) * 100;
    const newW = Math.min(100, Math.max(20,
      dragRef.current.handle === 'right'
        ? dragRef.current.startWidth + deltaPct
        : dragRef.current.startWidth - deltaPct
    ));
    setLocalWidthPct(newW);
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current && canvasRef.current) {
      updateSlideDesign(slide.slide_id, { text_block_width_pct: localWidthPct || 84 });
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setLocalWidthPct(null);
  };

  return (
    <main className="flex-1 bg-gray-200 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* shadow-2xl을 캡처 대상 밖 wrapper에 적용 — 캡처 시 oklch 색상 충돌 방지 */}
      <div className="shadow-2xl shrink-0">
        <div
          ref={canvasRef}
          id={`slide-canvas-${slide.slide_id}`}
          className="relative overflow-hidden select-none"
          style={{
            width: `${sizePreset.displayW}px`,
            height: `${sizePreset.displayH}px`,
            fontFamily: FONT_FAMILY[font_profile],
            ...getThemeStyle()
          }}
          onClick={() => setTextBlockSelected(false)}
        >
          {background_image && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${background_image})` }}
            />
          )}
          {/* bg-black 대신 명시적 rgb 값 — Tailwind v4 oklch 변수 캡처 오류 방지 */}
          <div className="absolute inset-0" style={{ backgroundColor: 'rgb(0,0,0)', opacity: overlay_strength }} />

        <div className={clsx(
          'absolute inset-0 p-[8%] flex flex-col z-10',
          getPositionClasses(slide.layout.grid_position),
          slide.layout.text_align === 'left' ? 'text-left'
            : slide.layout.text_align === 'right' ? 'text-right' : 'text-center'
        )}>
          <div
            className="relative flex flex-col gap-3"
            style={{ width: `${effectiveW}%` }}
            onClick={(e) => { e.stopPropagation(); setTextBlockSelected(true); }}
          >
            {slide.content.highlight && (
              <span
                className={clsx("inline-block px-3 py-1 font-bold rounded-sm break-words", highlightAlign)}
                style={{
                  fontSize: `${font_sizes.highlight}px`,
                  color: text_colors.highlight_text,
                  backgroundColor: text_colors.highlight_bg,
                  boxShadow: safeTextShadow,
                }}
              >
                {slide.content.highlight}
              </span>
            )}
            {slide.content.headline && (
              <h2
                className="leading-tight break-keep whitespace-pre-wrap"
                style={{
                  fontWeight: FONT_WEIGHT[font_profile],
                  fontSize: `${font_sizes.headline}px`,
                  color: text_colors.headline,
                  textShadow: safeTextShadow,
                }}
              >
                {slide.content.headline}
              </h2>
            )}
            {slide.content.body && slide.layout.visual_priority !== 'VISUAL_FIRST' && (
              <p
                className={clsx(
                  "break-keep whitespace-pre-wrap",
                  slide.layout.text_density === 'LIGHT' ? 'leading-relaxed'
                    : slide.layout.text_density === 'HEAVY' ? 'leading-snug' : 'leading-normal'
                )}
                style={{
                  fontSize: `${font_sizes.body}px`,
                  color: text_colors.body,
                  textShadow: safeTextShadow,
                }}
              >
                {slide.content.body}
              </p>
            )}

            {textBlockSelected && (
              <>
                <div className="absolute -inset-2 border-2 border-blue-400 rounded pointer-events-none z-30" />
                <div
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-8 bg-white border-2 border-blue-500 rounded-sm z-30 cursor-ew-resize touch-none"
                  onPointerDown={(e) => onHandlePointerDown(e, 'left')}
                  onPointerMove={onHandlePointerMove}
                  onPointerUp={onHandlePointerUp}
                />
                <div
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-8 bg-white border-2 border-blue-500 rounded-sm z-30 cursor-ew-resize touch-none"
                  onPointerDown={(e) => onHandlePointerDown(e, 'right')}
                  onPointerMove={onHandlePointerMove}
                  onPointerUp={onHandlePointerUp}
                />
              </>
            )}
          </div>
        </div>

        {logo_image && (
          <img
            src={logo_image}
            alt="로고"
            className="absolute bottom-4 right-4 h-8 object-contain z-20 opacity-90"
          />
        )}

        {watermark?.text && (
          <div
            className={clsx(
              'absolute text-white text-[9px] tracking-widest pointer-events-none z-20 px-1',
              WATERMARK_POS[watermark.position]
            )}
            style={{ opacity: watermark.opacity, textShadow: safeTextShadow }}
          >
            {watermark.text}
          </div>
        )}
        </div>{/* ← canvas div 닫기 */}
      </div>{/* ← shadow wrapper 닫기 */}

      {/* 내보내기 크기 안내 */}
      <p className="mt-2 text-[11px] text-gray-400 font-medium tracking-wide">
        출력 해상도: {sizePreset.exportW} × {sizePreset.exportH}px
      </p>

      <div className="mt-3 flex items-center gap-6 bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium text-gray-700">
        <button onClick={goPrev} disabled={currentIndex === 0} className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30">
          <ChevronLeft size={20} />
        </button>
        <span className="w-16 text-center">{currentIndex + 1} / {slides.length}</span>
        <button onClick={goNext} disabled={currentIndex === slides.length - 1} className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>
    </main>
  );
};
