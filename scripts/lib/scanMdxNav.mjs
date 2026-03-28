import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'
import matter from 'gray-matter'
import { pathFromContentFile } from './pathFromContentMdx.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..', '..')
const contentDir = path.join(root, 'content')
const outDir = path.join(root, 'src', 'generated')

export async function scanMdxNav() {
  fs.mkdirSync(outDir, { recursive: true })

  const files = await fg('**/*.mdx', {
    cwd: contentDir,
    absolute: true,
    onlyFiles: true,
  })

  /** @type {{ title: string, path: string, order: number, game?: string }[]} */
  const players = []
  /** @type {{ title: string, path: string, order: number, game?: string }[]} */
  const dev = []
  /** @type {{ title: string, path: string, order: number, game?: string }[]} */
  const games = []

  /** @type {{ title: string, path: string, order: number, game?: string } | null} */
  let home = null

  const addEntry = (arr, entry) => {
    arr.push(entry)
  }

  for (const abs of files) {
    const relToContent = path.relative(contentDir, abs).split(path.sep).join('/')
    if (relToContent.startsWith('db/')) continue

    const raw = fs.readFileSync(abs, 'utf8')
    const { data, content } = matter(raw)
    const title = data.title
    const audience = data.audience
    const order = typeof data.order === 'number' ? data.order : 999
    const game = data.game

    if (!title || !audience) {
      throw new Error(`Missing title or audience in ${relToContent}`)
    }

    const urlPath = pathFromContentFile(abs, contentDir)
    const entry = { title, path: urlPath, order, ...(game ? { game } : {}) }

    if (relToContent === 'index.mdx') {
      home = entry
      // Главная уже отдельным пунктом меню; не дублировать path "/" в подменю (уникальные key в Ant Menu).
      continue
    }

    const top = relToContent.split('/')[0]
    if (top === 'players') {
      addEntry(players, entry)
      if (audience === 'both') addEntry(dev, { ...entry })
    } else if (top === 'dev') {
      addEntry(dev, entry)
      if (audience === 'both') addEntry(players, { ...entry })
    } else if (top === 'games') {
      addEntry(games, entry)
    }
  }

  const sortNav = (a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ru')
  players.sort(sortNav)
  dev.sort(sortNav)
  games.sort(sortNav)

  const nav = {
    home,
    players,
    dev,
    games,
    db: [
      { title: 'Предметы', path: '/db/items' },
      { title: 'Умения', path: '/db/skills' },
      { title: 'Модификаторы', path: '/db/mods' },
    ],
  }

  fs.writeFileSync(path.join(outDir, 'nav.json'), JSON.stringify(nav, null, 2), 'utf8')

  const mdxFiles = files.filter((f) => {
    const rel = path.relative(contentDir, f).split(path.sep).join('/')
    return !rel.startsWith('db/')
  })
  return { nav, mdxFiles }
}

export function collectMdxBodiesForLinks(contentDir, mdxAbsPaths) {
  return mdxAbsPaths.map((abs) => {
    const raw = fs.readFileSync(abs, 'utf8')
    const { content } = matter(raw)
    const rel = path.relative(contentDir, abs).split(path.sep).join('/')
    return { path: rel, text: content }
  })
}
