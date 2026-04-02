/**
 * Спека: docs/superpowers/specs/2026-04-02-memento-specialization-design.md §3
 */

export type MementoSpecializationPreset = {
  levelUpBonusSteps?: number
  modifierOfferCount?: number
  firstModifierSlotLevel?: number
  modifierSlotStep?: number
  previewNextModifierOffer?: boolean
}

export type ResolvedMementoSpecialization = Required<MementoSpecializationPreset>

export const BASE_MEMENTO_SPECIALIZATION: ResolvedMementoSpecialization = {
  levelUpBonusSteps: 0,
  modifierOfferCount: 3,
  firstModifierSlotLevel: 75,
  modifierSlotStep: 100,
  previewNextModifierOffer: false,
}

export function resolveMementoSpecialization(
  preset: MementoSpecializationPreset = {},
): ResolvedMementoSpecialization {
  return { ...BASE_MEMENTO_SPECIALIZATION, ...preset }
}

/** Иллюстративные пресеты — таблица §6 спеки (имена рабочие). */
export const DEMO_SPECIALIZATION_PRESETS: Record<string, MementoSpecializationPreset> =
  {
    base: {},
    wideChoice: { modifierOfferCount: 5 },
    earlyMods: { firstModifierSlotLevel: 25 },
    lucky: { levelUpBonusSteps: 1 },
    oracle: { previewNextModifierOffer: true },
  }
