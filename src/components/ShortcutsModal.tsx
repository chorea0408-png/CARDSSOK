import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['⌘', 'Z'],       label: '실행 취소' },
  { keys: ['⌘', '⇧', 'Z'],  label: '다시 실행' },
  { keys: ['N'],            label: '슬라이드 추가' },
  { keys: ['⌘', 'D'],       label: '슬라이드 복제' },
  { keys: ['Delete'],       label: '선택한 슬라이드 삭제' },
];

const KeyChip: React.FC<{ children: string }> = ({ children }) => (
  <kbd className="min-w-[22px] px-1.5 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm text-center">
    {children}
  </kbd>
);

export const ShortcutsModal: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-[320px] overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">키보드 단축키</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors" title="닫기">
            <X size={14} className="text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{label}</span>
              <div className="flex items-center gap-1">
                {keys.map((k, i) => <KeyChip key={i}>{k}</KeyChip>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
