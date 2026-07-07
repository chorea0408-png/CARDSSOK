import React from 'react';
import {
  Sparkles, ArrowRight, FileText, Layers, Palette, Download,
  Wand2, ImageDown, LayoutGrid, Undo2,
} from 'lucide-react';

const FEATURES: { Icon: React.FC<{ size?: number; className?: string }>; title: string; desc: string }[] = [
  { Icon: Wand2,      title: '원고만 붙여넣으면 자동 생성', desc: '엔터 두 번으로 문단을 구분하면, AI 없이도 카드뉴스 슬라이드로 즉시 나뉘어요.' },
  { Icon: Palette,    title: '테마·폰트·색상 자유 편집',   desc: '단색부터 오로라, 다크 글래스까지 5가지 테마와 4가지 폰트로 분위기를 바꿔보세요.' },
  { Icon: LayoutGrid, title: '드래그로 순서 정리',         desc: '슬라이드 목록에서 드래그 한 번으로 순서를 바꾸고, 복제·삭제도 간편하게.' },
  { Icon: ImageDown,  title: 'PNG/JPG/ZIP 일괄 내보내기',  desc: '전체 슬라이드를 ZIP 하나로 묶어 다운로드하거나, 화질(1x/2x/3x)을 골라 저장하세요.' },
  { Icon: Undo2,      title: 'Undo/Redo & 자동 저장',      desc: '작업 내역은 브라우저에 자동 저장되고, Cmd+Z로 언제든 되돌릴 수 있어요.' },
  { Icon: Download,   title: '설치·로그인 없이 무료',       desc: '회원가입 없이 브라우저에서 바로 시작하고, 결과물은 바로 다운로드할 수 있어요.' },
];

const STEPS: { step: string; title: string; desc: string }[] = [
  { step: '1', title: '원고 입력',        desc: '왼쪽 원고 창에 텍스트를 붙여넣거나 직접 입력하세요.' },
  { step: '2', title: '자동 분리',        desc: '엔터 두 번으로 슬라이드가 나뉘어요. 첫 줄은 제목, 나머지는 본문.' },
  { step: '3', title: '디자인 & 내보내기', desc: '오른쪽에서 색상·폰트를 고르고 PNG/JPG/ZIP으로 저장하세요.' },
];

export const LandingPage: React.FC<{ onStart: () => void; onPrivacyClick: () => void }> = ({ onStart, onPrivacyClick }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 헤더 */}
      <header className="h-16 border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <Sparkles size={15} className="text-white" />
          </div>
          <span className="font-extrabold text-gray-900" style={{ fontSize: '18px', letterSpacing: '-0.03em' }}>
            카드쑉
          </span>
        </div>
        <button
          onClick={onStart}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
        >
          무료로 시작하기
          <ArrowRight size={14} />
        </button>
      </header>

      {/* 히어로 */}
      <section className="px-6 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28 text-center bg-gradient-to-b from-indigo-50/60 to-white">
        <div className="max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-5">
            로그인 없이, 완전 무료
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-5" style={{ letterSpacing: '-0.03em' }}>
            원고만 쓰면<br />카드뉴스가 완성돼요
          </h1>
          <p className="text-gray-500 text-base md:text-lg mb-8 leading-relaxed">
            긴 글을 붙여넣기만 하세요. 카드쑉이 문단을 슬라이드로 자동으로 나누고,
            디자인까지 입혀서 SNS에 바로 올릴 수 있는 카드뉴스로 만들어드려요.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-md text-base"
          >
            지금 무료로 만들어보기
            <ArrowRight size={18} />
          </button>
          <p className="mt-3 text-xs text-gray-400">가입 없이 바로 사용 · 최대 10슬라이드 자동 분할</p>
        </div>

        {/* 미니 프리뷰 카드 */}
        <div className="max-w-3xl mx-auto mt-14 flex items-end justify-center gap-4 md:gap-6">
          {[
            { rotate: -6, bg: 'from-slate-700 to-slate-900', label: '표지' },
            { rotate: 0,  bg: 'from-blue-600 to-indigo-700', label: '본문', big: true },
            { rotate: 6,  bg: 'from-indigo-500 to-purple-600', label: 'CTA' },
          ].map(({ rotate, bg, label, big }) => (
            <div
              key={label}
              className={`rounded-xl bg-gradient-to-br ${bg} shadow-xl flex items-end justify-center text-white/90 text-xs font-semibold pb-3 shrink-0`}
              style={{
                width: big ? 140 : 110,
                height: big ? 200 : 160,
                transform: `rotate(${rotate}deg) translateY(${big ? -12 : 0}px)`,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="px-6 md:px-8 py-16 md:py-24 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-3" style={{ letterSpacing: '-0.02em' }}>
          카드뉴스 제작에 필요한 건 다 있어요
        </h2>
        <p className="text-center text-gray-500 mb-12">디자인 도구를 몰라도, 텍스트만 있으면 충분해요.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Icon size={20} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 사용법 3단계 */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12" style={{ letterSpacing: '-0.02em' }}>
            3단계면 끝나요
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mb-3">
                  {step}
                </div>
                <div className="font-bold text-gray-900 mb-1">{title}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 마지막 CTA */}
      <section className="px-6 md:px-8 py-20 text-center bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-xl mx-auto">
          <FileText size={32} className="text-white/80 mx-auto mb-5" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
            지금 바로 첫 카드뉴스를 만들어보세요
          </h2>
          <p className="text-blue-100 mb-8 text-sm md:text-base">
            AI(ChatGPT/Claude)로 원고를 먼저 만들어도 좋아요. 붙여넣기만 하면 됩니다.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 font-bold px-6 py-3.5 rounded-xl transition-colors shadow-md text-base"
          >
            무료로 시작하기
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="px-6 md:px-8 py-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} 카드쑉. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <button onClick={onPrivacyClick} className="hover:text-gray-600 transition-colors underline-offset-2 hover:underline">
              개인정보처리방침
            </button>
            <span>문의: chorea0408@gmail.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
