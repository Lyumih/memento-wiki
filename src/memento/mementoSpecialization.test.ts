import { describe, it, expect } from 'vitest'
import {
  BASE_MEMENTO_SPECIALIZATION,
  resolveMementoSpecialization,
  DEMO_SPECIALIZATION_PRESETS,
} from './mementoSpecialization'

describe('mementoSpecialization', () => {
  it('resolveMementoSpecialization: пустой объект даёт базу', () => {
    expect(resolveMementoSpecialization({})).toEqual(BASE_MEMENTO_SPECIALIZATION)
  })

  it('resolveMementoSpecialization: частичное перекрытие', () => {
    const r = resolveMementoSpecialization({
      modifierOfferCount: 5,
      firstModifierSlotLevel: 25,
    })
    expect(r.modifierOfferCount).toBe(5)
    expect(r.firstModifierSlotLevel).toBe(25)
    expect(r.modifierSlotStep).toBe(BASE_MEMENTO_SPECIALIZATION.modifierSlotStep)
    expect(r.levelUpBonusSteps).toBe(0)
  })

  it('DEMO_SPECIALIZATION_PRESETS содержит ключи из спеки §6', () => {
    expect(DEMO_SPECIALIZATION_PRESETS.base).toEqual({})
    expect(DEMO_SPECIALIZATION_PRESETS.wideChoice.modifierOfferCount).toBe(5)
    expect(DEMO_SPECIALIZATION_PRESETS.earlyMods.firstModifierSlotLevel).toBe(25)
    expect(DEMO_SPECIALIZATION_PRESETS.lucky.levelUpBonusSteps).toBe(1)
    expect(DEMO_SPECIALIZATION_PRESETS.oracle.previewNextModifierOffer).toBe(true)
  })
})
