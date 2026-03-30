import { describe, it, expect } from 'vitest'
import { rollCardLevelUp } from './rollCardLevelUp'
import { rollMementoLevelUp } from './rollMementoLevelUp'

describe('rollMementoLevelUp', () => {
  it('matches rollCardLevelUp on sample (level, r) pairs', () => {
    const pairs: [number, number][] = [
      [1, 1],
      [1, 50],
      [1, 100],
      [50, 49],
      [50, 50],
      [50, 100],
      [100, 99],
      [100, 100],
      [101, 99],
      [101, 100],
      [200, 1],
      [200, 100],
    ]
    for (const [level, r] of pairs) {
      expect(rollMementoLevelUp(level, r)).toBe(rollCardLevelUp(level, r))
    }
  })
})
