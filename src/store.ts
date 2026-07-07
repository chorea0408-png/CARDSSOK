import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { EditorState, ExportQuality, FontSizes, GridPosition, Slide, SlideRatio, SLIDE_SIZE_PRESETS, TextAlign, TextColors } from './types';

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

const HISTORY_LIMIT = 30;

const getPixelRatio = (quality: ExportQuality, ratio: SlideRatio): number => {
  const preset = SLIDE_SIZE_PRESETS[ratio];
  const base = preset.exportW / preset.displayW;
  switch (quality) {
    case '1x': return 1;
    case '2x': return base;
    case '3x': return base * 1.5;
  }
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
const captureSlide = async (
  slideId: number,
  ratio: SlideRatio,
  quality: ExportQuality,
  format: 'png' | 'jpeg' = 'png'
): Promise<string> => {
  await document.fonts.ready;
  const el = document.getElementById(`slide-canvas-${slideId}`);
  if (!el) throw new Error(`Canvas not found: slide-canvas-${slideId}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const pixelRatio = getPixelRatio(quality, ratio);
  // skipFonts: Google Fonts CORS 차단 우회 (폰트는 이미 브라우저에 렌더링됨)
  const opts = { pixelRatio, skipFonts: true, cacheBust: true };
  if (format === 'jpeg') return htmlToImage.toJpeg(el as HTMLElement, { ...opts, quality: 0.95 });
  return htmlToImage.toPng(el as HTMLElement, opts);
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      appMode:          'input',
      slideRatio:       '4:5',
      exportQuality:    '2x' as ExportQuality,
      project:          { id: 'proj-1', title: '새로운 카드뉴스' },
      slides:           [createDefaultSlide(1)],
      selectedSlideId:  1,
      multiSelectedIds: [],
      editingField:     null,
      isDirty:          false,

      // ── Undo / Redo 상태 (persist 제외) ─────────────────────────────
      _history:      [] as Slide[][],
      _historyIndex: -1,

      _pushHistory: () => {
        const { slides, _history, _historyIndex } = get();
        const trimmed = _history.slice(0, _historyIndex + 1);
        const next = [...trimmed, slides.map(s => ({ ...s, design: { ...s.design } }))];
        const capped = next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
        set({ _history: capped, _historyIndex: capped.length - 1 });
      },

      undo: () => {
        const { _history, _historyIndex } = get();
        if (_historyIndex <= 0) return;
        const prevIndex = _historyIndex - 1;
        set({ slides: _history[prevIndex], _historyIndex: prevIndex, isDirty: true });
      },

      redo: () => {
        const { _history, _historyIndex } = get();
        if (_historyIndex >= _history.length - 1) return;
        const nextIndex = _historyIndex + 1;
        set({ slides: _history[nextIndex], _historyIndex: nextIndex, isDirty: true });
      },

      setAppMode: (mode) => set({ appMode: mode }),
      setSlideRatio: (ratio) => set({ slideRatio: ratio }),
      setExportQuality: (q) => set({ exportQuality: q }),

      parseAndGenerateSlides: (rawText) => {
        get()._pushHistory();
        const paragraphs = rawText.split('\n\n').filter(p => p.trim() !== '');
        if (paragraphs.length === 0) return;
        const newSlides = paragraphs.map((para, idx) => {
          const lines = para.split('\n').filter(l => l.trim() !== '');
          const isFirst = idx === 0;
          const isLast = idx === paragraphs.length - 1;
          const type = isFirst ? 'cover' : (isLast ? 'cta' : 'insight');
          const headline = lines[0] || '';
          const body = lines.slice(1).join('\n') || '';
          const highlight = isFirst ? 'TITLE' : 'INSIGHT';
          const id = parseInt(crypto.randomUUID().replace(/-/g, '').slice(0, 8), 16);
          const slide = createDefaultSlide(id, { headline, body, highlight });
          slide.slide_type = type as Slide['slide_type'];
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

      deleteSelected: () => {
        get()._pushHistory();
        set((state) => {
          const next = state.slides.filter(s => !state.multiSelectedIds.includes(s.slide_id));
          return { slides: next.length ? next : [createDefaultSlide(Date.now())], multiSelectedIds: [], isDirty: true };
        });
      },

      addSlide: () => {
        get()._pushHistory();
        set((state) => {
          const id = parseInt(crypto.randomUUID().replace(/-/g, '').slice(0, 8), 16);
          const ns = createDefaultSlide(id);
          return { slides: [...state.slides, ns], selectedSlideId: ns.slide_id, isDirty: true };
        });
      },

      deleteSlide: (id) => {
        get()._pushHistory();
        set((state) => {
          const next = state.slides.filter(s => s.slide_id !== id);
          return { slides: next.length ? next : state.slides, selectedSlideId: next[0]?.slide_id || id, isDirty: true };
        });
      },

      duplicateSlide: (id) => {
        get()._pushHistory();
        set((state) => {
          const src = state.slides.find(s => s.slide_id === id);
          if (!src) return state;
          const newId = parseInt(crypto.randomUUID().replace(/-/g, '').slice(0, 8), 16);
          const copy: Slide = { ...src, slide_id: newId, _isDirty: false };
          const idx = state.slides.findIndex(s => s.slide_id === id);
          const next = [...state.slides.slice(0, idx + 1), copy, ...state.slides.slice(idx + 1)];
          return { slides: next, selectedSlideId: copy.slide_id, isDirty: true };
        });
      },

      reorderSlides: (fromIndex, toIndex) => {
        get()._pushHistory();
        set((state) => {
          const next = [...state.slides];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return { slides: next, isDirty: true };
        });
      },

      updateSlideContent: (id, field, value) => set((state) => ({
        slides: state.slides.map(s => s.slide_id === id ? { ...s, content: { ...s.content, [field]: value }, _isDirty: true } : s),
        isDirty: true,
      })),

      updateSlideLayout: (id, updates) => set((state) => ({
        slides: state.slides.map(s => s.slide_id === id ? { ...s, layout: { ...s.layout, ...updates }, _isDirty: true } : s),
        isDirty: true,
      })),

      updateSlideGridPosition: (id, position) => set((state) => ({
        slides: state.slides.map(s =>
          s.slide_id === id
            ? { ...s, layout: { ...s.layout, grid_position: position, text_align: positionToAlign(position) }, _isDirty: true }
            : s
        ),
        isDirty: true,
      })),

      updateSlideDesign: (id, updates) => set((state) => ({
        slides: state.slides.map(s => {
          if (s.slide_id !== id) return s;
          const newDesign = { ...s.design, ...updates };
          if ('watermark' in updates && updates.watermark === undefined) delete newDesign.watermark;
          return { ...s, design: newDesign, _isDirty: true };
        }),
        isDirty: true,
      })),

      setBackgroundImage: (id, dataUrl) => set((state) => ({
        slides: state.slides.map(s => s.slide_id === id ? { ...s, design: { ...s.design, background_image: dataUrl }, _isDirty: true } : s),
        isDirty: true,
      })),

      removeBackgroundImage: (id) => set((state) => ({
        slides: state.slides.map(s => s.slide_id === id ? { ...s, design: { ...s.design, background_image: undefined }, _isDirty: true } : s),
        isDirty: true,
      })),

      setLogoImage: (id, dataUrl) => set((state) => ({
        slides: state.slides.map(s => s.slide_id === id ? { ...s, design: { ...s.design, logo_image: dataUrl }, _isDirty: true } : s),
        isDirty: true,
      })),

      removeLogoImage: (id) => set((state) => ({
        slides: state.slides.map(s => s.slide_id === id ? { ...s, design: { ...s.design, logo_image: undefined }, _isDirty: true } : s),
        isDirty: true,
      })),

      exportJSON: () => {
        const { project, slides } = get();
        const blob = new Blob([JSON.stringify({ project, slides }, null, 2)], { type: 'application/json' });
        triggerDownload(URL.createObjectURL(blob), `${project.title}_export.json`);
      },

      exportPNG: async (slideId) => {
        const { slideRatio, exportQuality } = get();
        const dataUrl = await captureSlide(slideId, slideRatio, exportQuality, 'png');
        const { slides } = get();
        const idx = slides.findIndex(s => s.slide_id === slideId);
        const num = String(idx + 1).padStart(2, '0');
        const preset = SLIDE_SIZE_PRESETS[slideRatio];
        const suffix = exportQuality !== '2x' ? `_${exportQuality}` : '';
        triggerDownload(dataUrl, `slide_${num}_${preset.exportW}x${preset.exportH}${suffix}.png`);
      },

      exportAllJPG: async () => {
        const { slides, project, slideRatio, exportQuality } = get();
        const originalId = get().selectedSlideId;
        const preset = SLIDE_SIZE_PRESETS[slideRatio];
        const suffix = exportQuality !== '2x' ? `_${exportQuality}` : '';

        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          set({ selectedSlideId: slide.slide_id });
          await new Promise(r => setTimeout(r, 150));
          try {
            const dataUrl = await captureSlide(slide.slide_id, slideRatio, exportQuality, 'jpeg');
            const num = String(i + 1).padStart(2, '0');
            triggerDownload(dataUrl, `${project.title}_slide${num}_${preset.exportW}x${preset.exportH}${suffix}.jpg`);
            await new Promise(r => setTimeout(r, 300));
          } catch (e) {
            console.error(`JPG export failed for slide ${i + 1}`, e);
          }
        }
        set({ selectedSlideId: originalId });
      },

      exportAllZIP: async () => {
        const { slides, project, slideRatio, exportQuality } = get();
        const originalId = get().selectedSlideId;
        const preset = SLIDE_SIZE_PRESETS[slideRatio];
        const suffix = exportQuality !== '2x' ? `_${exportQuality}` : '';
        const zip = new JSZip();
        const folder = zip.folder(project.title) ?? zip;

        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          set({ selectedSlideId: slide.slide_id });
          await new Promise(r => setTimeout(r, 150));
          try {
            const dataUrl = await captureSlide(slide.slide_id, slideRatio, exportQuality, 'jpeg');
            const base64 = dataUrl.split(',')[1];
            const num = String(i + 1).padStart(2, '0');
            folder.file(`slide${num}_${preset.exportW}x${preset.exportH}${suffix}.jpg`, base64, { base64: true });
            await new Promise(r => setTimeout(r, 200));
          } catch (e) {
            console.error(`ZIP capture failed for slide ${i + 1}`, e);
          }
        }
        set({ selectedSlideId: originalId });

        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        triggerDownload(URL.createObjectURL(blob), `${project.title}_${preset.exportW}x${preset.exportH}${suffix}.zip`);
      },
    }),
    {
      name: 'cardssok-v1',
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('카드쑉: 저장 데이터 복구 실패', error);
      },
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch (e) {
            console.error('카드쑉: 데이터 불러오기 실패', e);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (e) {
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
              alert('저장 공간이 부족합니다. 배경 이미지를 제거하거나 브라우저 캐시를 정리해 주세요.');
            }
            console.error('카드쑉: 데이터 저장 실패', e);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      // ✅ as unknown as EditorState: partialize 반환값 타입 캐스팅 (Zustand v5 요구사항)
      partialize: (state) => ({
        project:       state.project,
        slideRatio:    state.slideRatio,
        exportQuality: state.exportQuality,
        slides: state.slides.map(s => ({
          ...s,
          design: { ...s.design, background_image: undefined, logo_image: undefined },
        })),
      }) as unknown as EditorState,
    }
  )
);
