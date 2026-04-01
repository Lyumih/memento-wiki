import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'
import yaml from 'js-yaml'
import * as z from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..', '..')
const outDir = path.join(root, 'src', 'generated')

const statEntrySchema = z.object({
  base: z.number(),
  perLevel: z.number(),
})

const entitySchema = z.object({
  id: z.string(),
  game: z.string(),
  type: z.enum(['item', 'skill', 'modifier']),
  name: z.string(),
  summary: z.string(),
  body: z.string().optional(),
  stats: z.record(z.string(), statEntrySchema).optional(),
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

/** Keep placeholder scan rules in sync with src/lib/dbEntityLevelText.ts */
function collectTemplatePlaceholders(text) {
  const names = []
  let i = 0
  while (i < text.length) {
    const start = text.indexOf('{{', i)
    if (start === -1) break
    const end = text.indexOf('}}', start + 2)
    if (end === -1) {
      throw new Error(`unclosed "{{" in template`)
    }
    const inner = text.slice(start + 2, end)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(inner)) {
      throw new Error(`invalid placeholder {{${inner}}}`)
    }
    names.push(inner)
    i = end + 2
  }
  return names
}

function validateEntityTemplates(rec, absPath) {
  const fields = [
    ['summary', rec.summary],
    ...(rec.body ? [['body', rec.body]] : []),
  ]
  const used = new Set()
  for (const [fieldName, value] of fields) {
    let fieldPlaceholders
    try {
      fieldPlaceholders = collectTemplatePlaceholders(value)
    } catch (e) {
      throw new Error(`${absPath}: ${fieldName}: ${e.message}`)
    }
    for (const name of fieldPlaceholders) {
      used.add(name)
      if (!rec.stats || rec.stats[name] === undefined) {
        throw new Error(
          `${absPath}: placeholder {{${name}}} in ${fieldName} has no matching stats entry`,
        )
      }
    }
  }
  if (rec.stats) {
    for (const key of Object.keys(rec.stats)) {
      if (!used.has(key)) {
        console.warn(
          `${absPath}: stats key "${key}" is never used in summary/body`,
        )
      }
    }
  }
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
      let rec = parsed.data
      if (rec.type !== expectedType) {
        throw new Error(`${abs}: type ${rec.type} does not match folder ${sub}`)
      }
      if (rec.stats && Object.keys(rec.stats).length === 0) {
        const { stats: _omit, ...rest } = rec
        rec = rest
      }
      validateEntityTemplates(rec, abs)
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
