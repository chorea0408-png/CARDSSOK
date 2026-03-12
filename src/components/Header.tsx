import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store';
import { Download, Sparkles, ChevronDown, FileJson, Image, FileImage } from 'lucide-react';
import { SlideRatio, SLIDE_SIZE_PRESETS } from '../types';
import { clsx } from 'clsx';
import { ExportAdModal } from './ExportAdModal';

// w/h는 버튼 아이콘 표시용 크기 (실제 비율 반영)
const RATIO_BUTTONS: { ratio: SlideRatio; iconW: number; iconH: number }[] = [
  { ratio: '1:1',  iconW: 13, iconH: 13 },
  { ratio: '4:5',  iconW: 11, iconH: 14 },
  { ratio: '9:16', iconW: 8,  iconH: 14 },
];

export const Header: React.FC = () => {
  const { project, selectedSlideId, exportJSON, exportPNG, exportAllJPG, slideRatio, setSlideRatio } = useEditorStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 광고 모달 상태
  const [adModal, setAdModal] = useState<{ open: boolean; type: 'png' | 'jpg' | null; label: string }>({
    open: false, type: null, label: '',
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 실제 export 실행 (광고 모달 확인 후 호출)
  const runExport = async (type: 'json' | 'png' | 'jpg') => {
    if (type === 'json') { exportJSON(); return; }
    setIsExporting(true);
    try {
      if (type === 'png') await exportPNG(selectedSlideId);
      if (type === 'jpg') await exportAllJPG();
    } finally {
      setIsExporting(false);
    }
  };

  // export 버튼 클릭 시 → JSON은 바로, 이미지는 광고 모달 먼저
  const handleExport = (type: 'json' | 'png' | 'jpg') => {
    setDropdownOpen(false);
    if (type === 'json') { runExport('json'); return; }
    const label = type === 'png' ? 'PNG 다운로드' : 'JPG 일괄 다운로드';
    setAdModal({ open: true, type, label });
  };

  return (
    <>
    {/* 소프트 인터스티셜 광고 모달 */}
    {adModal.open && adModal.type && (
      <ExportAdModal
        exportLabel={adModal.label}
        onConfirm={() => runExport(adModal.type!)}
        onClose={() => setAdModal({ open: false, type: null, label: '' })}
      />
    )}

    <header className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between shrink-0 z-20">
      {/* 카드쑉 브랜드 */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
          <Sparkles size={15} className="text-white" />
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="font-extrabold text-gray-900"
            style={{ fontSize: '17px', letterSpacing: '-0.03em' }}
          >
            카드쑉
          </span>
          <span
            className="text-gray-400 font-medium"
            style={{ fontSize: '11px', letterSpacing: '0.01em' }}
          >
            간단하게 카드뉴스 제작하기
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* 비율 선택 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {RATIO_BUTTONS.map(({ ratio, iconW, iconH }) => (
            <button
              key={ratio}
              onClick={() => setSlideRatio(ratio)}
              title={SLIDE_SIZE_PRESETS[ratio].label}
              className={clsx(
                'flex flex-col items-center justify-center px-2.5 py-1 rounded-md text-xs font-semibold transition-all gap-1',
                slideRatio === ratio
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {/* 실제 비율을 반영한 미니 사각형 아이콘 */}
              <span
                style={{ width: iconW, height: iconH, display: 'inline-block' }}
                className={clsx(
                  'rounded-[1px] border-[1.5px]',
                  slideRatio === ratio ? 'border-blue-600' : 'border-gray-400'
                )}
              />
              <span className="leading-none">{ratio}</span>
            </button>
          ))}
        </div>

        <div className="relative" ref={dropdownRef}>
          <div className="flex rounded shadow-sm overflow-hidden">
            <button
              onClick={() => handleExport('png')}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              <Download size={16} />
              {isExporting ? '내보내는 중…' : '내보내기'}
            </button>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              disabled={isExporting}
              className="px-2 py-1.5 text-white bg-blue-600 hover:bg-blue-700 border-l border-blue-500 transition-colors disabled:opacity-60"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">현재 슬라이드</p>
              <button
                onClick={() => handleExport('png')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Image size={15} className="text-green-500" />
                <div className="text-left">
                  <div className="font-medium">PNG로 내보내기</div>
                  <div className="text-[11px] text-gray-400">현재 슬라이드 1장 (고화질)</div>
                </div>
              </button>

              <div className="border-t border-gray-100 my-1" />
              <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">전체 슬라이드</p>
              <button
                onClick={() => handleExport('jpg')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileImage size={15} className="text-orange-500" />
                <div className="text-left">
                  <div className="font-medium">JPG로 일괄 내보내기</div>
                  <div className="text-[11px] text-gray-400">슬라이드별 JPG 파일 다운로드</div>
                </div>
              </button>

              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileJson size={15} className="text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">JSON으로 내보내기</div>
                  <div className="text-[11px] text-gray-400">AI 툴 연동 / 재편집용 데이터</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
};
