import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface Props {
  exportLabel: string;   // "PNG 내보내기" 등 버튼에 표시될 텍스트
  onConfirm: () => void; // 닫기/다운로드 버튼 클릭 시 실행할 export 함수
  onClose: () => void;   // 그냥 닫기 (X 버튼 or 오버레이 클릭)
}

declare global { interface Window { adsbygoogle: unknown[] } }

export const ExportAdModal: React.FC<Props> = ({ exportLabel, onConfirm, onClose }) => {
  // ESC 키로도 닫기 가능
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // 애드센스 광고 초기화
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 반투명 오버레이 — 클릭해도 닫힘 (소프트) */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* 모달 카드 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[360px] overflow-hidden animate-fade-in">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
          <span className="text-[11px] text-gray-400 font-medium">
            광고 수익으로 카드쑉 무료 서비스가 운영됩니다 🙏
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            title="닫기"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>

        {/* 팝업 광고 영역 (300×250 Rectangle) */}
        <div className="flex items-center justify-center bg-gray-50 py-6">
          {/* 카드쑉 팝업 */}
          <ins
            className="adsbygoogle"
            style={{ display: 'inline-block', width: '300px', height: '250px' }}
            data-ad-client="ca-pub-1837033482526110"
            data-ad-slot="1729309473"
          />
        </div>

        {/* 하단 액션 */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            그냥 닫기
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Download size={14} />
            {exportLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
