import mermaid from 'mermaid'
import { useEffect, useId, useRef } from 'react'

// Mermaid API: ^11.x (see package.json) — use `initialize` + `render`.

let mermaidInitialized = false

function ensureMermaidInitialized() {
  if (mermaidInitialized) return
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' })
  mermaidInitialized = true
}

export type MermaidDiagramProps = {
  /** Mermaid graph source (e.g. flowchart / graph). */
  definition: string
}

/**
 * Renders a Mermaid diagram from trusted repo-authored `definition` (no user input).
 */
export function MermaidDiagram({ definition }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reactId = useId()
  const diagramId = `mmd-${reactId.replace(/:/g, '')}`

  useEffect(() => {
    const root = containerRef.current
    if (!root || !definition.trim()) return undefined

    ensureMermaidInitialized()
    let cancelled = false

    void mermaid.render(diagramId, definition).then(({ svg, bindFunctions }) => {
      if (cancelled) return
      if (containerRef.current !== root) return
      root.innerHTML = svg
      bindFunctions?.(root)
    })

    return () => {
      cancelled = true
      root.innerHTML = ''
    }
  }, [definition, diagramId])

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram"
      role="img"
      aria-label="Схема системы"
    />
  )
}
