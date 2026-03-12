import React from 'react';
import { Header } from './components/Header';
import { ManuscriptPanel } from './components/ManuscriptPanel';
import { LeftPanel } from './components/LeftPanel';
import { CenterPanel } from './components/CenterPanel';
import { RightPanel } from './components/RightPanel';
import { useEditorStore } from './store';

function App() {
  const { project } = useEditorStore();
  if (!project) return <div>Loading...</div>;
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100 text-gray-900 font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* 화면을 4분할로 나열합니다 */}
        <ManuscriptPanel />
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </div>
    </div>
  );
}

export default App;
