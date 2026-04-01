import { describe, it, expect } from 'vitest'
import { modifierPotencyMultiplier, modifierScaledPercent } from './modifierPotency'

describe('modifierPotency', () => {
  it('Lm=1 -> multiplier 1; Lm=100 -> multiplier 2', () => {
    expect(modifierPotencyMultiplier(1)).toBe(1)
    expect(modifierPotencyMultiplier(100)).toBe(2)
  })

  it('example 40% base at Lm=100 -> 80', () => {
    expect(modifierScaledPercent(40, 100)).toBe(80)
  })

  it('rejects Lm < 1', () => {
    expect(() => modifierPotencyMultiplier(0)).toThrow(RangeError)
    expect(() => modifierScaledPercent(10, 0)).toThrow(RangeError)
  })
})
