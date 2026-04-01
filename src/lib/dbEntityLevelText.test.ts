import { describe, expect, it } from 'vitest'
import {
  entityHasUsableStats,
  interpolateDbText,
  statDisplayAtLevel,
} from './dbEntityLevelText'

describe('statDisplayAtLevel', () => {
  it('floors base + perLevel * L', () => {
    expect(statDisplayAtLevel(10, 2, 0)).toBe(10)
    expect(statDisplayAtLevel(10, 2, 1)).toBe(12)
    expect(statDisplayAtLevel(1.4, 0.3, 2)).toBe(2) // floor(2.0)
    expect(statDisplayAtLevel(1.4, 0.3, 1)).toBe(1) // floor(1.7)
  })

  it('floors negative toward -infinity', () => {
    expect(statDisplayAtLevel(-1.2, 0, 0)).toBe(-2)
  })
})

describe('entityHasUsableStats', () => {
  it('is false for undefined, empty object, or missing keys', () => {
    expect(entityHasUsableStats(undefined)).toBe(false)
    expect(entityHasUsableStats({})).toBe(false)
  })

  it('is true when at least one stat entry exists', () => {
    expect(
      entityHasUsableStats({ damage: { base: 1, perLevel: 1 } }),
    ).toBe(true)
  })
})

describe('interpolateDbText', () => {
  it('replaces placeholders with floored values', () => {
    const stats = { damage: { base: 10, perLevel: 2 } }
    expect(interpolateDbText('Урон {{damage}}.', stats, 1)).toBe('Урон 12.')
  })

  it('returns text unchanged when no usable stats', () => {
    expect(interpolateDbText('Урон {{damage}}.', undefined, 5)).toBe(
      'Урон {{damage}}.',
    )
    expect(interpolateDbText('Урон {{damage}}.', {}, 5)).toBe('Урон {{damage}}.')
  })
})
