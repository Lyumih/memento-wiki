import { describe, it, expect } from 'vitest'
import { rollCardLevelUp } from './rollCardLevelUp'
import { rollCardLevelUpWithSpecialization } from './rollCardLevelUpWithSpecialization'

describe('rollCardLevelUpWithSpecialization', () => {
  it('при L<=100 использует L_eff = max(1, L - b) через rollCardLevelUp', () => {
    const L = 75
    const b = 1
    const r = 74
    expect(rollCardLevelUp(L, r)).toBe(false)
    expect(rollCardLevelUpWithSpecialization(L, r, b)).toBe(rollCardLevelUp(74, r))
    expect(rollCardLevelUpWithSpecialization(L, r, b)).toBe(true)
  })

  it('при L>100 бонус не применяется', () => {
    const L = 101
    expect(rollCardLevelUpWithSpecialization(L, 99, 5)).toBe(
      rollCardLevelUp(L, 99),
    )
    expect(rollCardLevelUpWithSpecialization(L, 100, 5)).toBe(true)
  })

  it('b=0 совпадает с rollCardLevelUp для L<=100', () => {
    for (const L of [1, 50, 100]) {
      for (const r of [1, 50, 100]) {
        expect(rollCardLevelUpWithSpecialization(L, r, 0)).toBe(rollCardLevelUp(L, r))
      }
    }
  })

  it('отрицательный b — RangeError', () => {
    expect(() => rollCardLevelUpWithSpecialization(10, 50, -1)).toThrow(RangeError)
  })
})
