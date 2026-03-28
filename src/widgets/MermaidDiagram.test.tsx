import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MermaidDiagram } from './MermaidDiagram'

vi.mock('mermaid', () => {
  const initialize = vi.fn()
  const renderMermaid = vi.fn().mockResolvedValue({
    svg: '<svg data-testid="mermaid-svg"></svg>',
  })
  return {
    default: {
      initialize,
      render: renderMermaid,
    },
  }
})

describe('MermaidDiagram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes mermaid and renders definition', async () => {
    const mermaid = (await import('mermaid')).default
    render(<MermaidDiagram definition="flowchart LR;A-->B" />)
    await waitFor(() => expect(mermaid.initialize).toHaveBeenCalled())
    await waitFor(() => expect(mermaid.render).toHaveBeenCalled())
    const match = vi.mocked(mermaid.render).mock.calls.find(
      (c) => typeof c[1] === 'string' && (c[1] as string).includes('flowchart'),
    )
    expect(match).toBeDefined()
  })
})
