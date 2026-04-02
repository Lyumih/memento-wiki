import { describe, expect, it } from 'vitest'
import { rollCardLevelUp } from './rollCardLevelUp'
import {
  cardLevelUpSuccessProbability,
  cardLevelUpSuccessProbabilityWithBonus,
  expectedRollsForOneSuccess,
  expectedRollsToReachLevel,
} from './cardLevelUpStats'

describe('cardLevelUpStats', () => {
  it('P(1) is 1 and E1 is 1', () => {
    expect(cardLevelUpSuccessProbability(1)).toBe(1)
    expect(expectedRollsForOneSuccess(1)).toBe(1)
  })

  it('P(100) and P(101)', () => {
    expect(cardLevelUpSuccessProbability(100)).toBe(0.01)
    expect(cardLevelUpSuccessProbability(101)).toBe(0.01)
    expect(expectedRollsForOneSuccess(100)).toBe(100)
  })

  it('P(50) matches 51 favorable outcomes', () => {
    expect(cardLevelUpSuccessProbability(50)).toBe(51 / 100)
    expect(expectedRollsForOneSuccess(50)).toBeCloseTo(100 / 51, 10)
  })

  it('E_cum(1, 10) equals sum of E1 for L=1..9', () => {
    let sum = 0
    for (let L = 1; L <= 9; L++) sum += expectedRollsForOneSuccess(L)
    expect(expectedRollsToReachLevel(1, 10)).toBeCloseTo(sum, 10)
  })

  it('E_cum(S, T) is 0 when T <= S', () => {
    expect(expectedRollsToReachLevel(5, 5)).toBe(0)
    expect(expectedRollsToReachLevel(10, 3)).toBe(0)
  })

  it('L = 200 matches high-level rule (same as L > 100)', () => {
    expect(cardLevelUpSuccessProbability(200)).toBe(0.01)
    expect(expectedRollsForOneSuccess(200)).toBe(100)
  })

  it('WithBonus(75, 1) equals P(max(1, L - b))', () => {
    const L = 75
    const b = 1
    expect(cardLevelUpSuccessProbabilityWithBonus(L, b)).toBe(
      cardLevelUpSuccessProbability(Math.max(1, L - b)),
    )
  })

  it('WithBonus(101, 5) equals P(101) — bonus ignored above 100', () => {
    expect(cardLevelUpSuccessProbabilityWithBonus(101, 5)).toBe(
      cardLevelUpSuccessProbability(101),
    )
  })

  it('empirical success rate matches P(L) for sample levels', () => {
    for (const L of [1, 50, 100, 101] as const) {
      let successes = 0
      for (let r = 1; r <= 100; r++) {
        if (rollCardLevelUp(L, r)) successes++
      }
      expect(successes / 100).toBe(cardLevelUpSuccessProbability(L))
    }
  })
})
