import React, { useState } from 'react';
import { useEditorStore } from '../store';
import { Sparkles, ArrowRight } from 'lucide-react';

export const InputScreen: React.FC = () => {
  const { parseAndGenerateSlides } = useEditorStore();
  const [text, setText] = useState('');

  const handleGenerate = () => {
    if (!text.trim()) {
      alert("원고를 입력해주세요!");
      return;
    }
    parseAndGenerateSlides(text);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-8 text-white text-center">
          <Sparkles className="mx-auto mb-3" size={32} />
          <h1 className="text-2xl font-bold mb-2">원고를 넣으면 카드뉴스가 뚝딱!</h1>
          <p className="text-blue-100 text-sm">엔터 두 번(줄바꿈)으로 슬라이드가 나뉩니다. 첫 줄은 제목, 다음 줄은 본문이 됩니다.</p>
        </div>

        <div className="p-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`예시:\n\n요즘 뜨는 트렌드\n2024년 꼭 알아야 할 마케팅 트렌드 정리\n\n첫 번째 특징\n숏폼 콘텐츠의 기하급수적 성장\n\n전체 리포트 받기\n프로필 링크를 클릭하세요.`}
            className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none mb-6"
          />

          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors text-lg shadow-md"
          >
            카드뉴스 자동 생성하기
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
