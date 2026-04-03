import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import GithubSlugger from 'github-slugger'
import { pathFromContentFile } from './pathFromContentMdx.mjs'

export const MD_NAME = 'memento-wiki-export.md'
export const JSON_PUBLIC_NAME = 'memento-db.json'

/**
 * @param {object} opts
 * @param {string} opts.root
 * @param {string} opts.contentDir
 * @param {string[]} opts.mdxAbsPaths
 * @param {{ items: object[], skills: object[], modifiers: object[] }} opts.db
 */
export function buildWikiMarkdownBundle({ root, contentDir, mdxAbsPaths, db }) {
  const slugger = new GithubSlugger()

  const pages = mdxAbsPaths.map((abs) => {
    const rel = path.relative(contentDir, abs).split(path.sep).join('/')
    const raw = fs.readFileSync(abs, 'utf8')
    const { data, content } = matter(raw)
    const title = data.title
    if (!title) throw new Error(`Missing title in ${rel}`)
    const urlPath = pathFromContentFile(abs, contentDir)
    const order = typeof data.order === 'number' ? data.order : 999
    return { rel, title, urlPath, order, body: content.trimEnd() }
  })

  pages.sort((a, b) => {
    if (a.rel === 'index.mdx' && b.rel !== 'index.mdx') return -1
    if (b.rel === 'index.mdx' && a.rel !== 'index.mdx') return 1
    const top = (r) => r.split('/')[0]
    const g = (t) => (t === 'players' ? 1 : t === 'dev' ? 2 : t === 'games' ? 3 : 9)
    const ga = g(top(a.rel))
    const gb = g(top(b.rel))
    if (ga !== gb) return ga - gb
    if (a.order !== b.order) return a.order - b.order
    return a.rel.localeCompare(b.rel, 'ru', { sensitivity: 'base' })
  })

  const lines = [
    '# Memento Mori — экспорт вики (один файл)',
    '',
    'Этот файл генерируется при `npm run dev` / `npm run build` (prebuild). Полный каталог сущностей БД — в **`memento-db.json`** (скачать с сайта со страницы «Экспорт»).',
    '',
    'Фрагменты MDX с React-компонентами (`<... />`) в обычном предпросмотре Markdown отображаются как исходный текст.',
    '',
    '## Оглавление',
    '',
  ]

  const sectionHeadings = []
  for (const p of pages) {
    const hText = `${p.title} (\`${p.urlPath}\`)`
    const id = slugger.slug(hText)
    sectionHeadings.push({ hText, id, page: p })
    lines.push(`- [${hText}](#${id})`)
  }

  lines.push('', '---', '')

  for (const { hText, page } of sectionHeadings) {
    lines.push(`## ${hText}`, '')
    lines.push(`- **Файл в репозитории:** \`content/${page.rel}\``, '', page.body, '', '---', '')
  }

  lines.push(
    '## База данных (справка)',
    '',
    'Полный машиночитаемый каталог — файл **`memento-db.json`**. Коллекции: `items`, `skills`, `modifiers`. У каждой записи есть `id`, `name`, `game`, `type`, `summary`; опционально `body`, `stats`.',
    '',
  )

  const samples = pickDbSamples(db, 10)
  if (samples.length === 0) {
    lines.push('*В текущей сборке нет записей БД — только JSON-оболочка с пустыми массивами.*', '')
  } else {
    lines.push(
      'Ниже — примеры; любую запись найдите в JSON по `id` в соответствующей коллекции.',
      '',
    )
    for (const s of samples) {
      lines.push(`### \`${s.collection}\` · \`${s.rec.id}\` — ${s.rec.name}`, '')
      lines.push('```json')
      lines.push(JSON.stringify(s.rec, null, 2))
      lines.push('```', '')
    }
  }

  const md = lines.join('\n')

  const genDir = path.join(root, 'src', 'generated')
  const publicDir = path.join(root, 'public')
  fs.mkdirSync(genDir, { recursive: true })
  fs.mkdirSync(publicDir, { recursive: true })

  fs.writeFileSync(path.join(genDir, MD_NAME), md, 'utf8')
  fs.writeFileSync(path.join(publicDir, MD_NAME), md, 'utf8')
}

/**
 * @param {{ items: object[], skills: object[], modifiers: object[] }} db
 */
function pickDbSamples(db, max) {
  const kinds = [
    { key: 'items', list: db.items ?? [] },
    { key: 'skills', list: db.skills ?? [] },
    { key: 'modifiers', list: db.modifiers ?? [] },
  ]
  const out = []
  let round = 0
  while (out.length < max) {
    let added = false
    for (const { key, list } of kinds) {
      if (out.length >= max) break
      if (round < list.length) {
        out.push({ collection: key, rec: list[round] })
        added = true
      }
    }
    if (!added) break
    round += 1
  }
  return out
}
