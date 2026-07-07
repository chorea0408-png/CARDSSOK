import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { clsx } from 'clsx';

// ── 타입 ──────────────────────────────────────────────────────────────
export type ToastType = 'loading' | 'success' | 'error';

interface ToastAction {
  label:   string;
  onClick: () => void;
}

interface Toast {
  id:      string;
  type:    ToastType;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast:   (type: ToastType, message: string, durationMs?: number, action?: ToastAction) => string;
  updateToast: (id: string, type: ToastType, message: string, durationMs?: number, action?: ToastAction) => void;
  removeToast: (id: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// ── 개별 토스트 아이템 ────────────────────────────────────────────────
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const icons: Record<ToastType, React.ReactNode> = {
    loading: <Loader2 size={16} className="animate-spin text-blue-400 shrink-0" />,
    success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
    error:   <XCircle   size={16} className="text-red-400   shrink-0" />,
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white',
        'animate-slide-up pointer-events-auto',
        'bg-gray-900/95 backdrop-blur border border-white/10',
        'min-w-[220px] max-w-[340px]'
      )}
    >
      {icons[toast.type]}
      <span className="flex-1 leading-snug">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => { toast.action!.onClick(); onRemove(toast.id); }}
          className="shrink-0 text-blue-300 hover:text-blue-200 font-semibold underline underline-offset-2 transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      {toast.type !== 'loading' && (
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
        >
          <X size={13} className="text-white/60" />
        </button>
      )}
    </div>
  );
};

// ── Provider ──────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const scheduleRemove = useCallback((id: string, ms: number) => {
    clearTimeout(timers.current.get(id));
    const timer = setTimeout(() => removeToast(id), ms);
    timers.current.set(id, timer);
  }, [removeToast]);

  const showToast = useCallback((type: ToastType, message: string, durationMs = 3000, action?: ToastAction): string => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev.slice(-4), { id, type, message, action }]); // 최대 5개
    if (type !== 'loading') scheduleRemove(id, durationMs);
    return id;
  }, [scheduleRemove]);

  const updateToast = useCallback((id: string, type: ToastType, message: string, durationMs = 3000, action?: ToastAction) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, type, message, action } : t));
    if (type !== 'loading') scheduleRemove(id, durationMs);
  }, [scheduleRemove]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => { timers.current.forEach(clearTimeout); };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, updateToast, removeToast }}>
      {children}
      {/* 토스트 컨테이너 — 화면 하단 중앙 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>

      {/* 슬라이드업 애니메이션 */}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </ToastContext.Provider>
  );
};
