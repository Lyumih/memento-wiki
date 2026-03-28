export interface WikiNavEntry {
  title: string
  path: string
  order: number
  game?: string
}

export interface WikiNavDbLink {
  title: string
  path: string
}

export interface WikiNav {
  home: WikiNavEntry | null
  players: WikiNavEntry[]
  dev: WikiNavEntry[]
  games: WikiNavEntry[]
  db: WikiNavDbLink[]
}
