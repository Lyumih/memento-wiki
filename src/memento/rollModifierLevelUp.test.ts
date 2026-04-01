import { describe, it, expect } from 'vitest'
import { rollCardLevelUp } from './rollCardLevelUp'
import { rollModifierLevelUp } from './rollModifierLevelUp'

describe('rollModifierLevelUp', () => {
  it('matches rollCardLevelUp for sample levels and r', () => {
    const pairs: [number, number][] = [
      [1, 50],
      [50, 49],
      [50, 50],
      [100, 99],
      [100, 100],
      [150, 1],
      [150, 100],
    ]
    for (const [level, r] of pairs) {
      expect(rollModifierLevelUp(level, r)).toBe(rollCardLevelUp(level, r))
    }
  })
})
