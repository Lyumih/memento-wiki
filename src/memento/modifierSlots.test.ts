import { describe, it, expect } from 'vitest'
import {
  modifierSlotUnlockLevel,
  modifierUnlockedSlotCount,
  isModifierSlotUnlocked,
} from './modifierSlots'

describe('modifierSlots', () => {
  it('modifierSlotUnlockLevel: k=0 -> 75, k=1 -> 175', () => {
    expect(modifierSlotUnlockLevel(0)).toBe(75)
    expect(modifierSlotUnlockLevel(1)).toBe(175)
    expect(modifierSlotUnlockLevel(2)).toBe(275)
  })

  it('modifierUnlockedSlotCount', () => {
    expect(modifierUnlockedSlotCount(74)).toBe(0)
    expect(modifierUnlockedSlotCount(75)).toBe(1)
    expect(modifierUnlockedSlotCount(174)).toBe(1)
    expect(modifierUnlockedSlotCount(175)).toBe(2)
    expect(modifierUnlockedSlotCount(275)).toBe(3)
  })

  it('isModifierSlotUnlocked', () => {
    expect(isModifierSlotUnlocked(100, 0)).toBe(true)
    expect(isModifierSlotUnlocked(100, 1)).toBe(false)
    expect(isModifierSlotUnlocked(175, 1)).toBe(true)
  })
})
