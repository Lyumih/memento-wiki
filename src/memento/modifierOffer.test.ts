import { describe, it, expect } from 'vitest'
import {
  type ModifierDefLike,
  filterModifierPoolByTags,
  pickModifierOffer,
} from './modifierOffer'

describe('modifierOffer', () => {
  const defs: ModifierDefLike[] = [
    { id: 'a', tags: ['melee', 'attack'] },
    { id: 'b', tags: ['melee'] },
    { id: 'c', tags: ['spell'] },
  ]

  it('filterModifierPoolByTags: empty required -> all', () => {
    expect(filterModifierPoolByTags(defs, []).map((d) => d.id)).toEqual(['a', 'b', 'c'])
  })

  it('filterModifierPoolByTags: melee -> a,b', () => {
    expect(filterModifierPoolByTags(defs, ['melee']).map((d) => d.id)).toEqual(['a', 'b'])
  })

  it('filterModifierPoolByTags: melee+attack -> a', () => {
    expect(filterModifierPoolByTags(defs, ['melee', 'attack']).map((d) => d.id)).toEqual(['a'])
  })

  it('pickModifierOffer: deterministic duplicates', () => {
    const pool = [{ id: 'x' }, { id: 'y' }]
    const indices = [0, 0, 1]
    let i = 0
    const rng = (len: number) => {
      expect(len).toBe(pool.length)
      return indices[i++]!
    }
    const offer = pickModifierOffer(pool, 3, rng)
    expect(offer.map((o) => o.id)).toEqual(['x', 'x', 'y'])
  })

  it('pickModifierOffer: empty pool throws', () => {
    expect(() => pickModifierOffer([], 3, () => 0)).toThrow(/empty/i)
  })
})
