import React, { useState } from 'react';
import { useEditorStore } from '../store';
import { Sparkles, ArrowRight, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

// ── 카드뉴스 변환 프롬프트 전문 ────────────────────────────────────────
const CARDNEWS_PROMPT = `당신은 SNS 카드뉴스 콘텐츠 편집자입니다.
사용자가 긴 원고를 입력하면,
이를 인스타그램 카드뉴스 형식으로 재구성하세요.
중요한 출력 규칙이 있습니다.

[슬라이드 구조]
카드뉴스는 다음 방식으로 작성합니다.
제목
본문

제목
본문

제목
본문

슬라이드 사이에는 반드시 "엔터 두 번"을 사용합니다.

각 슬라이드 규칙
1. 첫 줄 = 제목
2. 둘째 줄 = 본문
3. 본문은 2~4줄 이내의 짧은 문장
4. 모바일에서 읽기 쉽게 작성
5. 한 슬라이드는 하나의 핵심 메시지만 담기

[카드뉴스 제작 규칙]
1. 카드뉴스는 최대 10슬라이드 이내로 작성
2. 긴 글이라도 핵심만 남겨 재구성
3. 설명형 문장은 줄이고 핵심 메시지 중심으로 작성
4. 문장은 짧고 강하게 작성
5. 리스트가 필요하면 3~5개까지만 사용
6. 어려운 문장은 쉬운 문장으로 재작성

[추천 카드뉴스 흐름]
1 문제 제기
2 상황 설명
3 핵심 현상
4 사례 또는 데이터
5 이유
6 인사이트
7 정리

[가독성 규칙]
한 문장은 최대 20자 내외
불필요한 조사와 수식어 제거
짧고 명확하게 작성

[출력 형식]
반드시 아래 형식으로만 출력하세요.
제목
본문

제목
본문

제목
본문

다른 설명 없이 카드뉴스 내용만 출력하세요.
이제 아래 원고를 카드뉴스로 변환하세요.`;

// 프롬프트 요약 (박스에 보여줄 압축 버전)
const PROMPT_SUMMARY = '긴 원고 → 카드뉴스 슬라이드 자동 분할 · 핵심 메시지 추출 · 모바일 가독성 최적화 · 최대 10슬라이드';

export const ManuscriptPanel: React.FC = () => {
  const { parseAndGenerateSlides } = useEditorStore();
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);

  const handleGenerate = () => {
    if (!text.trim()) {
      alert("원고를 입력해주세요!");
      return;
    }
    if (window.confirm('원고를 바탕으로 카드뉴스를 새로 구성합니다. 기존 디자인은 초기화됩니다. 계속하시겠습니까?')) {
      parseAndGenerateSlides(text);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CARDNEWS_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = CARDNEWS_PROMPT;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside className="w-full h-full border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
      <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
        <Sparkles size={18} className="text-blue-600" />
        <h2 className="text-sm font-bold text-blue-800">원고 입력창</h2>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-4">
        {/* ── 작성 팁 ── */}
        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
          💡 <b>작성 팁:</b><br/>엔터 두 번(줄바꿈)으로 슬라이드가 나뉩니다. 각 슬라이드의 첫 줄은 <b>제목</b>, 다음 줄은 <b>본문</b>이 됩니다.
        </p>

        {/* ── 카드뉴스 변환 프롬프트 박스 ── */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
          {/* 박스 헤더 */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🤖</span>
              <span className="text-xs font-bold text-gray-700">카드뉴스 변환 프롬프트</span>
            </div>
            <div className="flex items-center gap-1">
              {/* 펼치기/접기 */}
              <button
                onClick={() => setPromptExpanded(v => !v)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title={promptExpanded ? '접기' : '전문 보기'}
              >
                {promptExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {/* 복사 버튼 */}
              <button
                onClick={handleCopyPrompt}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                }`}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? '복사됨!' : '복사'}
              </button>
            </div>
          </div>

          {/* 요약 설명 */}
          <div className="px-3 pt-2 pb-1">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              사용하시는 AI(ChatGPT, Claude 등)에 프롬프트를 복사·붙여넣기 하신 후, 원하시는 원고를 추가로 입력하시면 카드쑉 형식에 맞게 자동 변환됩니다.
            </p>
          </div>

          {/* 요약 태그들 */}
          {!promptExpanded && (
            <div className="px-3 pb-2 pt-1">
              <p className="text-[10px] text-gray-400 italic">{PROMPT_SUMMARY}</p>
            </div>
          )}

          {/* 전문 펼치기 */}
          {promptExpanded && (
            <div className="mx-3 mb-3 mt-1 bg-white border border-gray-200 rounded p-2 max-h-48 overflow-y-auto">
              <pre className="text-[10px] text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                {CARDNEWS_PROMPT}
              </pre>
            </div>
          )}
        </div>

        {/* ── 원고 텍스트에어리어 ── */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`요즘 뜨는 트렌드\n2024년 꼭 알아야 할 마케팅\n\n첫 번째 특징\n숏폼 콘텐츠의 기하급수적 성장\n\n전체 리포트 받기\n프로필 링크를 클릭하세요.`}
          className="w-full flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          style={{ minHeight: '260px' }}
        />

        <button
          onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm text-sm"
        >
          에디터에 반영하기
          <ArrowRight size={16} />
        </button>
      </div>
    </aside>
  );
};
