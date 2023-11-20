import { createMemoryRouter } from 'react-router-dom';

import Home from './pages/home';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VersionsRoute, loader as VersionsLoader } from './pages/versions';

import type { RouteObject } from 'react-router-dom';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
    children: [
      {
        path: 'all',
        loader: VersionsLoader,
        element: <VersionsRoute />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'installed',
        lazy: () => import('./pages/installed'),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'projects',
        lazy: () => import('./pages/projects'),
        errorElement: <ErrorBoundary />,
      },
    ],
  },
];

export const router = createMemoryRouter(routes, {
  initialEntries: ['/all'],
});
