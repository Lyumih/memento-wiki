export type ModifierDefLike = { id: string; tags: string[] }

export function filterModifierPoolByTags(
  defs: ModifierDefLike[],
  requiredTags: string[],
): ModifierDefLike[] {
  if (requiredTags.length === 0) return defs.slice()
  return defs.filter((d) => requiredTags.every((t) => d.tags.includes(t)))
}

/**
 * Три (или count) случайных выбора с возвращением из пула.
 * randomIndex(n) возвращает целое в [0, n).
 */
export function pickModifierOffer<T>(
  pool: T[],
  count: number,
  randomIndex: (n: number) => number,
): T[] {
  if (pool.length === 0) {
    throw new Error('modifier pool is empty')
  }
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative integer')
  }
  const out: T[] = []
  for (let i = 0; i < count; i++) {
    out.push(pool[randomIndex(pool.length)]!)
  }
  return out
}
