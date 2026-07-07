import { useEffect, useState, useCallback } from 'react';

// react-router 없이 3개 경로(/, /app, /privacy)만 다루는 최소 라우터
export function usePathname(): [string, (path: string) => void] {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    if (path !== window.location.pathname) {
      window.history.pushState({}, '', path);
      setPathname(path);
      window.scrollTo(0, 0);
    }
  }, []);

  return [pathname, navigate];
}
