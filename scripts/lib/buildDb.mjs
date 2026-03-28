import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'
import yaml from 'js-yaml'
import * as z from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..', '..')
const outDir = path.join(root, 'src', 'generated')

const entitySchema = z.object({
  id: z.string(),
  game: z.string(),
  type: z.enum(['item', 'skill', 'modifier']),
  name: z.string(),
  summary: z.string(),
  body: z.string().optional(),
})

const folders = [
  { dir: 'items', key: 'items', type: 'item' },
  { dir: 'skills', key: 'skills', type: 'skill' },
  { dir: 'mods', key: 'modifiers', type: 'modifier' },
]

/** fast-glob expects forward slashes in patterns (Windows path.join breaks globs). */
function toGlobPattern(p) {
  return p.split(path.sep).join('/')
}

export async function buildDb() {
  fs.mkdirSync(outDir, { recursive: true })

  const maps = {
    items: {},
    skills: {},
    modifiers: {},
  }

  async function loadDir(sub, expectedType, key) {
    const base = path.join(root, 'content', 'db', sub)
    const generated = path.join(base, 'generated')
    const patterns = [
      toGlobPattern(path.join(base, '*.yaml')),
      toGlobPattern(path.join(base, '*.yml')),
      toGlobPattern(path.join(generated, '*.yaml')),
      toGlobPattern(path.join(generated, '*.yml')),
    ]
    const files = await fg(patterns, { absolute: true, onlyFiles: true })
    const manual = files.filter((f) => !f.includes(`${path.sep}generated${path.sep}`))
    const genFiles = files.filter((f) => f.includes(`${path.sep}generated${path.sep}`))

    const applyFile = (abs) => {
      const raw = fs.readFileSync(abs, 'utf8')
      const data = yaml.load(raw)
      const parsed = entitySchema.safeParse(data)
      if (!parsed.success) {
        throw new Error(`${abs}: ${parsed.error.message}`)
      }
      const rec = parsed.data
      if (rec.type !== expectedType) {
        throw new Error(`${abs}: type ${rec.type} does not match folder ${sub}`)
      }
      maps[key][rec.id] = rec
    }

    for (const f of manual) applyFile(f)
    for (const f of genFiles) applyFile(f)
  }

  for (const { dir, key, type } of folders) {
    await loadDir(dir, type, key)
  }

  const db = {
    items: Object.values(maps.items),
    skills: Object.values(maps.skills),
    modifiers: Object.values(maps.modifiers),
  }

  for (const list of Object.values(db)) {
    list.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }

  fs.writeFileSync(path.join(outDir, 'db.json'), JSON.stringify(db, null, 2), 'utf8')
  return db
}
