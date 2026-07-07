import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store';
import { Download, Sparkles, ChevronDown, FileJson, Image, FileImage, FolderArchive } from 'lucide-react';
import { ExportQuality, SlideRatio, SLIDE_SIZE_PRESETS } from '../types';
import { clsx } from 'clsx';
import { ExportAdModal } from './ExportAdModal';
import { useToast } from './Toast';

const RATIO_BUTTONS: { ratio: SlideRatio; iconW: number; iconH: number }[] = [
  { ratio: '1:1',  iconW: 13, iconH: 13 },
  { ratio: '4:5',  iconW: 11, iconH: 14 },
  { ratio: '9:16', iconW: 8,  iconH: 14 },
];

const QUALITY_OPTIONS: { value: ExportQuality; label: string; desc: string }[] = [
  { value: '1x', label: '1x',  desc: '빠른 미리보기' },
  { value: '2x', label: '2x ★', desc: '권장 고화질'   },
  { value: '3x', label: '3x',  desc: '최고화질'       },
];

export const Header: React.FC = () => {
  const {
    project, selectedSlideId,
    exportJSON, exportPNG, exportAllJPG, exportAllZIP,
    slideRatio, setSlideRatio,
    exportQuality, setExportQuality,
    slides,
  } = useEditorStore();
  const { showToast, updateToast } = useToast();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [adModal, setAdModal] = useState<{
    open: boolean;
    type: 'png' | 'jpg' | 'zip' | null;
    label: string;
  }>({ open: false, type: null, label: '' });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const runExport = async (type: 'json' | 'png' | 'jpg' | 'zip') => {
    if (type === 'json') {
      exportJSON();
      showToast('success', 'JSON 저장 완료!');
      return;
    }

    setIsExporting(true);
    const count = slides.length;
    const loadingMessages: Record<string, string> = {
      png: '현재 슬라이드 캡처 중…',
      jpg: `슬라이드 ${count}장 변환 중…`,
      zip: `슬라이드 ${count}장 ZIP 압축 중…`,
    };
    const toastId = showToast('loading', loadingMessages[type]);

    try {
      if (type === 'png') {
        await exportPNG(selectedSlideId);
        updateToast(toastId, 'success', 'PNG 저장 완료! ✓');
      } else if (type === 'jpg') {
        await exportAllJPG();
        updateToast(toastId, 'success', `JPG ${count}장 저장 완료! ✓`);
      } else if (type === 'zip') {
        await exportAllZIP();
        updateToast(toastId, 'success', `ZIP 파일 저장 완료! ✓`);
      }
    } catch (e) {
      updateToast(toastId, 'error', '내보내기 실패. 다시 시도해 주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = (type: 'json' | 'png' | 'jpg' | 'zip') => {
    setDropdownOpen(false);
    if (type === 'json') { runExport('json'); return; }
    const labelMap: Record<string, string> = {
      png: 'PNG 다운로드',
      jpg: 'JPG 일괄 다운로드',
      zip: 'ZIP 일괄 다운로드',
    };
    setAdModal({ open: true, type: type as 'png' | 'jpg' | 'zip', label: labelMap[type] });
  };

  const preset = SLIDE_SIZE_PRESETS[slideRatio];

  return (
    <>
      {adModal.open && adModal.type && (
        <ExportAdModal
          exportLabel={adModal.label}
          onConfirm={() => runExport(adModal.type!)}
          onClose={() => setAdModal({ open: false, type: null, label: '' })}
        />
      )}

      <header className="h-14 border-b border-gray-200 bg-white px-3 md:px-4 flex items-center justify-between shrink-0 z-20">
        {/* 브랜드 */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-gray-900" style={{ fontSize: '17px', letterSpacing: '-0.03em' }}>
              카드쑉
            </span>
            <span className="hidden md:inline text-gray-400 font-medium" style={{ fontSize: '11px' }}>
              간단하게 카드뉴스 제작하기
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* 비율 선택 */}
          <div className="flex items-center gap-0.5 md:gap-1 bg-gray-100 rounded-lg p-1">
            {RATIO_BUTTONS.map(({ ratio, iconW, iconH }) => (
              <button
                key={ratio}
                onClick={() => setSlideRatio(ratio)}
                title={SLIDE_SIZE_PRESETS[ratio].label}
                className={clsx(
                  'flex flex-col items-center justify-center px-2 md:px-2.5 py-1 rounded-md text-xs font-semibold transition-all gap-1',
                  slideRatio === ratio
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
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

          {/* 화질 선택 */}
          <div className="hidden md:flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
            {QUALITY_OPTIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setExportQuality(value)}
                title={`${desc} (${preset.exportW}×${preset.exportH}${value === '3x' ? ' ×1.5' : ''})`}
                className={clsx(
                  'px-2 py-1 rounded-md text-xs font-semibold transition-all',
                  exportQuality === value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 내보내기 버튼 + 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex rounded shadow-sm overflow-hidden">
              <button
                onClick={() => handleExport('png')}
                disabled={isExporting}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                <Download size={15} />
                <span className="hidden sm:inline">
                  {isExporting ? '내보내는 중…' : '내보내기'}
                </span>
                <span className="sm:hidden">{isExporting ? '…' : '저장'}</span>
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
              <div className="absolute right-0 top-full mt-1 w-60 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {/* 화질 선택 (모바일용 — 데스크톱엔 헤더에 있음) */}
                <div className="md:hidden px-3 py-2 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">화질</p>
                  <div className="flex gap-1">
                    {QUALITY_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setExportQuality(value)}
                        className={clsx(
                          'flex-1 py-1 text-xs font-semibold rounded border transition-all',
                          exportQuality === value
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">현재 슬라이드</p>
                <button
                  onClick={() => handleExport('png')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Image size={15} className="text-green-500" />
                  <div className="text-left">
                    <div className="font-medium">PNG로 내보내기</div>
                    <div className="text-[11px] text-gray-400">현재 슬라이드 1장</div>
                  </div>
                </button>

                <div className="border-t border-gray-100 my-1" />
                <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">전체 슬라이드</p>

                <button
                  onClick={() => handleExport('zip')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FolderArchive size={15} className="text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">ZIP으로 일괄 내보내기 ★</div>
                    <div className="text-[11px] text-gray-400">JPG 전체를 ZIP 1파일로</div>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('jpg')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileImage size={15} className="text-orange-500" />
                  <div className="text-left">
                    <div className="font-medium">JPG로 낱장 내보내기</div>
                    <div className="text-[11px] text-gray-400">슬라이드별 JPG 개별 다운로드</div>
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
