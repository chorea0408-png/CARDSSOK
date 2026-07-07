import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { ManuscriptPanel } from './components/ManuscriptPanel';
import { LeftPanel } from './components/LeftPanel';
import { CenterPanel } from './components/CenterPanel';
import { RightPanel } from './components/RightPanel';
import { ToastProvider } from './components/Toast';
import { useEditorStore } from './store';
import { FileText, LayoutGrid, Eye, Palette, Sparkles, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

// ── AdSense 타입 ────────────────────────────────────────────────────────
declare global { interface Window { adsbygoogle: unknown[] } }

// ── 하단 배너 광고 (데스크톱 전용) ─────────────────────────────────────
const BottomAdBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const adPushed = useRef(false);
  React.useEffect(() => {
    if (adPushed.current) return;
    adPushed.current = true;
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
const PANEL_WIDTHS_KEY = 'cardssok-panel-widths';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// 새로고침 후에도 리사이즈한 패널 너비를 유지 (Phase 3)
const loadStoredWidths = (): typeof DEFAULT_WIDTHS => {
  try {
    const raw = localStorage.getItem(PANEL_WIDTHS_KEY);
    if (!raw) return DEFAULT_WIDTHS;
    const parsed = JSON.parse(raw);
    return {
      manuscript: clamp(Number(parsed.manuscript) || DEFAULT_WIDTHS.manuscript, MIN_WIDTHS.manuscript, MAX_WIDTHS.manuscript),
      left:       clamp(Number(parsed.left)       || DEFAULT_WIDTHS.left,       MIN_WIDTHS.left,       MAX_WIDTHS.left),
      right:      clamp(Number(parsed.right)      || DEFAULT_WIDTHS.right,      MIN_WIDTHS.right,      MAX_WIDTHS.right),
    };
  } catch {
    return DEFAULT_WIDTHS;
  }
};

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

// ── Empty State 온보딩 화면 ────────────────────────────────────────────
const EmptyState: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
    <div className="max-w-sm w-full text-center">
      {/* 로고 */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mx-auto mb-5">
        <Sparkles size={28} className="text-white" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: '-0.03em' }}>
        카드쑉에 오신 걸 환영해요!
      </h1>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">
        원고 텍스트를 입력하면<br />
        카드뉴스 슬라이드가 자동으로 만들어져요.
      </p>

      {/* 사용법 3단계 */}
      <div className="space-y-3 mb-8 text-left">
        {[
          { step: '1', title: '원고 입력', desc: '왼쪽 원고 창에 텍스트를 붙여넣거나 직접 입력하세요.' },
          { step: '2', title: '자동 분리', desc: '엔터 두 번으로 슬라이드가 나뉘어요. 첫 줄은 제목, 나머지는 본문.' },
          { step: '3', title: '디자인 & 내보내기', desc: '오른쪽에서 색상·폰트를 고르고 PNG/JPG로 저장하세요.' },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">{title}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm"
      >
        원고 입력 시작하기
        <ArrowRight size={16} />
      </button>
      <p className="mt-3 text-[11px] text-gray-400">AI(ChatGPT/Claude)로 원고를 먼저 만들어도 좋아요</p>
    </div>
  </div>
);

// ── 모바일 감지 훅 (디바운싱 적용 — Phase 3) ──────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIsMobile(window.innerWidth < 768), 100);
    };
    window.addEventListener('resize', handler);
    return () => { window.removeEventListener('resize', handler); clearTimeout(timer); };
  }, []);
  return isMobile;
}

// ── App ────────────────────────────────────────────────────────────────
function App() {
  const { project, isDirty, undo, redo, deleteSelected, appMode, setAppMode } = useEditorStore();
  const [widths, setWidths] = useState(loadStoredWidths);
  // Phase 2: 모바일 기본 탭을 'manuscript'로 변경 (첫 화면이 빈 preview 대신 원고 입력창)
  const [activeTab, setActiveTab] = useState<MobileTab>('manuscript');
  const isMobile = useIsMobile();

  const handleDrag = useCallback((panel: keyof typeof DEFAULT_WIDTHS, delta: number) => {
    setWidths(prev => ({
      ...prev,
      [panel]: clamp(prev[panel] + delta, MIN_WIDTHS[panel], MAX_WIDTHS[panel]),
    }));
  }, []);

  useEffect(() => {
    try { localStorage.setItem(PANEL_WIDTHS_KEY, JSON.stringify(widths)); } catch { /* 저장 실패는 무시 (기본값으로 계속 동작) */ }
  }, [widths]);

  // ── 키보드 단축키 (Undo/Redo/Delete) ──────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      // 텍스트 입력 중에는 단축키 비활성화
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return;

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, deleteSelected]);

  // ── B-01: 탭 닫을 때 작업 손실 경고 ──────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      // 표준: returnValue 설정 (Chrome 등 대부분의 브라우저에서 기본 메시지 표시)
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (!project) return <div>Loading...</div>;

  // ── Empty State: 처음 진입 시 (appMode === 'input') ────────────────
  const showEmptyState = appMode === 'input';

  return (
    <ToastProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100 text-gray-900 font-sans">
        <Header />

        {showEmptyState ? (
          /* ── Empty State ─────────────────────────────────────────── */
          <EmptyState onStart={() => {
            setAppMode('editor');
            if (isMobile) setActiveTab('manuscript');
          }} />
        ) : isMobile ? (
          /* ── 모바일 레이아웃 ─────────────────────────────────────── */
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
    </ToastProvider>
  );
}

export default App;
