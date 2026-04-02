/**
 * Порог уровня карты L, начиная с которого доступен слот модификатора с индексом k (k = 0, 1, 2, …).
 * Спека: docs/superpowers/specs/2026-04-01-memento-modifiers-design.md §2.2
 */

import {
  BASE_MEMENTO_SPECIALIZATION,
  type ResolvedMementoSpecialization,
} from './mementoSpecialization'

function assertValidEff(eff: ResolvedMementoSpecialization): void {
  const { firstModifierSlotLevel, modifierSlotStep } = eff
  if (
    !Number.isInteger(firstModifierSlotLevel) ||
    firstModifierSlotLevel < 1
  ) {
    throw new RangeError('firstModifierSlotLevel must be an integer >= 1')
  }
  if (!Number.isInteger(modifierSlotStep) || modifierSlotStep < 1) {
    throw new RangeError('modifierSlotStep must be an integer >= 1')
  }
}

export function modifierSlotUnlockLevel(
  slotIndex: number,
  eff: ResolvedMementoSpecialization = BASE_MEMENTO_SPECIALIZATION,
): number {
  assertValidEff(eff)
  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    throw new RangeError('slotIndex must be a non-negative integer')
  }
  const { firstModifierSlotLevel, modifierSlotStep } = eff
  return firstModifierSlotLevel + modifierSlotStep * slotIndex
}

export function modifierUnlockedSlotCount(
  cardLevel: number,
  eff: ResolvedMementoSpecialization = BASE_MEMENTO_SPECIALIZATION,
): number {
  assertValidEff(eff)
  const { firstModifierSlotLevel, modifierSlotStep } = eff
  if (cardLevel < firstModifierSlotLevel) return 0
  return (
    Math.floor((cardLevel - firstModifierSlotLevel) / modifierSlotStep) + 1
  )
}

export function isModifierSlotUnlocked(
  cardLevel: number,
  slotIndex: number,
  eff: ResolvedMementoSpecialization = BASE_MEMENTO_SPECIALIZATION,
): boolean {
  assertValidEff(eff)
  if (slotIndex < 0) return false
  return cardLevel >= modifierSlotUnlockLevel(slotIndex, eff)
}
