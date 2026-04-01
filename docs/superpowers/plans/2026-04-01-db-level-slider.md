# План: уровень и числовые параметры на карточках каталога «База данных»

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить глобальный ползунок уровня 0–350 на карточках `/db/.../:id`, подстановку чисел из опционального `stats` в `summary`/`body` по шаблону `{{name}}`, валидацию в `buildDb`, демо-записи с `stats`.

**Architecture:** Константы уровня и чистые функции подстановки в `src/` (переиспользование в React). Сборщик `buildDb.mjs` расширяет Zod-схему и проверяет шаблоны тем же правилом, что и рантайм (алгоритм сканирования `{{…}}` дублируется в двух файлах с взаимными комментариями — Node prebuild не импортирует TypeScript). Vitest: новый project для `src/lib/*.test.ts`.

**Tech Stack:** React 19, Ant Design `Slider`, Zod/js-yaml в `buildDb`, Vitest.

**Спека:** `docs/superpowers/specs/2026-04-01-db-level-slider-design.md`

---

## Карта файлов

| Путь | Действие |
|------|----------|
| `src/constants/dbLevel.ts` | Создать: `LEVEL_MIN`, `LEVEL_MAX` |
| `src/lib/dbEntityLevelText.ts` | Создать: `statDisplayAtLevel`, `interpolateDbText`, `entityHasUsableStats` |
| `src/lib/dbEntityLevelText.test.ts` | Создать: unit-тесты |
| `vitest.config.ts` | Изменить: project `lib`, `include: ['src/lib/**/*.test.ts']`, `environment: 'node'` |
| `src/types/wikiDb.ts` | Изменить: опциональный `stats` на `DbEntity` |
| `scripts/lib/buildDb.mjs` | Изменить: схема `stats`, валидация плейсхолдеров, warning, нормализация пустого `stats` |
| `src/pages/DbDetailPage.tsx` | Изменить: `Slider`, `useState`, подстановка, disabled без `stats` |
| `content/db/items/*.yaml` или `content/db/skills/*.yaml` | Изменить: 1–2 файла с `stats` и `{{...}}` для ручной проверки |

После задач с кодом: `npm run test`, `npm run prebuild`, `npm run build`.

---

### Task 1: Константы уровня

**Files:**
- Create: `src/constants/dbLevel.ts`
- Modify: (нет)

- [ ] **Step 1: Добавить константы**

```typescript
/** Глобальный диапазон уровня на карточках каталога БД (спека 2026-04-01-db-level-slider-design). */
export const LEVEL_MIN = 0
export const LEVEL_MAX = 350
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/dbLevel.ts
git commit -m "feat(db): level range constants for catalog cards"
```

---

### Task 2: Чистые функции подстановки и тесты (TDD)

**Files:**
- Create: `src/lib/dbEntityLevelText.ts`
- Create: `src/lib/dbEntityLevelText.test.ts`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Подключить project `lib` в Vitest**

В `vitest.config.ts` в массив `projects` добавить объект:

```typescript
{
  test: {
    name: 'lib',
    environment: 'node',
    include: ['src/lib/**/*.test.ts'],
  },
},
```

- [ ] **Step 2: Написать падающие тесты**

Создать `src/lib/dbEntityLevelText.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import {
  entityHasUsableStats,
  interpolateDbText,
  statDisplayAtLevel,
} from './dbEntityLevelText'

describe('statDisplayAtLevel', () => {
  it('floors base + perLevel * L', () => {
    expect(statDisplayAtLevel(10, 2, 0)).toBe(10)
    expect(statDisplayAtLevel(10, 2, 1)).toBe(12)
    expect(statDisplayAtLevel(1.4, 0.3, 2)).toBe(2) // floor(2.0)
    expect(statDisplayAtLevel(1.4, 0.3, 1)).toBe(1) // floor(1.7)
  })

  it('floors negative toward -infinity', () => {
    expect(statDisplayAtLevel(-1.2, 0, 0)).toBe(-2)
  })
})

describe('entityHasUsableStats', () => {
  it('is false for undefined, empty object, or missing keys', () => {
    expect(entityHasUsableStats(undefined)).toBe(false)
    expect(entityHasUsableStats({})).toBe(false)
  })

  it('is true when at least one stat entry exists', () => {
    expect(
      entityHasUsableStats({ damage: { base: 1, perLevel: 1 } }),
    ).toBe(true)
  })
})

describe('interpolateDbText', () => {
  it('replaces placeholders with floored values', () => {
    const stats = { damage: { base: 10, perLevel: 2 } }
    expect(interpolateDbText('Урон {{damage}}.', stats, 1)).toBe('Урон 12.')
  })

  it('returns text unchanged when no usable stats', () => {
    expect(interpolateDbText('Урон {{damage}}.', undefined, 5)).toBe(
      'Урон {{damage}}.',
    )
    expect(interpolateDbText('Урон {{damage}}.', {}, 5)).toBe('Урон {{damage}}.')
  })
})
```

- [ ] **Step 3: Запустить тесты — ожидаем FAIL**

```bash
npm run test
```

Ожидаемо: ошибки импорта / отсутствующих экспортов.

- [ ] **Step 4: Реализировать `src/lib/dbEntityLevelText.ts`**

```typescript
export type DbStatEntry = { base: number; perLevel: number }

export type DbStatsMap = Record<string, DbStatEntry>

export function statDisplayAtLevel(
  base: number,
  perLevel: number,
  level: number,
): number {
  return Math.floor(base + perLevel * level)
}

export function entityHasUsableStats(stats: DbStatsMap | undefined): boolean {
  return !!stats && Object.keys(stats).length > 0
}

/**
 * Подставляет {{name}} на целые значения после floor.
 * Незакрытый {{ или неизвестное имя: оставляет фрагмент как в исходной строке (сборка не должна такое пропускать).
 */
export function interpolateDbText(
  text: string,
  stats: DbStatsMap | undefined,
  level: number,
): string {
  if (!entityHasUsableStats(stats)) return text

  let i = 0
  let out = ''
  while (i < text.length) {
    const start = text.indexOf('{{', i)
    if (start === -1) {
      out += text.slice(i)
      break
    }
    out += text.slice(i, start)
    const end = text.indexOf('}}', start + 2)
    if (end === -1) {
      out += text.slice(start)
      break
    }
    const rawName = text.slice(start + 2, end)
    const def = stats![rawName]
    if (
      def &&
      typeof def.base === 'number' &&
      typeof def.perLevel === 'number'
    ) {
      out += String(statDisplayAtLevel(def.base, def.perLevel, level))
    } else {
      out += `{{${rawName}}}`
    }
    i = end + 2
  }
  return out
}
```

- [ ] **Step 5: Запустить тесты — ожидаем PASS**

```bash
npm run test
```

Ожидаемо: все тесты зелёные.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/lib/dbEntityLevelText.ts src/lib/dbEntityLevelText.test.ts
git commit -m "feat(db): stat display and placeholder interpolation helpers"
```

---

### Task 3: Типы `DbEntity` и сборка `db.json`

**Files:**
- Modify: `src/types/wikiDb.ts`
- Modify: `scripts/lib/buildDb.mjs`

- [ ] **Step 1: Расширить `DbEntity`**

В `src/types/wikiDb.ts`:

```typescript
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
```

- [ ] **Step 2: Расширить Zod и нормализацию в `buildDb.mjs`**

После импортов добавить схему статов и обновить `entitySchema`:

```javascript
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
```

В `applyFile` после `const rec = parsed.data` нормализовать пустой объект:

```javascript
let rec = parsed.data
if (rec.stats && Object.keys(rec.stats).length === 0) {
  const { stats: _omit, ...rest } = rec
  rec = rest
}
```

(Если предпочитаете мутацию: `delete rec.stats` при пустом объекте — эквивалентно.)

- [ ] **Step 3: Валидация шаблонов (дублирует правила `interpolateDbText` — см. комментарий в коде)**

Перед `maps[key][rec.id] = rec` вызвать проверку. Добавить в **`buildDb.mjs`** функции:

```javascript
/** Синхронизировать с логикой скана {{…}} в src/lib/dbEntityLevelText.ts */
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
```

В `applyFile` после нормализации `rec`:

```javascript
validateEntityTemplates(rec, abs)
```

- [ ] **Step 4: Запустить prebuild**

```bash
npm run prebuild
```

Ожидаемо: успех при существующем контенте без `stats`/`{{`.

- [ ] **Step 5: Commit**

```bash
git add src/types/wikiDb.ts scripts/lib/buildDb.mjs
git commit -m "feat(db): optional stats schema and template validation in buildDb"
```

---

### Task 4: UI карточки детали

**Files:**
- Modify: `src/pages/DbDetailPage.tsx`

- [ ] **Step 1: Импорты и состояние**

```typescript
import { useEffect, useMemo, useState } from 'react'
import { Card, Slider, Typography } from 'antd'
import { LEVEL_MAX, LEVEL_MIN } from '@/constants/dbLevel'
import {
  entityHasUsableStats,
  interpolateDbText,
} from '@/lib/dbEntityLevelText'
```

Внутри компонента после успешного `row`:

```typescript
const [level, setLevel] = useState(LEVEL_MIN)

useEffect(() => {
  setLevel(LEVEL_MIN)
}, [id])

const hasStats = entityHasUsableStats(row.stats)
const summaryRendered = useMemo(
  () => interpolateDbText(row.summary, row.stats, level),
  [row.summary, row.stats, level],
)
const bodyRendered = useMemo(
  () =>
    row.body ? interpolateDbText(row.body, row.stats, level) : undefined,
  [row.body, row.stats, level],
)
```

- [ ] **Step 2: Разметка блока уровня и подстановка**

После параграфа «Игра: …» и **перед** `summary` вставить:

```tsx
<div style={{ marginBottom: 16 }}>
  <Typography.Text strong>Уровень: {level}</Typography.Text>
  <Slider
    min={LEVEL_MIN}
    max={LEVEL_MAX}
    step={1}
    value={level}
    onChange={setLevel}
    disabled={!hasStats}
    style={{ marginTop: 8 }}
    aria-valuemin={LEVEL_MIN}
    aria-valuemax={LEVEL_MAX}
    aria-valuenow={level}
  />
  {!hasStats ? (
    <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
      Для этой записи уровень не влияет на описание.
    </Typography.Paragraph>
  ) : null}
</div>
```

Заменить вывод:

```tsx
<Typography.Paragraph>{summaryRendered}</Typography.Paragraph>
{bodyRendered !== undefined ? (
  <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
    {bodyRendered}
  </Typography.Paragraph>
) : null}
```

- [ ] **Step 3: Проверка в браузере**

Запустить `npm run start`, открыть любую карточку без `stats` — слайдер disabled. После Task 5 — карточку с `stats`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/DbDetailPage.tsx
git commit -m "feat(db): level slider and stat interpolation on detail page"
```

---

### Task 5: Демо-контент с `stats`

**Files:**
- Modify: один или два YAML в `content/db/items/` и/или `content/db/skills/` (существующие id, без смены URL)

Пример для умения (подставьте реальный `id` из репозитория):

```yaml
stats:
  damage:
    base: 10
    perLevel: 2
summary: >-
  Бьёт по области, нанося {{damage}} урона.
body: |
  На уровне 0 базовый урон {{damage}}.
  С ростом уровня урон растёт линейно (демо для вики).
```

- [ ] **Step 1:** Добавить `stats` и плейсхолдеры в **одну** запись (например skill).

- [ ] **Step 2:** Опционально — **вторая** запись с дробными `base`/`perLevel`, чтобы проверить `floor`.

- [ ] **Step 3: prebuild + build**

```bash
npm run prebuild
npm run build
```

Ожидаемо: без ошибок.

- [ ] **Step 4: Commit**

```bash
git add content/db/
git commit -m "content(db): sample stats and placeholders for level slider demo"
```

---

### Task 6: Финальная проверка

- [ ] **Step 1**

```bash
npm run test && npm run prebuild && npm run build
```

Ожидаемо: все команды завершаются с кодом 0.

- [ ] **Step 2:** При необходимости `npm run lint` и исправить замечания только в затронутых файлах.

---

## Самопроверка плана по спеке

| Требование спеки | Задача |
|------------------|--------|
| Диапазон 0–350, шаг 1 | Task 1 + Task 4 (`Slider`) |
| Формула `base + perLevel * L`, `floor` | Task 2 |
| `stats` в YAML, `{{identifier}}` | Task 3 Zod + Task 3 validate |
| Ошибки сборки при плохих плейсхолдерах / без ключа | Task 3 `validateEntityTemplates` |
| Warning на неиспользуемые ключи `stats` | Task 3 `console.warn` |
| Пустой `stats` → не писать в JSON / UI disabled | Task 3 нормализация + Task 4 `hasStats` |
| Сброс L при смене `id` | Task 4 `useEffect` |
| `pre-wrap` для `body` | Task 4 |
| Демо-контент | Task 5 |

Плейсхолдер-скан в `buildDb.mjs` и цикл в `interpolateDbText` должны оставаться **идентичными по правилам** (имя `[a-zA-Z_][a-zA-Z0-9_]*`, пара `{{`/`}}`, ошибка при незакрытом `{{`).

---

**План сохранён в `docs/superpowers/plans/2026-04-01-db-level-slider.md`. Два варианта выполнения:**

1. **Subagent-Driven (рекомендуется)** — отдельный агент на каждую задачу, ревью между задачами.  
2. **Inline execution** — выполнение задач в этой сессии пакетами с чекпоинтами.

Какой вариант предпочитаете?
