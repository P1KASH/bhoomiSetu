import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Route =
  | { name: 'login' }
  | { name: 'dashboard' }
  | { name: 'upload' }
  | { name: 'extraction'; recordId?: string }
  | { name: 'validation'; recordId?: string }
  | { name: 'explainable'; recordId?: string }
  | { name: 'map' }
  | { name: 'record'; recordId: string; tab?: string }
  | { name: 'audit'; recordId?: string };

interface RouterCtx {
  route: Route;
  navigate: (r: Route) => void;
}

const Ctx = createContext<RouterCtx | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'login' });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  return <Ctx.Provider value={{ route, navigate: setRoute }}>{children}</Ctx.Provider>;
}

export function useRouter(): RouterCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
