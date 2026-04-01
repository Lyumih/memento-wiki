/**
 * v1: линейный рост от 1 при Lm=1 до 2 при Lm=100; для Lm>100 — медленный хвост для демо.
 * Финальная кривая — таблица баланса (спека §2.3).
 */
export function modifierPotencyMultiplier(lm: number): number {
  if (!Number.isInteger(lm) || lm < 1) {
    throw new RangeError('lm must be an integer >= 1')
  }
  if (lm <= 100) {
    return 1 + (lm - 1) / 99
  }
  return 2 + (lm - 100) / 100
}

export function modifierScaledPercent(basePercent: number, lm: number): number {
  return Math.round(basePercent * modifierPotencyMultiplier(lm))
}
