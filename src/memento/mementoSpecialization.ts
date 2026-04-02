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

/** Порядок строк в сравнительной таблице и в селекте. */
export const DEMO_SPECIALIZATION_PRESET_ORDER = [
  'base',
  'wideChoice',
  'earlyMods',
  'lucky',
  'oracle',
] as const

export type DemoSpecializationPresetKey = (typeof DEMO_SPECIALIZATION_PRESET_ORDER)[number]

/** Человекочитаемые названия и короткое пояснение для вики. */
export const DEMO_SPECIALIZATION_PRESET_DISPLAY: Record<
  DemoSpecializationPresetKey,
  { title: string; summary: string }
> = {
  base: {
    title: 'База',
    summary:
      'Как в Gen без класса: оффер из трёх модификаторов, первый слот при L ≥ 75, шаг слотов 100, без бонуса к броску уровня.',
  },
  wideChoice: {
    title: 'Широкий выбор',
    summary: 'Больше вариантов при выборе модификатора в слот — пять карточек вместо трёх.',
  },
  earlyMods: {
    title: 'Ранние моды',
    summary: 'Первый слот модификатора открывается раньше — при L ≥ 25 (остальные пороги с тем же шагом 100).',
  },
  lucky: {
    title: 'Везение',
    summary:
      'Бонус к шансу броска уровня L (и Lm по тем же правилам): на один «шаг» эффективный уровень для формулы ниже, см. спеку §3.1.',
  },
  oracle: {
    title: 'Провидец',
    summary:
      'Игрок заранее видит состав следующего оффера модификаторов (сильный баланс-рычаг; в лаборатории ниже только флаг «да/нет»).',
  },
}
