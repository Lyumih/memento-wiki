# Wiki AI export — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Автоматически собирать `memento-wiki-export.md` и `memento-db.json` в `public/` (и дубликат `.md` в `src/generated/` для бандла), добавить страницу `/export` с предпросмотром Markdown и ссылками на скачивание, плюс ссылку «Экспорт» в шапке.

**Architecture:** Расширение `scripts/prebuild.mjs`: после `checkLinks` вызывается новый модуль, который читает те же MDX, что и навигация (без `content/db/**`), сортирует секции как в спеке, строит оглавление с якорями через `github-slugger` (тот же алгоритм, что у `rehype-slug` на странице). В конец файла добавляется раздел про БД: текстовое описание + до 10 коротких примеров с полями `id` и коллекция. `db.json` копируется в `public/memento-db.json`. Страница `/export` импортирует сгенерированный `.md` через `?raw` и рендерит через `react-markdown` + `remark-gfm` + `rehype-slug`.

**Tech Stack:** Node ESM (`gray-matter`, `fast-glob` уже есть), `github-slugger` (dev), React 19, `react-markdown`, `remark-gfm`, `rehype-slug`, Ant Design (как в остальном приложении).

**Спека:** `docs/superpowers/specs/2026-04-03-wiki-ai-export-design.md`

---

## Карта файлов

| Путь | Назначение |
|------|------------|
| `scripts/lib/buildWikiMarkdownBundle.mjs` | Сборка текста экспорта: сортировка MDX, TOC+якоря, секции статей, приложение с примерами БД. |
| `scripts/lib/buildWikiMarkdownBundle.test.mjs` | `node:test`: порядок секций, наличие H1/оглавления, согласованность slug. |
| `scripts/prebuild.mjs` | Вызов сборки экспорта + `copyFile` JSON/запись `public/*.md`. |
| `package.json` | Зависимости и скрипт `test:export` (опционально). |
| `src/pages/WikiExportPage.tsx` | UI: описание, предпросмотр, кнопки скачивания. |
| `src/app/router.tsx` | Маршрут `export` → `WikiExportPage`. |
| `src/app/WikiLayout.tsx` | Ссылка «Экспорт» на `/export` (вне горизонтального `Menu` из `nav.json`). |
| `README.md` | Кратко: имена артефактов, что prebuild кладёт файлы в `public/`. |

После первого успешного prebuild появятся (и должны быть в `.gitignore` там, где уже игнорятся generated): `src/generated/memento-wiki-export.md`. Файлы в `public/` **коммитятся** только если в проекте принято коммитить `public/` — сейчас там `favicon.svg`; **сгенерированные** `memento-wiki-export.md` и `memento-db.json` лучше **не** коммитить: генерировать при CI/`npm run build`. Добавьте в `.gitignore`:

```
public/memento-wiki-export.md
public/memento-db.json
```

(Если предпочитаете коммитить статику для Pages без prebuild на CI — уберите эти строки и документируйте в README; по умолчанию план = игнор + всегда prebuild перед dev/build.)

---

### Task 1: Зависимости

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Установить пакеты**

```bash
cd c:/sites/gen-memento-docs
npm install react-markdown remark-gfm rehype-slug
npm install -D github-slugger
```

- [ ] **Step 2: (Опционально) скрипт для тестов экспорта**

В `package.json` → `scripts`:

```json
"test:export": "node --test scripts/lib/buildWikiMarkdownBundle.test.mjs"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add deps for wiki export preview and slug TOC"
```

---

### Task 2: Модуль сборки Markdown-экспорта

**Files:**
- Create: `scripts/lib/buildWikiMarkdownBundle.mjs`
- Modify: `.gitignore` (строки для `public/memento-*.md` и `public/memento-db.json` при необходимости)
- Modify: `.gitignore` — добавить `src/generated/memento-wiki-export.md` если папка `src/generated/*.json` уже игнорится — дополнить паттерном или явной строкой

Проверьте текущий `.gitignore`: если уже есть `src/generated/` целиком, отдельная строка для `.md` не нужна.

- [ ] **Step 1: Реализовать `buildWikiMarkdownBundle.mjs`**

Полный файл (один модуль, экспорт одной функции для prebuild):

```javascript
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import GithubSlugger from 'github-slugger'
import { pathFromContentFile } from './pathFromContentMdx.mjs'

const MD_NAME = 'memento-wiki-export.md'
const JSON_PUBLIC_NAME = 'memento-db.json'

/**
 * @param {object} opts
 * @param {string} opts.root репозиторий
 * @param {string} opts.contentDir path.join(root, 'content')
 * @param {string[]} opts.mdxAbsPaths абсолютные пути к .mdx (как `mdxFiles` из scanMdxNav)
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

  lines.push('## База данных (справка)', '', 'Полный машиночитаемый каталог — файл **`memento-db.json`**. Коллекции: `items`, `skills`, `modifiers`. У каждой записи есть `id`, `name`, `game`, `type`, `summary`; опционально `body`, `stats`.', '')

  const samples = pickDbSamples(db, 10)
  if (samples.length === 0) {
    lines.push('*В текущей сборке нет записей БД — только JSON-оболочка с пустыми массивами.*', '')
  } else {
    lines.push('Ниже — примеры; любую запись найдите в JSON по `id` в соответствующей коллекции.', '')
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
 * До 10 записей, равномерно по видам (items, skills, modifiers).
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

export { MD_NAME, JSON_PUBLIC_NAME }
```

**Якоря:** в файле только `## ${hText}` (без сырого HTML — `react-markdown` по умолчанию его не исполняет). Оглавление и `rehype-slug` на странице `/export` должны давать одинаковые id для одной и той же строки заголовка; при расхождении на конкретном заголовке поправить форму `hText` или зафиксировать ожидаемый slug в тесте.

- [ ] **Step 2: Запуск вручную из Node REPL / одноразовый скрипт**

```bash
node -e "import('./scripts/lib/buildWikiMarkdownBundle.mjs').then(()=>console.log('ok'))"
```

Сначала подключите функцию из временного фрагмента prebuild или вызовите после копирования файла — до Task 3 полный вызов из prebuild.

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/buildWikiMarkdownBundle.mjs .gitignore
git commit -m "feat(scripts): generate memento-wiki-export.md for public and generated"
```

---

### Task 3: Интеграция в prebuild и копирование JSON

**Files:**
- Modify: `scripts/prebuild.mjs`

- [ ] **Step 1: Импорт и вызов после `checkLinks`**

В конец `main()` перед финальным `console.log`, когда `db` уже есть:

```javascript
import { buildWikiMarkdownBundle, JSON_PUBLIC_NAME } from './lib/buildWikiMarkdownBundle.mjs'
```

После `checkLinks(...)`:

```javascript
  const dbPath = path.join(root, 'src', 'generated', 'db.json')
  buildWikiMarkdownBundle({
    root,
    contentDir,
    mdxAbsPaths: mdxFiles,
    db,
  })
  fs.copyFileSync(dbPath, path.join(root, 'public', JSON_PUBLIC_NAME))
```

Переменная `db` уже возвращается из `await buildDb()` — используйте её, не читайте JSON с диска для содержимого экспорта.

- [ ] **Step 2: Запустить prebuild**

```bash
npm run build
```

Ожидается: `public/memento-wiki-export.md`, `public/memento-db.json`, `src/generated/memento-wiki-export.md` существуют.

- [ ] **Step 3: Commit**

```bash
git add scripts/prebuild.mjs
git commit -m "feat(scripts): wire wiki export and public db copy into prebuild"
```

---

### Task 4: Тесты модуля экспорта

**Files:**
- Create: `scripts/lib/buildWikiMarkdownBundle.test.mjs`

- [ ] **Step 1: Добавить тесты**

```javascript
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
```

- [ ] **Step 2: Запуск**

```bash
npm run test:export
```

Ожидается: выход без ошибок.

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/buildWikiMarkdownBundle.test.mjs package.json
git commit -m "test: add node:test for wiki markdown export bundle"
```

---

### Task 5: Страница `/export` и навигация

**Files:**
- Create: `src/pages/WikiExportPage.tsx`
- Modify: `src/app/router.tsx`
- Modify: `src/app/WikiLayout.tsx`

- [ ] **Step 1: `WikiExportPage.tsx`**

```tsx
import { Alert, Button, Space, Typography } from 'antd'
import rehypeSlug from 'rehype-slug'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import wikiMd from '../../generated/memento-wiki-export.md?raw'

const MD_HREF = '/memento-wiki-export.md'
const JSON_HREF = '/memento-db.json'

export default function WikiExportPage() {
  const markdown = wikiMd as string

  const rehypePlugins = useMemo(() => [rehypeSlug], [])

  return (
    <div>
      <Typography.Title level={2}>Экспорт вики</Typography.Title>
      <Typography.Paragraph>
        Один файл со всеми статьями (Markdown) и полный снимок каталога БД (JSON). Удобно для ИИ, архива и предпросмотра в IDE.
      </Typography.Paragraph>
      <Alert
        type="info"
        showIcon
        message="Большие файлы"
        description="Предпросмотр ниже может загружаться заметно долго на слабых устройствах. При необходимости скачайте `.md` и откройте локально."
        style={{ marginBottom: 16 }}
      />
      <Space wrap style={{ marginBottom: 24 }}>
        <Button type="primary" href={MD_HREF} download="memento-wiki-export.md">
          Скачать memento-wiki-export.md
        </Button>
        <Button href={JSON_HREF} download="memento-db.json">
          Скачать memento-db.json
        </Button>
      </Space>
      <Typography.Title level={4}>Предпросмотр</Typography.Title>
      <article
        className="wiki-export-preview"
        style={{
          border: '1px solid var(--ant-color-border-secondary, #f0f0f0)',
          borderRadius: 8,
          padding: 16,
          maxHeight: '70vh',
          overflow: 'auto',
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={rehypePlugins}>
          {markdown}
        </ReactMarkdown>
      </article>
    </div>
  )
}
```

Ant Design `Button` с `href` рендерит `<a>`; атрибут `download` поддерживается. Если TypeScript ругается на `download`, приведите тип или используйте `<a className="ant-btn ant-btn-primary">`.

- [ ] **Step 2: Маршрут в `router.tsx`**

Импорт:

```tsx
import WikiExportPage from '@/pages/WikiExportPage'
```

В `children` массива до `'*'`:

```tsx
{ path: 'export', element: <WikiExportPage /> },
```

- [ ] **Step 3: Ссылка в `WikiLayout.tsx`**

Внутри flex-контейнера шапки (рядом с `Menu`), после блока с `Menu` или перед ним — `Link` из `react-router-dom`:

```tsx
<Link to="/export" style={{ flexShrink: 0, whiteSpace: 'nowrap', color: 'inherit' }}>
  Экспорт
</Link>
```

Не добавлять в `buildMenuItems`.

- [ ] **Step 4: Сборка и smoke**

```bash
npm run build
npm run preview
```

Открыть `/export`: текст предпросмотра виден; клики по скачиванию отдают файлы.

- [ ] **Step 5: Commit**

```bash
git add src/pages/WikiExportPage.tsx src/app/router.tsx src/app/WikiLayout.tsx
git commit -m "feat: add /export page with markdown preview and download links"
```

---

### Task 6: Документация и проверка деплоя

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Параграф в README** (раздел «Разработка» или новый подраздел «Экспорт»)

Указать:

- prebuild создаёт `public/memento-wiki-export.md` и `public/memento-db.json`;
- страница `/export` на сайте;
- для Vercel статические файлы из `public/` отдаются до SPA-fallback — при сомнении проверить `GET /memento-wiki-export.md` после деплоя (не `index.html`).

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document wiki export artifacts and /export page"
```

---

## Самопроверка плана по спеке

| Раздел спеки | Задачи |
|--------------|--------|
| Цели (md + json + сайт) | Task 2–3, 5 |
| Имена файлов | Константы в модуле + README |
| Источник MDX, порядок, формат заголовков | Task 2 |
| Вступление, оглавление, якоря | Task 2 + rehype-slug Task 5 |
| Блок БД ~10 примеров | `pickDbSamples` Task 2 |
| `/export`, превью, скачать, ссылка в шапке | Task 5 |
| Prebuild | Task 3 |
| Статика на хостинге | Task 6 + ручная проверка |
| Тестирование (скрипт) | Task 4 |

**Placeholder scan:** нет TBD/TODO в шагах.

**Согласованность:** `WikiExportPage` импортирует `../../generated/memento-wiki-export.md?raw` — путь от `src/pages/` к `src/generated/`; при смене структуры поправить алиас `@/generated/...` если настроите в Vite.

---

**План сохранён в `docs/superpowers/plans/2026-04-03-wiki-ai-export.md`. Два варианта выполнения:**

**1. Subagent-Driven (рекомендуется)** — отдельный субагент на каждую задачу, ревью между задачами.

**2. Inline execution** — выполнять шаги в этой сессии пакетами с чекпоинтами (скилл executing-plans).

Какой вариант вам удобнее?
