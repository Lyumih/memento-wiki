export interface DbEntity {
  id: string
  game: string
  type: 'item' | 'skill' | 'modifier'
  name: string
  summary: string
  body?: string
}

export interface WikiDb {
  items: DbEntity[]
  skills: DbEntity[]
  modifiers: DbEntity[]
}
