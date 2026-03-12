import React, { useState } from 'react';
import { useEditorStore } from '../store';
import { Sparkles, ArrowRight } from 'lucide-react';

export const ManuscriptPanel: React.FC = () => {
  const { parseAndGenerateSlides } = useEditorStore();
  const [text, setText] = useState('');

  const handleGenerate = () => {
    if (!text.trim()) {
      alert("원고를 입력해주세요!");
      return;
    }
    if (window.confirm('원고를 바탕으로 카드뉴스를 새로 구성합니다. 기존 디자인은 초기화됩니다. 계속하시겠습니까?')) {
      parseAndGenerateSlides(text);
    }
  };

  return (
    <aside className="w-[280px] border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
        <Sparkles size={18} className="text-blue-600" />
        <h2 className="text-sm font-bold text-blue-800">원고 입력창</h2>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-4">
        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
          💡 <b>작성 팁:</b><br/>엔터 두 번(줄바꿈)으로 슬라이드가 나뉩니다. 각 슬라이드의 첫 줄은 <b>제목</b>, 다음 줄은 <b>본문</b>이 됩니다.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`요즘 뜨는 트렌드\n2024년 꼭 알아야 할 마케팅\n\n첫 번째 특징\n숏폼 콘텐츠의 기하급수적 성장\n\n전체 리포트 받기\n프로필 링크를 클릭하세요.`}
          className="w-full flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          style={{ minHeight: '300px' }}
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
