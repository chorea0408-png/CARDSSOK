export type SlideType = 'cover' | 'context' | 'insight' | 'data' | 'example' | 'takeaway' | 'cta';

// ── 슬라이드 비율/사이즈 프리셋 ──────────────────────────────────────
export type SlideRatio = '1:1' | '4:5' | '9:16';
export const SLIDE_SIZE_PRESETS: Record<SlideRatio, {
  displayW: number; displayH: number;
  exportW: number;  exportH: number;
  label: string;
}> = {
  '1:1':  { displayW: 400, displayH: 400, exportW: 1080, exportH: 1080,  label: '정방형 (1:1)' },
  '4:5':  { displayW: 400, displayH: 500, exportW: 1080, exportH: 1350,  label: '피드 (4:5)' },
  '9:16': { displayW: 338, displayH: 600, exportW: 1080, exportH: 1920,  label: '스토리 (9:16)' },
};
export type GridPosition = 'TL' | 'TC' | 'TR' | 'ML' | 'MC' | 'MR' | 'BL' | 'BC' | 'BR';
export type TextDensity  = 'LIGHT' | 'MEDIUM' | 'HEAVY';
export type VisualPriority = 'TEXT_FIRST' | 'BALANCED' | 'VISUAL_FIRST';
export type TextAlign   = 'left' | 'center' | 'right';
export type FontProfile = 'bold_modern' | 'classic_editorial' | 'clean_sans' | 'soft_rounded';
export type WatermarkPosition = 'TL' | 'TC' | 'TR' | 'BL' | 'BC' | 'BR';
// 새로 추가된 테마 및 색상 타입
export type ThemeType = 'solid' | 'gradient_blue' | 'gradient_peach' | 'aurora' | 'dark_glass';
export interface TextColors {
  headline: string;
  body: string;
  highlight_text: string;
  highlight_bg: string;
}
export interface FontSizes {
  headline:  number;
  body:      number;
  highlight: number;
}
export interface WatermarkConfig {
  text:     string;
  position: WatermarkPosition;
  opacity:  number;
}
export interface SlideContent {
  headline:  string;
  body:      string;
  highlight: string;
}
export interface SlideLayout {
  grid_position:   GridPosition;
  text_align:      TextAlign;
  text_density:    TextDensity;
  visual_priority: VisualPriority;
}
export interface SlideDesign {
  template_id:          string;
  theme:                ThemeType;        // 테마 추가
  overlay_strength:     number;
  background_color?:    string;   // 배경 기본색 (solid 단색 or 그라디언트 색1)
  background_color_2?:  string;   // 배경 보조색 (그라디언트 색2)
  background_image?:    string;
  logo_image?:          string;           // 브랜드 로고 추가
  font_profile:         FontProfile;
  font_sizes:           FontSizes;
  text_colors:          TextColors;       // 개별 텍스트 색상 추가
  text_shadow:          boolean;          // 글자 가독성 그림자 추가
  text_block_width_pct: number;
  watermark?:           WatermarkConfig;
}
export interface SlideConstraints {
  max_headline_length: number;
  max_body_lines:      number;
}
export interface Warning {
  code:     string;
  message:  string;
  severity: 'error' | 'warning' | 'info';
}
export interface Slide {
  slide_id:    number;
  slide_type:  SlideType;
  content:     SlideContent;
  layout:      SlideLayout;
  design:      SlideDesign;
  constraints: SlideConstraints;
  _warnings:        Warning[];
  _isRegenerating:  boolean;
  _isDirty:         boolean;
}
export interface ProjectMeta {
  id:    string;
  title: string;
}
export interface EditorState {
  appMode:          'input' | 'editor';
  setAppMode:       (mode: 'input' | 'editor') => void;
  slideRatio:       SlideRatio;
  setSlideRatio:    (ratio: SlideRatio) => void;
  parseAndGenerateSlides: (rawText: string) => void; // 원고 자동 분할

  project:          ProjectMeta;
  slides:           Slide[];
  selectedSlideId:  number;
  multiSelectedIds: number[];
  editingField:     string | null;
  isDirty:          boolean;
  selectSlide:           (id: number) => void;
  toggleMultiSelect:     (id: number) => void;
  clearMultiSelect:      () => void;
  deleteSelected:        () => void;
  addSlide:              () => void;
  deleteSlide:           (id: number) => void;
  updateSlideContent:    (id: number, field: keyof SlideContent, value: string) => void;
  updateSlideLayout:     (id: number, updates: Partial<SlideLayout>) => void;
  updateSlideGridPosition: (id: number, position: GridPosition) => void;
  updateSlideDesign:     (id: number, updates: Partial<SlideDesign>) => void;
  setBackgroundImage:    (id: number, dataUrl: string) => void;
  removeBackgroundImage: (id: number) => void;
  setLogoImage:          (id: number, dataUrl: string) => void;
  removeLogoImage:       (id: number) => void;
  exportJSON:    () => void;
  exportPNG:     (slideId: number) => Promise<void>;
  exportAllJPG:  () => Promise<void>;
}
