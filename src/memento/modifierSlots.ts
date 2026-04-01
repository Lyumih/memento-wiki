/**
 * Порог уровня карты L, начиная с которого доступен слот модификатора с индексом k (k = 0, 1, 2, …).
 * Спека: docs/superpowers/specs/2026-04-01-memento-modifiers-design.md §2.2
 */
export function modifierSlotUnlockLevel(slotIndex: number): number {
  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    throw new RangeError('slotIndex must be a non-negative integer')
  }
  return 75 + 100 * slotIndex
}

/** Число слотов, уже открытых при текущем L (0, если L < 75). */
export function modifierUnlockedSlotCount(cardLevel: number): number {
  if (cardLevel < 75) return 0
  return Math.floor((cardLevel - 75) / 100) + 1
}

export function isModifierSlotUnlocked(cardLevel: number, slotIndex: number): boolean {
  if (slotIndex < 0) return false
  return cardLevel >= modifierSlotUnlockLevel(slotIndex)
}
