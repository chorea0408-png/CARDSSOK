import React, { useCallback, useRef, useState } from 'react';
import { Header } from './components/Header';
import { ManuscriptPanel } from './components/ManuscriptPanel';
import { LeftPanel } from './components/LeftPanel';
import { CenterPanel } from './components/CenterPanel';
import { RightPanel } from './components/RightPanel';
import { useEditorStore } from './store';

// ── 하단 배너 광고 ────────────────────────────────────────────────────
declare global { interface Window { adsbygoogle: unknown[] } }

const BottomAdBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  React.useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  }, []);
  if (dismissed) return null;
  return (
    <div className="relative flex items-center justify-center bg-gray-100 border-t border-gray-200 shrink-0" style={{ height: 90 }}>
      {/* 카드쑉 하단배너 */}
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '728px', height: '90px' }}
        data-ad-client="ca-pub-1837033482526110"
        data-ad-slot="9160718146"
      />

      {/* 닫기 버튼 */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1.5 right-2 text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors"
      >
        ✕
      </button>
    </div>
  );
};

// ── 드래그 가능한 리사이즈 구분선 ──────────────────────────────────────
interface ResizeDividerProps {
  onDragDelta: (delta: number) => void;
}

const ResizeDivider: React.FC<ResizeDividerProps> = ({ onDragDelta }) => {
  const dragStart = useRef<{ x: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const delta = e.clientX - dragStart.current.x;
    dragStart.current = { x: e.clientX };
    onDragDelta(delta);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStart.current = null;
  };

  return (
    <div
      className="group relative w-1 flex-shrink-0 bg-gray-200 hover:bg-blue-400 transition-colors cursor-col-resize select-none z-10"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* 드래그 영역을 좌우로 넓혀 클릭하기 쉽게 */}
      <div className="absolute inset-y-0 -left-1 -right-1" />
      {/* 핸들 아이콘 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="flex flex-col gap-0.5">
          <div className="w-0.5 h-3 bg-blue-600 rounded" />
          <div className="w-0.5 h-3 bg-blue-600 rounded" />
        </div>
      </div>
    </div>
  );
};

// ── 패널 너비 기본값 / 최소값 ──────────────────────────────────────────
const DEFAULT_WIDTHS = { manuscript: 280, left: 240, right: 320 };
const MIN_WIDTHS     = { manuscript: 160, left: 160, right: 200 };
const MAX_WIDTHS     = { manuscript: 500, left: 400, right: 500 };

function App() {
  const { project } = useEditorStore();
  const [widths, setWidths] = useState(DEFAULT_WIDTHS);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const handleDrag = useCallback((panel: keyof typeof DEFAULT_WIDTHS, delta: number) => {
    setWidths(prev => ({
      ...prev,
      [panel]: clamp(prev[panel] + delta, MIN_WIDTHS[panel], MAX_WIDTHS[panel]),
    }));
  }, []);

  if (!project) return <div>Loading...</div>;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100 text-gray-900 font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 원고 입력창 */}
        <div style={{ width: widths.manuscript, flexShrink: 0 }} className="flex flex-col overflow-hidden">
          <ManuscriptPanel />
        </div>

        <ResizeDivider onDragDelta={(d) => handleDrag('manuscript', d)} />

        {/* SLIDE LIST */}
        <div style={{ width: widths.left, flexShrink: 0 }} className="flex flex-col overflow-hidden">
          <LeftPanel />
        </div>

        <ResizeDivider onDragDelta={(d) => handleDrag('left', d)} />

        {/* 편집창 (가운데, 남은 공간 전부 차지) */}
        <CenterPanel />

        <ResizeDivider onDragDelta={(d) => handleDrag('right', -d)} />

        {/* 우측 옵션 패널 */}
        <div style={{ width: widths.right, flexShrink: 0 }} className="flex flex-col overflow-hidden">
          <RightPanel />
        </div>
      </div>

      {/* 하단 배너 광고 */}
      <BottomAdBanner />
    </div>
  );
}

export default App;
