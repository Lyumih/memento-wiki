import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildWikiMarkdownBundle } from './buildWikiMarkdownBundle.mjs'

describe('buildWikiMarkdownBundle', () => {
  it('puts index first and includes TOC plus DB section', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-export-'))
    const contentDir = path.join(tmp, 'content')
    fs.mkdirSync(path.join(contentDir, 'dev'), { recursive: true })
    fs.writeFileSync(
      path.join(contentDir, 'index.mdx'),
      '---\ntitle: Home\naudience: both\n---\n\nHome body.',
      'utf8',
    )
    fs.writeFileSync(
      path.join(contentDir, 'dev', 'a.mdx'),
      '---\ntitle: Dev A\naudience: dev\norder: 1\n---\n\nA body.',
      'utf8',
    )

    const mdxAbsPaths = [
      path.join(contentDir, 'dev', 'a.mdx'),
      path.join(contentDir, 'index.mdx'),
    ]

    const db = { items: [], skills: [], modifiers: [] }

    buildWikiMarkdownBundle({
      root: tmp,
      contentDir,
      mdxAbsPaths,
      db,
    })

    const md = fs.readFileSync(path.join(tmp, 'src', 'generated', 'memento-wiki-export.md'), 'utf8')
    assert.match(md, /^# Memento Mori/m)
    assert.match(md, /## Оглавление/)
    const homeHeading = '## Home (`/`)'
    const devHeading = '## Dev A (`/dev/a`)'
    const idx = md.indexOf(homeHeading)
    const devIdx = md.indexOf(devHeading)
    assert.ok(idx !== -1 && devIdx !== -1 && idx < devIdx, 'index section before dev section')
    assert.match(md, /## База данных/)
  })
})
