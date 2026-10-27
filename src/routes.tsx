import { createMemoryRouter, type RouteObject } from 'react-router';

import { ErrorBoundary } from '@/components/error-boundary';
import Home from '@/pages/home';
import { Versions, loader as VersionsLoader } from './pages/versions';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
    hydrateFallbackElement: <div />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'versions',
        loader: VersionsLoader,
        element: <Versions />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'installed',
        lazy: () => import('@/pages/installed'),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'projects',
        lazy: () => import('./pages/projects'),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'groups',
        lazy: () => import('./pages/groups'),
        errorElement: <ErrorBoundary />,
      },
    ],
  },
];

const router = createMemoryRouter(routes, {
  initialEntries: ['/versions'],
});

export { router };
