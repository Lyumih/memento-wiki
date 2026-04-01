import { describe, it, expect } from 'vitest'
import { modifierDemoValuesForId } from './modifierDemoDisplay'

describe('modifierDemoValuesForId', () => {
  it('slot-crit-chance: Lm 1 and 100', () => {
    const a = modifierDemoValuesForId('slot-crit-chance', 1)
    expect(a.base).toBe(30)
    expect(a.current).toBe(30)
    const b = modifierDemoValuesForId('slot-crit-chance', 100)
    expect(b.current).toBe(60)
  })

  it('unknown id uses fallback base 25', () => {
    const v = modifierDemoValuesForId('unknown-mod', 1)
    expect(v.base).toBe(25)
    expect(v.label).toContain('демо')
  })
})
