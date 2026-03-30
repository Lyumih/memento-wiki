/**
 * Вероятность и ожидания числа бросков для правила rollCardLevelUp (равномерный r ∈ 1…100).
 */

export const MILESTONES_LOW = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const
export const MILESTONES_HIGH = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const

export function cardLevelUpSuccessProbability(level: number): number {
  if (level < 1) return 1
  if (level > 100) return 0.01
  return (101 - level) / 100
}

export function expectedRollsForOneSuccess(level: number): number {
  return 1 / cardLevelUpSuccessProbability(level)
}

export function expectedRollsToReachLevel(startLevel: number, targetLevel: number): number {
  if (targetLevel <= startLevel) return 0
  let sum = 0
  for (let L = startLevel; L < targetLevel; L++) {
    sum += expectedRollsForOneSuccess(L)
  }
  return sum
}
