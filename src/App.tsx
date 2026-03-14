import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { ManuscriptPanel } from './components/ManuscriptPanel';
import { LeftPanel } from './components/LeftPanel';
import { CenterPanel } from './components/CenterPanel';
import { RightPanel } from './components/RightPanel';
import { useEditorStore } from './store';
import { FileText, LayoutGrid, Eye, Palette } from 'lucide-react';
import { clsx } from 'clsx';

// ── AdSense 타입 ────────────────────────────────────────────────────────
declare global { interface Window { adsbygoogle: unknown[] } }

// ── 하단 배너 광고 (데스크톱 전용) ─────────────────────────────────────
const BottomAdBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  React.useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  }, []);
  if (dismissed) return null;
  return (
    <div
      className="hidden md:flex relative items-center justify-center bg-gray-100 border-t border-gray-200 shrink-0"
      style={{ height: 90 }}
    >
      {/* 카드쑉 하단배너 */}
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '728px', height: '90px' }}
        data-ad-client="ca-pub-1837033482526110"
        data-ad-slot="9160718146"
      />
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1.5 right-2 text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors"
      >
        ✕
      </button>
    </div>
  );
};

// ── 드래그 가능한 리사이즈 구분선 (데스크톱 전용) ──────────────────────
interface ResizeDividerProps { onDragDelta: (delta: number) => void; }

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
      <div className="absolute inset-y-0 -left-1 -right-1" />
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

// ── 모바일 탭 ──────────────────────────────────────────────────────────
type MobileTab = 'manuscript' | 'slides' | 'preview' | 'design';

const MOBILE_TABS: { id: MobileTab; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { id: 'manuscript', label: '원고',    Icon: FileText    },
  { id: 'slides',    label: '슬라이드', Icon: LayoutGrid  },
  { id: 'preview',   label: '미리보기', Icon: Eye         },
  { id: 'design',    label: '디자인',   Icon: Palette     },
];

const MobileTabBar: React.FC<{ active: MobileTab; onChange: (t: MobileTab) => void }> = ({ active, onChange }) => (
  <nav className="flex md:hidden border-t border-gray-200 bg-white shrink-0 safe-area-bottom" style={{ height: 56 }}>
    {MOBILE_TABS.map(({ id, label, Icon }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={clsx(
          'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
          active === id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
        )}
      >
        <Icon size={20} strokeWidth={active === id ? 2.5 : 1.5} />
        <span className={clsx('text-[10px] font-semibold', active === id ? 'text-blue-600' : 'text-gray-400')}>
          {label}
        </span>
      </button>
    ))}
  </nav>
);

// ── 모바일 감지 훅 ─────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ── App ────────────────────────────────────────────────────────────────
function App() {
  const { project } = useEditorStore();
  const [widths, setWidths] = useState(DEFAULT_WIDTHS);
  const [activeTab, setActiveTab] = useState<MobileTab>('preview');
  const isMobile = useIsMobile();

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

      {/* ── 모바일 레이아웃 ─────────────────────────────────────── */}
      {isMobile ? (
        <>
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            {activeTab === 'manuscript' && <ManuscriptPanel />}
            {activeTab === 'slides'    && <LeftPanel />}
            {activeTab === 'preview'   && <CenterPanel />}
            {activeTab === 'design'    && <RightPanel />}
          </div>
          <MobileTabBar active={activeTab} onChange={setActiveTab} />
        </>
      ) : (
        /* ── 데스크톱 레이아웃 ───────────────────────────────────── */
        <>
          <div className="flex-1 flex overflow-hidden min-h-0">
            <div style={{ width: widths.manuscript, flexShrink: 0 }} className="flex flex-col overflow-hidden">
              <ManuscriptPanel />
            </div>
            <ResizeDivider onDragDelta={(d) => handleDrag('manuscript', d)} />
            <div style={{ width: widths.left, flexShrink: 0 }} className="flex flex-col overflow-hidden">
              <LeftPanel />
            </div>
            <ResizeDivider onDragDelta={(d) => handleDrag('left', d)} />
            <CenterPanel />
            <ResizeDivider onDragDelta={(d) => handleDrag('right', -d)} />
            <div style={{ width: widths.right, flexShrink: 0 }} className="flex flex-col overflow-hidden">
              <RightPanel />
            </div>
          </div>
          <BottomAdBanner />
        </>
      )}
    </div>
  );
}

export default App;
