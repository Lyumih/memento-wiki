export type DbStatEntry = { base: number; perLevel: number }

export type DbStatsMap = Record<string, DbStatEntry>

export function statDisplayAtLevel(
  base: number,
  perLevel: number,
  level: number,
): number {
  return Math.floor(base + perLevel * level)
}

export function entityHasUsableStats(stats: DbStatsMap | undefined): boolean {
  return !!stats && Object.keys(stats).length > 0
}

/**
 * Подставляет {{name}} на целые значения после floor.
 * Незакрытый {{ или неизвестное имя: оставляет фрагмент как в исходной строке (сборка не должна такое пропускать).
 */
export function interpolateDbText(
  text: string,
  stats: DbStatsMap | undefined,
  level: number,
): string {
  if (!entityHasUsableStats(stats)) return text

  let i = 0
  let out = ''
  while (i < text.length) {
    const start = text.indexOf('{{', i)
    if (start === -1) {
      out += text.slice(i)
      break
    }
    out += text.slice(i, start)
    const end = text.indexOf('}}', start + 2)
    if (end === -1) {
      out += text.slice(start)
      break
    }
    const rawName = text.slice(start + 2, end)
    const def = stats![rawName]
    if (
      def &&
      typeof def.base === 'number' &&
      typeof def.perLevel === 'number'
    ) {
      out += String(statDisplayAtLevel(def.base, def.perLevel, level))
    } else {
      out += `{{${rawName}}}`
    }
    i = end + 2
  }
  return out
}
