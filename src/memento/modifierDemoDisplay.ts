import { modifierScaledPercent } from './modifierPotency'

/**
 * Демо-база в процентах для песочниц (к Lm = 100 ≈ ×2 по формуле v1).
 * В продукте значения задаются контентом, не этим маппингом.
 */
export const MODIFIER_DEMO_BASE: Record<string, { base: number; label: string }> = {
  'slot-double-strike': { base: 40, label: 'Шанс двойного удара' },
  'slot-triple-strike': { base: 15, label: 'Шанс тройного удара' },
  'slot-crit-chance': { base: 30, label: 'Шанс крита' },
  'slot-lifesteal': { base: 15, label: 'Вампиризм' },
  'slot-cooldown-reduction': { base: 20, label: 'Снижение перезарядки' },
  'slot-mana-cost': { base: 30, label: 'Снижение стоимости маны' },
}

export function modifierDemoValuesForId(modifierId: string, lm: number) {
  const row = MODIFIER_DEMO_BASE[modifierId] ?? { base: 25, label: 'Сила эффекта (демо)' }
  const safeLm = Math.max(1, lm)
  return {
    label: row.label,
    base: row.base,
    current: modifierScaledPercent(row.base, safeLm),
    at100: modifierScaledPercent(row.base, 100),
  }
}
