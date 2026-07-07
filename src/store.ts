import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { EditorState, ExportQuality, FontProfile, FontSizes, GridPosition, Slide, SlideConstraints, SlideRatio, SLIDE_SIZE_PRESETS, TextAlign, TextColors, ThemeType } from './types';

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

// ── 원고 키워드 기반 자동 테마 추천 ─────────────────────────────────────
// "템플릿 고를 필요 없이 원고만 있으면 완성"을 뒷받침하는 규칙 기반(AI 미사용) 매칭.
// 키워드 등장 횟수가 가장 많은 카테고리를 선택하고, 매칭이 하나도 없으면 기존 기본값을 유지한다.
interface ThemeRule {
  label: string; keywords: string[];
  theme: ThemeType; font_profile: FontProfile;
  c1: string; c2?: string;
}
const THEME_KEYWORD_RULES: ThemeRule[] = [
  { label: '프로모션', keywords: ['할인', '세일', '이벤트', '특가', '오늘만', '한정', '무료', '증정', '쿠폰', '혜택'],
    theme: 'gradient_peach', font_profile: 'bold_modern', c1: '#fb7185', c2: '#6366f1' },
  { label: '에세이',   keywords: ['마음', '일상', '생각', '위로', '감성', '하루', '에세이', '여행'],
    theme: 'solid', font_profile: 'classic_editorial', c1: '#1e293b' },
  { label: '데이터',   keywords: ['데이터', '통계', '리포트', '분석', '전략', '성장', '매출', '트렌드', '인사이트'],
    theme: 'gradient_blue', font_profile: 'clean_sans', c1: '#1e3a8a', c2: '#4c1d95' },
];

const pickThemeFromText = (rawText: string): ThemeRule | null => {
  let best: ThemeRule | null = null;
  let bestCount = 0;
  for (const rule of THEME_KEYWORD_RULES) {
    const count = rule.keywords.reduce((sum, kw) => sum + (rawText.split(kw).length - 1), 0);
    if (count > bestCount) { best = rule; bestCount = count; }
  }
  return best;
};

// ── 텍스트 길이 기반 폰트 크기 자동 보정 ────────────────────────────────
// 슬라이드 생성 시점에만 적용 — 이후 RightPanel에서 수동 조정한 값은 덮어쓰지 않는다.
const BODY_CHARS_PER_LINE = 22;
const computeAutoFontSizes = (headline: string, body: string, constraints: SlideConstraints): FontSizes => {
  const headlineLen = headline.replace(/\n/g, '').length;
  const headlineRatio = headlineLen / constraints.max_headline_length;
  const headline_size = headlineRatio > 1
    ? Math.max(16, Math.round(DEFAULT_FONT_SIZES.headline / headlineRatio))
    : DEFAULT_FONT_SIZES.headline;

  const estimatedLines = body.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / BODY_CHARS_PER_LINE)), 0);
  const bodyRatio = estimatedLines / constraints.max_body_lines;
  const body_size = bodyRatio > 1
    ? Math.max(10, Math.round(DEFAULT_FONT_SIZES.body / bodyRatio))
    : DEFAULT_FONT_SIZES.body;

  return { headline: headline_size, body: body_size, highlight: DEFAULT_FONT_SIZES.highlight };
};

// ── 렌더링 안정화 대기 ─────────────────────────────────────────────────
// 슬라이드 전환/스타일 변경 후 DOM이 잠잠해질 때까지 기다림.
// 고정 딜레이(300ms) 대신 실제 변경이 멎는 시점에 맞춰 대기 시간을 줄인다.
const waitForStableRender = (el: HTMLElement, quietMs = 60, maxWaitMs = 400): Promise<void> => {
  return new Promise((resolve) => {
    let settled = false;
    let quietTimer: ReturnType<typeof setTimeout>;
    const finish = () => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(quietTimer);
      clearTimeout(hardTimer);
      resolve();
    };
    const observer = new MutationObserver(() => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(finish, quietMs);
    });
    observer.observe(el, { childList: true, subtree: true, attributes: true, characterData: true });
    quietTimer = setTimeout(finish, quietMs);
    const hardTimer = setTimeout(finish, maxWaitMs);
  });
};

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
  await new Promise(resolve => requestAnimationFrame(resolve));
  await waitForStableRender(el);
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

      // ── Undo / Redo 스택 (persist 제외) ──────────────────────────────
      // _history: 되돌리기용 과거 스냅샷 스택, _future: 다시실행용 스냅샷 스택
      _history: [] as Slide[][],
      _future:  [] as Slide[][],

      _pushHistory: () => {
        const { slides, _history } = get();
        const next = [..._history, slides.map(s => ({ ...s, design: { ...s.design } }))];
        const capped = next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
        // 새 변경이 시작되면 이전에 되돌렸던 미래(redo) 갈래는 더 이상 유효하지 않음
        set({ _history: capped, _future: [] });
      },

      undo: () => {
        const { _history, _future, slides, selectedSlideId } = get();
        if (_history.length === 0) return;
        const restored = _history[_history.length - 1];
        // parseAndGenerateSlides처럼 슬라이드 전체를 새 ID로 교체하는 액션을 되돌리면
        // 기존 selectedSlideId가 더 이상 존재하지 않아 캔버스가 빈 화면이 됨 → 유효성 확인 후 보정
        const stillExists = restored.some(s => s.slide_id === selectedSlideId);
        set({
          slides: restored,
          _history: _history.slice(0, -1),
          _future: [slides, ..._future],
          selectedSlideId: stillExists ? selectedSlideId : (restored[0]?.slide_id ?? selectedSlideId),
          isDirty: true,
        });
      },

      redo: () => {
        const { _history, _future, slides, selectedSlideId } = get();
        if (_future.length === 0) return;
        const restored = _future[0];
        const stillExists = restored.some(s => s.slide_id === selectedSlideId);
        set({
          slides: restored,
          _history: [..._history, slides],
          _future: _future.slice(1),
          selectedSlideId: stillExists ? selectedSlideId : (restored[0]?.slide_id ?? selectedSlideId),
          isDirty: true,
        });
      },

      setAppMode: (mode) => set({ appMode: mode }),
      setSlideRatio: (ratio) => set({ slideRatio: ratio }),
      setExportQuality: (q) => set({ exportQuality: q }),

      parseAndGenerateSlides: (rawText) => {
        get()._pushHistory();
        const paragraphs = rawText.split('\n\n').filter(p => p.trim() !== '');
        if (paragraphs.length === 0) return null;
        const themeMatch = pickThemeFromText(rawText);
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
          slide.design.font_sizes = computeAutoFontSizes(headline, body, slide.constraints);
          if (themeMatch) {
            slide.design.theme = themeMatch.theme;
            slide.design.font_profile = themeMatch.font_profile;
            slide.design.background_color = themeMatch.c1;
            slide.design.background_color_2 = themeMatch.c2;
          }
          return slide;
        });
        set({ slides: newSlides, selectedSlideId: newSlides[0].slide_id, appMode: 'editor', isDirty: true });
        return themeMatch ? themeMatch.label : null;
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

      applyDesignPreset: (updates) => {
        get()._pushHistory();
        set((state) => ({
          slides: state.slides.map(s => ({ ...s, design: { ...s.design, ...updates }, _isDirty: true })),
          isDirty: true,
        }));
      },

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
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
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
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
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
