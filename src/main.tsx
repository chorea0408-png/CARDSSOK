import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { LandingPage } from './pages/LandingPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { usePathname } from './router'
import './index.css'

const Root: React.FC = () => {
  const [pathname, navigate] = usePathname();

  if (pathname === '/privacy') {
    return <PrivacyPage onBack={() => navigate('/')} />;
  }
  if (pathname === '/app') {
    return <App />;
  }
  return (
    <LandingPage
      onStart={() => navigate('/app')}
      onPrivacyClick={() => navigate('/privacy')}
    />
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
