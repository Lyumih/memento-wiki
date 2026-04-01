export interface DbStatEntry {
  base: number
  perLevel: number
}

export interface DbEntity {
  id: string
  game: string
  type: 'item' | 'skill' | 'modifier'
  name: string
  summary: string
  body?: string
  /** Числовые параметры для подстановки {{name}} в summary/body (опционально). */
  stats?: Record<string, DbStatEntry>
}

export interface WikiDb {
  items: DbEntity[]
  skills: DbEntity[]
  modifiers: DbEntity[]
}
