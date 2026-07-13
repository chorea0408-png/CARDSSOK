import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

// React 에러 바운더리는 클래스 컴포넌트로만 구현 가능
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('카드쑉: 처리되지 않은 오류', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={26} className="text-amber-500" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">
            문제가 발생했어요
          </h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            예상치 못한 오류가 발생했습니다.<br />
            새로고침해도 안 되면 처음 화면으로 돌아가 보세요.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm"
            >
              <RotateCcw size={15} />
              새로고침
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 font-semibold py-2 rounded-xl transition-colors text-sm"
            >
              <Home size={15} />
              처음으로
            </button>
          </div>
        </div>
      </div>
    );
  }
}
