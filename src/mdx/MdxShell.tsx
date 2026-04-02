import { MDXProvider } from '@mdx-js/react'
import type { ReactNode } from 'react'
import { CardEmulationSandbox } from '@/widgets/CardEmulationSandbox'
import { MermaidDiagram } from '@/widgets/MermaidDiagram'
import { MementoRollLab } from '@/widgets/MementoRollLab'
import { ModifierSlotsLab } from '@/widgets/ModifierSlotsLab'
import { PercentTokenDemo } from '@/widgets/PercentTokenDemo'
import { RollLevelDemo } from '@/widgets/RollLevelDemo'
import { SpecializationLab } from '@/widgets/SpecializationLab'

const components = {
  CardEmulationSandbox,
  MermaidDiagram,
  MementoRollLab,
  ModifierSlotsLab,
  RollLevelDemo,
  PercentTokenDemo,
  SpecializationLab,
}

export function MdxShell({ children }: { children: ReactNode }) {
  return (
    <MDXProvider components={components}>
      <article className="wiki-article">{children}</article>
    </MDXProvider>
  )
}
