import { describe, it, expect } from 'vitest'
import { rollCardLevelUp } from './rollCardLevelUp'

describe('rollCardLevelUp', () => {
  it('level 1 succeeds for every r in 1..100', () => {
    for (let r = 1; r <= 100; r++) {
      expect(rollCardLevelUp(1, r)).toBe(true)
    }
  })

  it('level 100 succeeds only when r is 100', () => {
    expect(rollCardLevelUp(100, 99)).toBe(false)
    expect(rollCardLevelUp(100, 100)).toBe(true)
  })

  it('level > 100 succeeds only when r is 100 (1%)', () => {
    expect(rollCardLevelUp(101, 99)).toBe(false)
    expect(rollCardLevelUp(101, 100)).toBe(true)
    expect(rollCardLevelUp(200, 1)).toBe(false)
    expect(rollCardLevelUp(200, 100)).toBe(true)
  })

  it('level 50: r=49 fails, r=50 succeeds', () => {
    expect(rollCardLevelUp(50, 49)).toBe(false)
    expect(rollCardLevelUp(50, 50)).toBe(true)
  })
})
