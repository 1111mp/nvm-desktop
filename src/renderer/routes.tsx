import { createMemoryRouter } from 'react-router-dom';

import Home from './pages/home';
import { Versions, loader as VersionsLoader } from './pages/versions';

import type { RouteObject } from 'react-router-dom';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
    children: [
      {
        path: 'all',
        loader: VersionsLoader,
        element: <Versions />,
      },
      {
        path: 'installed',
        lazy: () => import('./pages/installed'),
      },
      {
        path: 'projects',
        lazy: () => import('./pages/projects'),
      },
    ],
  },
];

export const router = createMemoryRouter(routes, {
  initialEntries: ['/', '/all'],
});
