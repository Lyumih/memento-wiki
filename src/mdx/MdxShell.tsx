import { MDXProvider } from '@mdx-js/react'
import type { ReactNode } from 'react'
import { RollLevelDemo } from '@/widgets/RollLevelDemo'
import { PercentTokenDemo } from '@/widgets/PercentTokenDemo'

const components = {
  RollLevelDemo,
  PercentTokenDemo,
}

export function MdxShell({ children }: { children: ReactNode }) {
  return (
    <MDXProvider components={components}>
      <article className="wiki-article">{children}</article>
    </MDXProvider>
  )
}
