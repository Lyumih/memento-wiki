import type { ComponentType } from 'react'
import { useMemo } from 'react'
import { Spin } from 'antd'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import WikiLayout from './WikiLayout'
import DbListPage from '@/pages/DbListPage'
import DbDetailPage from '@/pages/DbDetailPage'
import NotFoundPage from '@/pages/NotFoundPage'
import WikiExportPage from '@/pages/WikiExportPage'
import { MdxShell } from '@/mdx/MdxShell'
import { globKeyToRelMdx, pathFromContentMdx } from '@/lib/contentPaths'

const mdxModules = import.meta.glob('../../content/**/*.mdx') as Record<
  string,
  () => Promise<{ default: ComponentType }>
>

function buildMdxRoutes() {
  const routes: Array<{
    index?: true
    path?: string
    lazy: () => Promise<{ Component: ComponentType }>
  }> = []

  for (const [key, loader] of Object.entries(mdxModules)) {
    const rel = globKeyToRelMdx(key)
    const urlPath = pathFromContentMdx(rel)

    const lazyRoute = async () => {
      const mod = await loader()
      const Cmp = mod.default
      const Page = () => (
        <MdxShell>
          <Cmp />
        </MdxShell>
      )
      return { Component: Page }
    }

    if (urlPath === '/') {
      routes.push({ index: true, lazy: lazyRoute })
    } else {
      routes.push({ path: urlPath.slice(1), lazy: lazyRoute })
    }
  }

  return routes
}

export function AppRouter() {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/',
          element: <WikiLayout />,
          hydrateFallbackElement: (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Spin size="large" />
            </div>
          ),
          children: [
            ...buildMdxRoutes(),
            { path: 'db/items', element: <DbListPage kind="items" /> },
            { path: 'db/skills', element: <DbListPage kind="skills" /> },
            { path: 'db/mods', element: <DbListPage kind="modifiers" /> },
            { path: 'db/items/:id', element: <DbDetailPage kind="items" /> },
            { path: 'db/skills/:id', element: <DbDetailPage kind="skills" /> },
            { path: 'db/mods/:id', element: <DbDetailPage kind="modifiers" /> },
            { path: 'export', element: <WikiExportPage /> },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ]),
    [],
  )

  return <RouterProvider router={router} />
}
