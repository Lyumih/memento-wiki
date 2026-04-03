import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { scanMdxNav, collectMdxBodiesForLinks } from './lib/scanMdxNav.mjs'
import { buildDb } from './lib/buildDb.mjs'
import { checkLinks } from './lib/checkLinks.mjs'
import { pathFromContentFile } from './lib/pathFromContentMdx.mjs'
import {
  buildWikiMarkdownBundle,
  JSON_PUBLIC_NAME,
} from './lib/buildWikiMarkdownBundle.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const contentDir = path.join(root, 'content')

async function main() {
  const { nav, mdxFiles } = await scanMdxNav()
  const db = await buildDb()

  const knownPaths = new Set(['/'])
  if (nav.home) knownPaths.add(nav.home.path)

  for (const list of [nav.players, nav.dev, nav.games, nav.db]) {
    for (const item of list) {
      knownPaths.add(item.path.replace(/\/$/, '') || '/')
    }
  }

  for (const abs of mdxFiles) {
    const p = pathFromContentFile(abs, contentDir).replace(/\/$/, '') || '/'
    knownPaths.add(p)
  }

  for (const kind of ['items', 'skills', 'modifiers']) {
    const list = db[kind]
    const seg = kind === 'modifiers' ? 'mods' : kind
    knownPaths.add(`/db/${seg}`)
    for (const row of list) {
      knownPaths.add(`/db/${seg}/${row.id}`.replace(/\/$/, '') || '/')
    }
  }

  const linkFiles = collectMdxBodiesForLinks(contentDir, mdxFiles)

  checkLinks({ knownPaths, files: linkFiles })

  // Ensure placeholder if no db entries
  if (!fs.existsSync(path.join(root, 'src', 'generated', 'db.json'))) {
    throw new Error('db.json missing after buildDb')
  }

  const dbPath = path.join(root, 'src', 'generated', 'db.json')
  buildWikiMarkdownBundle({
    root,
    contentDir,
    mdxAbsPaths: mdxFiles,
    db,
  })
  fs.copyFileSync(dbPath, path.join(root, 'public', JSON_PUBLIC_NAME))

  console.log('prebuild: nav.json + db.json + wiki export OK')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
