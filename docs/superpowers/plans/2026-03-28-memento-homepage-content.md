# Memento Mori — контент главной (`/`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать полную главную страницу по спеке `docs/superpowers/specs/2026-03-28-memento-homepage-content-design.md`: русский текст (секции 3.1–3.6), диаграмма через именованный компонент + `mermaid`, блок «под капотом» со свёрткой и демо `RollLevelDemo` / `PercentTokenDemo`, навигационные ссылки без 404.

**Architecture:** Исходник диаграммы — **отдельный TS-модуль со строкой** (удобно править и тестировать; в MDX нет fenced `mermaid`). Виджет **`MermaidDiagram`** в `src/widgets/` инициализирует `mermaid` и рендерит SVG в контейнер (после `npm install mermaid` зафиксировать **мажорную версию** пакета и использовать актуальный API: `initialize` + `run` и/или `render` — см. комментарий в Task 2). Лендинг MDX рендерится внутри **`MdxShell`** из `src/mdx/MdxShell.tsx`; подключение обёртки — в **`src/app/router.tsx`** (`<MdxShell><Page /></MdxShell>`). Глобальная регистрация виджетов через **`MDXProvider`** в `MdxShell` соответствует духу родительской спеки §5 (именованные компоненты в MDX, как `RollLevelDemo` / `PercentTokenDemo`); отдельный fenced-синтаксис не вводится. Добавить **`MermaidDiagram`** в объект `components` провайдера. Секция «под капотом»: **`Collapse`** из Ant Design, импорт в `content/index.mdx`.

**Tech Stack:** Vite 8, React 19, MDX (`@mdx-js/rollup`), Ant Design 6, TypeScript strict, Vitest; **`mermaid`**; для теста виджета — **`@testing-library/react`**, среда **`jsdom`** (пакет `jsdom` как devDependency, если Vitest его требует для `environment: 'jsdom'`).

**Спека:** `docs/superpowers/specs/2026-03-28-memento-homepage-content-design.md`  
**Родительская вики:** `docs/superpowers/specs/2026-03-28-memento-wiki-design.md` (§5 — только именованные компоненты, без fenced-языка для диаграмм).

---

## Карта файлов

| Файл | Роль |
|------|------|
| `package.json` / lock | Зависимости: `mermaid`; dev: `@testing-library/react`, при необходимости `jsdom`. |
| `vitest.config.ts` | Включить `src/widgets/**/*.test.tsx` и среду `jsdom` (или отдельный `test.project` для виджетов), не ломая тесты `src/memento/**/*.test.ts`. |
| `src/diagrams/mementoSystemMap.ts` | Экспорт константы `mementoSystemMapMermaid: string` (текст диаграммы Mermaid: три оси + цикл забег → исход → мета). |
| `src/widgets/MermaidDiagram.tsx` | Проп `definition: string`; `useId` + контейнер; эффект вызова Mermaid; обработка размонтирования/повторного рендера. |
| `src/widgets/MermaidDiagram.test.tsx` | Мок `mermaid`; проверка, что виджет монтируется и вызывает API (см. задачу 2). |
| `src/mdx/MdxShell.tsx` | Добавить `MermaidDiagram` в объект `components` для использования в MDX без обязательного импорта в каждой статье **или** оставить только импорт в `index.mdx` — достаточно **одного** способа; рекомендация: зарегистрировать в `MdxShell` для единообразия с другими виджетами. |
| `content/index.mdx` | Полный контент страницы по §3.1–3.6 спеки; импорты `Collapse`, `Typography` при необходимости; `<MermaidDiagram definition={mementoSystemMapMermaid} />` (если диаграмма импортируется из TS — см. ниже). |

**Примечание по MDX:** если зарегистрировать только `MermaidDiagram` в `MdxShell` без передачи `definition` извне, в MDX всё равно нужен способ передать строку. Варианты: (A) в `index.mdx` импортировать строку из `@/diagrams/mementoSystemMap` и писать `<MermaidDiagram definition={mementoSystemMapMermaid} />`; (B) обёртка `MementoSystemMapDiagram` без пропов, строка внутри компонента. Спека допускает оба; **план рекомендует (A)** — диаграмма остаётся данными в `src/diagrams/`.

---

### Task 1: Зависимости (`mermaid`, тестовый стек)

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1:** Установить runtime и dev-зависимости.

```bash
cd c:/sites/gen-memento-docs && npm install mermaid && npm install -D @testing-library/react jsdom
```

(`jsdom` нужен для `environment: 'jsdom'` в Vitest при тестах React-компонентов.)

- [ ] **Step 2:** Записать в комментарий к Task 2 или в `MermaidDiagram.tsx` одну строку: **версия `mermaid` из `package.json`** после установки — чтобы моки и вызовы API не расходились с мажором.

- [ ] **Step 3:** Коммит.

```bash
git add package.json package-lock.json
git commit -m "chore: add mermaid and RTL/jsdom for widget tests"
```

---

### Task 1b: Конфигурация Vitest для виджетов

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1:** Расширить конфиг так, чтобы **`src/widgets/**/*.test.tsx`** выполнялись в **`jsdom`**, а тесты **`src/memento/**/*.test.ts`** оставались в **`node`** (рекомендуется **`test.projects`** в одном `vitest.config.ts`: проект `memento` с `include: ['src/memento/**/*.test.ts']`, `environment: 'node'`; проект `widgets` с `include: ['src/widgets/**/*.test.{ts,tsx}']`, `environment: 'jsdom'`). Если `projects` неудобен в текущей версии Vitest — допустимо **единое** `environment: 'jsdom'` и `include: ['src/**/*.test.ts', 'src/**/*.test.tsx']`, пока тесты memento остаются чистыми функциями без Node-only API.

- [ ] **Step 2:** Установить **`passWithNoTests: false`** на уровне, где это не сломает CI, **или** убедиться, что после добавления виджет-теста `npm run test` реально выполняет ≥1 тест в проекте `widgets` (не «успех без тестов»).

- [ ] **Step 3:** Проверка.

```bash
npm run test
```

Ожидается: по-прежнему проходят тесты `src/memento/`; новых падений нет.

- [ ] **Step 4:** Коммит.

```bash
git add vitest.config.ts
git commit -m "chore: vitest jsdom project for widget tests"
```

---

### Task 2: Виджет `MermaidDiagram` + unit-тест с моком

**Files:**
- Create: `src/widgets/MermaidDiagram.tsx`
- Create: `src/widgets/MermaidDiagram.test.tsx`

- [ ] **Step 1:** Написать тест с `vi.mock('mermaid', () => ({ default: { initialize: vi.fn(), run: vi.fn() } }))` или актуальный API выбранной версии `mermaid` (после установки проверить в `node_modules/mermaid` экспорт: `initialize`, `run` / `render`).

Пример ожиданий (уточнить под фактический API):

```tsx
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MermaidDiagram } from './MermaidDiagram'

vi.mock('mermaid', () => {
  const initialize = vi.fn()
  const run = vi.fn().mockResolvedValue(undefined)
  return { default: { initialize, run } }
})

describe('MermaidDiagram', () => {
  beforeEach(() => vi.clearAllMocks())

  it('initializes mermaid and runs on definition', async () => {
    const mermaid = (await import('mermaid')).default
    render(<MermaidDiagram definition="flowchart LR;A-->B" />)
    await waitFor(() => expect(mermaid.initialize).toHaveBeenCalled())
    await waitFor(() => expect(mermaid.run).toHaveBeenCalled())
  })
})
```

- [ ] **Step 2:** Запустить тест — ожидается **FAIL** (компонента ещё нет).

```bash
npm run test -- src/widgets/MermaidDiagram.test.tsx
```

- [ ] **Step 3:** Реализовать `MermaidDiagram`: проп `definition: string`; уникальный id (`useId`); `useEffect`/`useLayoutEffect`: один раз `mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' })` (или документированный безопасный набор для статичного контента из репозитория); затем рендер в привязанный элемент. Очистка при размонтировании — по возможности очистить контейнер, чтобы избежать дублирования при HMR.

- [ ] **Step 4:** Запустить тест — ожидается **PASS**.

```bash
npm run test -- src/widgets/MermaidDiagram.test.tsx
```

Убедиться, что команда **не** завершается с «No test files found» (иначе Task 1b не выполнен).

- [ ] **Step 5:** Коммит.

```bash
git add src/widgets/MermaidDiagram.tsx src/widgets/MermaidDiagram.test.tsx
git commit -m "feat: MermaidDiagram widget for MDX"
```

---

### Task 3: Текст диаграммы «три оси + цикл»

**Files:**
- Create: `src/diagrams/mementoSystemMap.ts`

- [ ] **Step 1:** Экспортировать строку `mementoSystemMapMermaid` с осмысленным `flowchart` / `graph`: три узла или три ветки осей (например: «Мета / мир», «Использование карт и умений», «Победа и моды») и связь с «Забег» → «Исход» → «Мета». Соответствует §3.3 спеки (семантика важнее красоты).

- [ ] **Step 2:** Коммит.

```bash
git add src/diagrams/mementoSystemMap.ts
git commit -m "feat: mermaid source for Memento Mori system map"
```

---

### Task 4: Регистрация в `MdxShell`

**Files:**
- Modify: `src/mdx/MdxShell.tsx`

- [ ] **Step 1:** Импортировать `MermaidDiagram`, добавить в объект `components` как `MermaidDiagram`.

- [ ] **Step 2:** Сборка и **полный** прогон тестов.

```bash
npm run test
npm run build
```

Ожидается: успех; вывод Vitest содержит прогон **`MermaidDiagram`** (имя файла или теста), не только `src/memento/`.

- [ ] **Step 3:** Коммит.

```bash
git add src/mdx/MdxShell.tsx
git commit -m "feat: expose MermaidDiagram in MDX provider"
```

---

### Task 5: Контент `content/index.mdx`

**Files:**
- Modify: `content/index.mdx`

- [ ] **Step 1:** Сохранить корректный frontmatter (`title`, `audience: both`, `order: 0`).

- [ ] **Step 2:** Добавить импорты:

```mdx
import { mementoSystemMapMermaid } from '@/diagrams/mementoSystemMap'
import { Collapse } from 'antd'
```

(Если alias `@/` в MDX не резолвится — использовать относительный путь от `content/` к `src/` **нельзя**; тогда вынести строку диаграммы в пакет под `src` и убедиться, что Vite alias применяется к MDX; при проблеме — обёрточный компонент `MementoSystemMapDiagram` в `src/widgets/` без импорта из `content/`.)

- [ ] **Step 3:** Написать секции **3.1–3.4** прозой по спеке (без имён функций в 3.1–3.4).

- [ ] **Step 4:** Вставить `<MermaidDiagram definition={mementoSystemMapMermaid} />` и подпись под диаграммой (про отличия в играх и про Gen).

- [ ] **Step 5:** Секция **3.5**: заголовок; краткий текст; `Collapse` с панелью «Показать расчёт (Gen)» (или эквивалент), внутри `<RollLevelDemo />` и `<PercentTokenDemo />`. Ссылку «полное описание для разработчиков» оформить как **markdown-ссылку** `[текст](/dev/memento-roll)`, чтобы **`scripts/lib/checkLinks.mjs`** (регуляр `](/path)`) увидела URL. Примечание: `checkLinks` **не** сканирует `href=` / `to=` в JSX; при использовании `<Link>` или `<a>` внутренние URL **не** попадут в автоматическую проверку — тогда добавить ручную проверку в «Проверка вручную».

- [ ] **Step 6:** Секция **3.6**: навигационный список оформить **markdown-ссылками** на `/dev/memento-roll`, `/games/gen`, `/db/items`, `/db/skills`, `/db/mods` (те же причины для `checkLinks`). Раздел «для игроков»: **нет** файлов в `content/players/**` — текст «скоро» **без** ссылки на несуществующий маршрут.

- [ ] **Step 7:** Prebuild и проверка ссылок.

```bash
node scripts/prebuild.mjs
```

Ожидается: `prebuild: nav.json + db.json OK`, нет новых ошибок по внутренним ссылкам из главной.

- [ ] **Step 8:** `npm run build` — успех.

- [ ] **Step 9:** Коммит.

```bash
git add content/index.mdx
git commit -m "content: expand Memento Mori homepage (theses, diagram, demos)"
```

---

### Task 6 (опционально): Ленивая загрузка демо под `Collapse`

**Files:**
- Modify: `content/index.mdx` или небольшой обёрточный компонент в `src/widgets/`

- [ ] **Step 1:** Если `npm run build` / Lighthouse показывает тяжёлый главный бандл, обернуть демо в `React.lazy` + `Suspense` внутри панели Collapse (открытие панели триггерит загрузку). Иначе пропустить задачу (YAGNI).

---

## Проверка вручную

1. `npm run dev`, открыть `/`.
2. Диаграмма видна, нет ошибок в консоли.
3. Раскрыть «Под капотом», демо работают как на `/dev/memento-roll`.
4. Все ссылки из футера ведут на существующие страницы.

## Критерии приёмки (из спеки §5)

- Все секции 3.1–3.6 присутствуют; тон верхней части без имён функций до блока 3.5.
- Диаграмма соответствует семантике; встраивание только через именованный компонент.
- Демо идентичны поведению на `/dev/memento-roll`.
- Нет битых внутренних ссылок; для игроков — заглушка без URL.

---

**После выполнения:** обновить `README.md` **только если** появился новый виджет, который нужно перечислить рядом с существующими демо (опционально, одна строка).
