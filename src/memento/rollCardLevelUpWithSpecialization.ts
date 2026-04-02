import { rollCardLevelUp } from './rollCardLevelUp'

/**
 * Бросок повышения уровня с учётом levelUpBonusSteps (§3.1 спеки specialization).
 */
export function rollCardLevelUpWithSpecialization(
  currentLevel: number,
  randomInt1to100: number,
  levelUpBonusSteps: number,
): boolean {
  if (!Number.isInteger(levelUpBonusSteps) || levelUpBonusSteps < 0) {
    throw new RangeError('levelUpBonusSteps must be a non-negative integer')
  }
  if (currentLevel > 100) {
    return rollCardLevelUp(currentLevel, randomInt1to100)
  }
  const L_eff = Math.max(1, currentLevel - levelUpBonusSteps)
  return rollCardLevelUp(L_eff, randomInt1to100)
}
