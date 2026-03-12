import React, { useRef } from 'react';
import { useEditorStore } from '../store';
import { FontProfile, GridPosition, Slide, WatermarkPosition, ThemeType } from '../types';
import { clsx } from 'clsx';
import { ImagePlus, X } from 'lucide-react';

const GRID_POSITIONS: GridPosition[] = ['TL', 'TC', 'TR', 'ML', 'MC', 'MR', 'BL', 'BC', 'BR'];

const THEMES: { value: ThemeType; label: string; preview: string }[] = [
  { value: 'solid', label: '단색', preview: 'bg-gray-800' },
  { value: 'aurora', label: '오로라', preview: 'bg-gradient-to-tr from-blue-600 to-purple-600' },
  { value: 'gradient_blue', label: '딥 블루', preview: 'bg-gradient-to-br from-blue-900 to-indigo-800' },
  { value: 'gradient_peach', label: '피치 선셋', preview: 'bg-gradient-to-tr from-rose-400 to-indigo-400' },
  { value: 'dark_glass', label: '다크 글래스', preview: 'bg-black' },
];

const WATERMARK_POSITIONS: { pos: WatermarkPosition; icon: string; label: string }[] = [
  { pos: 'TL', icon: '↖', label: '좌상' }, { pos: 'TC', icon: '↑', label: '상중' }, { pos: 'TR', icon: '↗', label: '우상' },
  { pos: 'BL', icon: '↙', label: '좌하' }, { pos: 'BC', icon: '↓', label: '하중' }, { pos: 'BR', icon: '↘', label: '우하' },
];

const Divider: React.FC<{ label: string }> = ({ label }) => (
  <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2 mt-6">{label}</h3>
);

export const RightPanel: React.FC = () => {
  const {
    slides, selectedSlideId,
    updateSlideContent, updateSlideLayout, updateSlideGridPosition, updateSlideDesign,
    setBackgroundImage, removeBackgroundImage, setLogoImage, removeLogoImage
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const slide = slides.find(s => s.slide_id === selectedSlideId);
  if (!slide) return <aside className="w-[320px] border-l border-gray-200 bg-white" />;

  const { text_colors, theme, text_shadow, background_image, logo_image, watermark } = slide.design;

  const hc = (field: keyof Slide['content'], e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    updateSlideContent(slide.slide_id, field, e.target.value);

  const hd = (u: Partial<Slide['design']>) => updateSlideDesign(slide.slide_id, u);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isLogo: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        if (isLogo) setLogoImage(slide.slide_id, dataUrl);
        else setBackgroundImage(slide.slide_id, dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <aside className="w-[320px] border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
      <div className="p-5 space-y-2">
        <Divider label="콘텐츠 & 텍스트 설정" />

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Headline</label>
            <textarea value={slide.content.headline} onChange={(e) => hc('headline', e)} rows={2} className="w-full text-sm rounded-md border border-gray-300 p-2" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Body Text</label>
            <textarea value={slide.content.body} onChange={(e) => hc('body', e)} rows={3} className="w-full text-sm border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Highlight Badge</label>
            <input type="text" value={slide.content.highlight} onChange={(e) => hc('highlight', e)} className="w-full text-sm border border-gray-300 rounded-md p-2" />
          </div>
        </div>

        <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 mt-4 space-y-3">
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">글씨 색상</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-600 block mb-1">제목 색상</label>
              <input type="color" value={text_colors.headline} onChange={(e) => hd({ text_colors: { ...text_colors, headline: e.target.value } })} className="w-full h-6 cursor-pointer rounded border" />
            </div>
            <div>
              <label className="text-[11px] text-gray-600 block mb-1">본문 색상</label>
              <input type="color" value={text_colors.body} onChange={(e) => hd({ text_colors: { ...text_colors, body: e.target.value } })} className="w-full h-6 cursor-pointer rounded border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-600 block mb-1">뱃지 텍스트</label>
              <input type="color" value={text_colors.highlight_text} onChange={(e) => hd({ text_colors: { ...text_colors, highlight_text: e.target.value } })} className="w-full h-6 cursor-pointer rounded border" />
            </div>
            <div>
              <label className="text-[11px] text-gray-600 block mb-1">뱃지 배경</label>
              <input type="color" value={text_colors.highlight_bg} onChange={(e) => hd({ text_colors: { ...text_colors, highlight_bg: e.target.value } })} className="w-full h-6 cursor-pointer rounded border" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
            <input type="checkbox" id="shadow-toggle" checked={text_shadow} onChange={(e) => hd({ text_shadow: e.target.checked })} className="rounded text-blue-600" />
            <label htmlFor="shadow-toggle" className="text-xs text-gray-700">글씨 가독성 그림자 켜기</label>
          </div>
        </div>

        <Divider label="레이아웃" />

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">3×3 텍스트 포지션</label>
          <div className="grid grid-cols-3 gap-1 w-[120px] bg-gray-100 p-1 rounded-md border border-gray-200">
            {GRID_POSITIONS.map(pos => (
              <button
                key={pos}
                onClick={() => updateSlideGridPosition(slide.slide_id, pos)}
                className={clsx(
                  'aspect-square rounded-sm',
                  slide.layout.grid_position === pos ? 'bg-blue-500' : 'bg-white hover:bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>

        <Divider label="디자인 & 워터마크" />

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">배경 효과 (테마)</label>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map(t => (
              <button
                key={t.value}
                onClick={() => hd({ theme: t.value })}
                title={t.label}
                className={clsx(
                  "w-full aspect-square rounded-full border-2",
                  t.preview,
                  theme === t.value
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-transparent hover:scale-110 transition-transform'
                )}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* 배경 이미지 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">배경 이미지 (직접 업로드)</label>
            {background_image ? (
              <div className="relative">
                <img src={background_image} alt="bg" className="w-full h-16 object-cover rounded border" />
                <button onClick={() => removeBackgroundImage(slide.slide_id)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-400 rounded text-xs text-gray-500 hover:bg-gray-50">
                <ImagePlus size={14} /> 배경 추가
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
          </div>

          {/* 로고 이미지 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">브랜드 로고 (이미지)</label>
            {logo_image ? (
              <div className="relative">
                <img src={logo_image} alt="logo" className="w-full h-12 object-contain bg-gray-100 rounded border" />
                <button onClick={() => removeLogoImage(slide.slide_id)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button onClick={() => logoInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-400 rounded text-xs text-gray-500 hover:bg-gray-50">
                <ImagePlus size={14} /> 로고 등록
              </button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
          </div>

          {/* 워터마크 텍스트 */}
          <div className="border border-gray-200 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">워터마크 (텍스트)</label>
              <button
                onClick={() => hd({ watermark: watermark ? undefined : { text: '@출처', position: 'BC', opacity: 0.5 } })}
                className={clsx(
                  'text-[10px] px-2 py-0.5 rounded font-medium',
                  watermark ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                )}
              >
                {watermark ? '켜짐' : '추가'}
              </button>
            </div>
            {watermark && (
              <div className="space-y-2 mt-2">
                <input
                  type="text"
                  value={watermark.text}
                  onChange={(e) => hd({ watermark: { ...watermark, text: e.target.value } })}
                  placeholder="@brandname"
                  className="w-full text-xs border border-gray-300 rounded p-1.5"
                />
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">위치</label>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {WATERMARK_POSITIONS.map(({ pos, icon, label }) => (
                      <button
                        key={pos}
                        onClick={() => hd({ watermark: { ...watermark, position: pos } })}
                        className={clsx(
                          'py-1 text-xs rounded border flex flex-col items-center gap-0.5',
                          watermark.position === pos
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        )}
                      >
                        <span>{icon}</span>
                        <span className="text-[9px]">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">투명도: {Math.round(watermark.opacity * 100)}%</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={watermark.opacity}
                    onChange={(e) => hd({ watermark: { ...watermark, opacity: parseFloat(e.target.value) } })}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
