import { useCallback, useEffect, useState } from 'react';
import { parseHashRoute } from '../utils/routing';

export function useHashRouter() {
  const [route, setRoute] = useState(parseHashRoute);

  const navigate = useCallback((page, id = null, action = null) => {
    const parts = [page];
    if (id) parts.push(id);
    if (action) parts.push(action);
    const hash = `#/${parts.join('/')}`;
    window.history.pushState({ page, id, action }, '', hash);
    setRoute({ page, id, action });
  }, []);

  useEffect(() => {
    const handlePopState = () => setRoute(parseHashRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { route, navigate };
}
