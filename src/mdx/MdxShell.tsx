import { MDXProvider } from '@mdx-js/react'
import type { ReactNode } from 'react'
import { MermaidDiagram } from '@/widgets/MermaidDiagram'
import { PercentTokenDemo } from '@/widgets/PercentTokenDemo'
import { RollLevelDemo } from '@/widgets/RollLevelDemo'

const components = {
  MermaidDiagram,
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
