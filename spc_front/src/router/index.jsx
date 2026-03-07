// src/router/index.jsx
import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import { resolveRouterBasename } from '../config/runtimeConfig';

const Home = lazy(() => import('../page/Home'));
const Chart = lazy(() => import('../page/Chart'));
const SpcData = lazy(() => import('../page/SpcData'));
const ProjectMapper = lazy(() => import('../page/ProjectMapper'));

const withSuspense = (element) => (
    <Suspense fallback={null}>
        {element}
    </Suspense>
);

const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                path: '/',
                element: withSuspense(<Home />),
            },
            {
                path: '/spc-data',
                element: withSuspense(<SpcData />),
            },
            {
                path: '/chart',
                element: withSuspense(<Chart />),
            },
            {
                path: '/project-mapper',
                element: withSuspense(<ProjectMapper />),
            },
        ],
    },
], {
    basename: resolveRouterBasename(),
});

export default router;
