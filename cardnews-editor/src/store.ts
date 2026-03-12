import { create } from 'zustand';
import * as htmlToImage from 'html-to-image';
import { EditorState, FontSizes, GridPosition, Slide, SlideRatio, SLIDE_SIZE_PRESETS, TextAlign, TextColors } from './types';

const triggerDownload = (url: string, filename: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
};

const DEFAULT_FONT_SIZES: FontSizes = { headline: 30, body: 16, highlight: 14 };
const DEFAULT_TEXT_COLORS: TextColors = {
  headline: '#ffffff', body: '#e2e8f0', highlight_text: '#111827', highlight_bg: '#ffffff'
};

const createDefaultSlide = (id: number, customContent?: Partial<Slide['content']>): Slide => ({
  slide_id:   id,
  slide_type: 'insight',
  content: {
    headline:  customContent?.headline || '새로운 슬라이드',
    body:      customContent?.body || '내용을 입력하세요.',
    highlight: customContent?.highlight || '키워드',
  },
  layout: {
    grid_position:   'MC',
    text_align:      'center',
    text_density:    'MEDIUM',
    visual_priority: 'BALANCED',
  },
  design: {
    template_id:          'title_body_left',
    theme:                'solid',
    overlay_strength:     0.4,
    background_color:     '#1e293b',
    font_profile:         'bold_modern',
    font_sizes:           { ...DEFAULT_FONT_SIZES },
    text_colors:          { ...DEFAULT_TEXT_COLORS },
    text_shadow:          true,
    text_block_width_pct: 84,
  },
  constraints:     { max_headline_length: 30, max_body_lines: 6 },
  _warnings:       [],
  _isRegenerating: false,
  _isDirty:        false,
});

const positionToAlign = (pos: GridPosition): TextAlign =>
  pos.endsWith('L') ? 'left' : pos.endsWith('R') ? 'right' : 'center';

// ── 고화질 Export 캡처 로직 ──────────────────────────────────────────
// ⚠️ backgroundColor 옵션 사용 금지: html-to-image가 슬라이드 자체 배경색을 덮어씌움
// pixelRatio는 비율별 프리셋에서 동적 계산 (exportW / displayW)
const captureSlide = async (
  slideId: number,
  ratio: SlideRatio,
  format: 'png' | 'jpeg' = 'png'
): Promise<string> => {
  await document.fonts.ready;
  const el = document.getElementById(`slide-canvas-${slideId}`);
  if (!el) throw new Error(`Canvas not found: slide-canvas-${slideId}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const preset = SLIDE_SIZE_PRESETS[ratio];
  const pixelRatio = preset.exportW / preset.displayW; // e.g. 4:5 → 1080/400 = 2.7
  // skipFonts: Google Fonts CORS 차단 우회 (폰트는 이미 브라우저에 렌더링됨)
  const opts = { pixelRatio, skipFonts: true, cacheBust: true };
  if (format === 'jpeg') return htmlToImage.toJpeg(el as HTMLElement, { ...opts, quality: 0.95 });
  return htmlToImage.toPng(el as HTMLElement, opts);
};

export const useEditorStore = create<EditorState>((set, get) => ({
  appMode:          'input',
  slideRatio:       '4:5',
  project:          { id: 'proj-1', title: '새로운 카드뉴스' },
  slides:           [createDefaultSlide(1)],
  selectedSlideId:  1,
  multiSelectedIds: [],
  editingField:     null,
  isDirty:          false,

  setAppMode: (mode) => set({ appMode: mode }),
  setSlideRatio: (ratio) => set({ slideRatio: ratio }),

  // ── 텍스트를 카드뉴스로 쪼개주는 마법의 로직 ──
  parseAndGenerateSlides: (rawText) => {
    const paragraphs = rawText.split('\n\n').filter(p => p.trim() !== '');
    if (paragraphs.length === 0) return;
    const newSlides = paragraphs.map((para, idx) => {
      const lines = para.split('\n').filter(l => l.trim() !== '');
      const isFirst = idx === 0;
      const isLast = idx === paragraphs.length - 1;

      let type = isFirst ? 'cover' : (isLast ? 'cta' : 'insight');
      let headline = lines[0] || '';
      let body = lines.slice(1).join('\n') || '';
      let highlight = isFirst ? 'TITLE' : 'INSIGHT';
      const slide = createDefaultSlide(Date.now() + idx, { headline, body, highlight });
      slide.slide_type = type as any;

      if (isFirst || isLast) {
        slide.layout.grid_position = 'MC'; slide.layout.text_align = 'center';
      } else {
        slide.layout.grid_position = 'ML'; slide.layout.text_align = 'left';
      }
      return slide;
    });
    set({ slides: newSlides, selectedSlideId: newSlides[0].slide_id, appMode: 'editor', isDirty: true });
  },

  selectSlide: (id) => set({ selectedSlideId: id, multiSelectedIds: [] }),

  toggleMultiSelect: (id) => set((state) => {
    const ids = state.multiSelectedIds;
    const newIds = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id];
    return { multiSelectedIds: newIds, selectedSlideId: id };
  }),

  clearMultiSelect: () => set({ multiSelectedIds: [] }),

  deleteSelected: () => set((state) => {
    const next = state.slides.filter(s => !state.multiSelectedIds.includes(s.slide_id));
    return { slides: next.length ? next : [createDefaultSlide(Date.now())], multiSelectedIds: [], isDirty: true };
  }),

  addSlide: () => set((state) => {
    const ns = createDefaultSlide(Date.now());
    return { slides: [...state.slides, ns], selectedSlideId: ns.slide_id, isDirty: true };
  }),

  deleteSlide: (id) => set((state) => {
    const next = state.slides.filter(s => s.slide_id !== id);
    return { slides: next.length ? next : state.slides, selectedSlideId: next[0]?.slide_id || id, isDirty: true };
  }),

  updateSlideContent: (id, field, value) => set((state) => ({
    slides: state.slides.map(s => s.slide_id === id ? { ...s, content: { ...s.content, [field]: value }, _isDirty: true } : s), isDirty: true
  })),

  updateSlideLayout: (id, updates) => set((state) => ({
    slides: state.slides.map(s => s.slide_id === id ? { ...s, layout: { ...s.layout, ...updates }, _isDirty: true } : s), isDirty: true
  })),

  updateSlideGridPosition: (id, position) => set((state) => ({
    slides: state.slides.map(s => s.slide_id === id ? { ...s, layout: { ...s.layout, grid_position: position, text_align: positionToAlign(position) }, _isDirty: true } : s), isDirty: true
  })),

  updateSlideDesign: (id, updates) => set((state) => ({
    slides: state.slides.map(s => {
      if (s.slide_id !== id) return s;
      const newDesign = { ...s.design, ...updates };
      if ('watermark' in updates && updates.watermark === undefined) delete newDesign.watermark;
      return { ...s, design: newDesign, _isDirty: true };
    }), isDirty: true
  })),

  setBackgroundImage: (id, dataUrl) => set((state) => ({
    slides: state.slides.map(s => s.slide_id === id ? { ...s, design: { ...s.design, background_image: dataUrl }, _isDirty: true } : s), isDirty: true
  })),

  removeBackgroundImage: (id) => set((state) => ({
    slides: state.slides.map(s => s.slide_id === id ? { ...s, design: { ...s.design, background_image: undefined }, _isDirty: true } : s), isDirty: true
  })),

  setLogoImage: (id, dataUrl) => set((state) => ({
    slides: state.slides.map(s => s.slide_id === id ? { ...s, design: { ...s.design, logo_image: dataUrl }, _isDirty: true } : s), isDirty: true
  })),

  removeLogoImage: (id) => set((state) => ({
    slides: state.slides.map(s => s.slide_id === id ? { ...s, design: { ...s.design, logo_image: undefined }, _isDirty: true } : s), isDirty: true
  })),

  exportJSON: () => {
    const { project, slides } = get();
    const blob = new Blob([JSON.stringify({ project, slides }, null, 2)], { type: 'application/json' });
    triggerDownload(URL.createObjectURL(blob), `${project.title}_export.json`);
  },

  exportPNG: async (slideId) => {
    const { slideRatio } = get();
    try {
      const dataUrl = await captureSlide(slideId, slideRatio, 'png');
      const preset = SLIDE_SIZE_PRESETS[slideRatio];
      triggerDownload(dataUrl, `slide_${slideId}_${preset.exportW}x${preset.exportH}.png`);
    } catch (e) {
      console.error('PNG export failed', e);
      alert('PNG 내보내기 실패: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  exportAllJPG: async () => {
    const { slides, project, slideRatio } = get();
    const originalId = get().selectedSlideId; // 현재 선택된 슬라이드 기억
    const preset = SLIDE_SIZE_PRESETS[slideRatio];

    for (const slide of slides) {
      // ⬇ CenterPanel이 이 슬라이드를 DOM에 렌더링하도록 선택 전환
      set({ selectedSlideId: slide.slide_id });
      // React 렌더링 완료 대기 (captureSlide 내부 300ms 딜레이 전에 필요)
      await new Promise(r => setTimeout(r, 150));
      try {
        const dataUrl = await captureSlide(slide.slide_id, slideRatio, 'jpeg');
        triggerDownload(dataUrl, `${project.title}_slide${slide.slide_id}_${preset.exportW}x${preset.exportH}.jpg`);
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error('JPG export failed', e);
      }
    }

    // 내보내기 완료 후 원래 슬라이드로 복원
    set({ selectedSlideId: originalId });
  },
}));
