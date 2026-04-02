import { describe, it, expect } from 'vitest'
import {
  modifierSlotUnlockLevel,
  modifierUnlockedSlotCount,
  isModifierSlotUnlocked,
} from './modifierSlots'
import { resolveMementoSpecialization } from './mementoSpecialization'

describe('modifierSlots', () => {
  it('modifierSlotUnlockLevel: k=0 -> 75, k=1 -> 175', () => {
    expect(modifierSlotUnlockLevel(0)).toBe(75)
    expect(modifierSlotUnlockLevel(1)).toBe(175)
    expect(modifierSlotUnlockLevel(2)).toBe(275)
    expect(modifierSlotUnlockLevel(3)).toBe(375)
  })

  it('modifierUnlockedSlotCount', () => {
    expect(modifierUnlockedSlotCount(74)).toBe(0)
    expect(modifierUnlockedSlotCount(75)).toBe(1)
    expect(modifierUnlockedSlotCount(174)).toBe(1)
    expect(modifierUnlockedSlotCount(175)).toBe(2)
    expect(modifierUnlockedSlotCount(275)).toBe(3)
    expect(modifierUnlockedSlotCount(374)).toBe(3)
    expect(modifierUnlockedSlotCount(375)).toBe(4)
  })

  it('isModifierSlotUnlocked', () => {
    expect(isModifierSlotUnlocked(100, 0)).toBe(true)
    expect(isModifierSlotUnlocked(100, 1)).toBe(false)
    expect(isModifierSlotUnlocked(175, 1)).toBe(true)
    expect(isModifierSlotUnlocked(374, 3)).toBe(false)
    expect(isModifierSlotUnlocked(375, 3)).toBe(true)
  })
})

describe('modifierSlots with specialization (first=25, step=100)', () => {
  const eff = resolveMementoSpecialization({
    firstModifierSlotLevel: 25,
    modifierSlotStep: 100,
  })

  it('modifierSlotUnlockLevel', () => {
    expect(modifierSlotUnlockLevel(0, eff)).toBe(25)
    expect(modifierSlotUnlockLevel(1, eff)).toBe(125)
    expect(modifierSlotUnlockLevel(2, eff)).toBe(225)
  })

  it('modifierUnlockedSlotCount', () => {
    expect(modifierUnlockedSlotCount(24, eff)).toBe(0)
    expect(modifierUnlockedSlotCount(25, eff)).toBe(1)
    expect(modifierUnlockedSlotCount(124, eff)).toBe(1)
    expect(modifierUnlockedSlotCount(125, eff)).toBe(2)
  })
})
