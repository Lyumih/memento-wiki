# Memento Mori Wiki — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Публичная статическая вики на Vite + React + Ant Design с MDX-статьями, разделом «База данных», интерактивными виджетами и модулем формул Memento Mori, согласованным со спекой Gen.

**Architecture:** Контент в `content/**` (MDX для страниц, YAML для сущностей БД). Перед `vite` скрипт `prebuild` генерирует `src/generated/nav.json` и `src/generated/db.json`, валидирует схемы и предупреждает о битых внутренних ссылках. Маршруты строятся из `import.meta.glob` по MDX и из фиксированных маршрутов для списков/карточек БД. Чистые функции Memento в `src/memento/` с Vitest. Оболочка: Ant Design Layout (сайдбар + шапка), русская локаль.

**SSG / выдача:** Сборка Vite даёт статический **SPA** (один `index.html` + ассеты); все URL обслуживаются хостингом через fallback на `index.html` (GitHub Pages, Netlify `_redirects`, и т.д.). Полный пререндер HTML на каждый путь в v1 **не** требуется; при появлении требования — отдельная задача (плагин пререндера или миграция на фреймворк со SSG).

**Tech Stack:** TypeScript strict, Vite 8, React 19, Ant Design 6, MDX (`@mdx-js/rollup`, `@mdx-js/react`), `react-router-dom`, Vitest, `gray-matter`, `fast-glob`, `js-yaml`, Zod (валидация записей БД).

**Спека:** `docs/superpowers/specs/2026-03-28-memento-wiki-design.md`  
**Норматив формул (внешний):** `gen-sp/docs/superpowers/specs/2026-03-28-gen-game-design.md` и эталонный код `gen-sp/src/game/memento/rollCardLevelUp.ts`, `resolvePercentToken.ts`. Ожидаемый путь клонов на машине разработчика: соседняя папка `../gen-sp` относительно корня `gen-memento-docs` (как у автора: `c:/sites/gen-sp`). Если репозитория нет — использовать **полный код из этого плана** в шагах Task 2–4 и тесты, переписанные вручную из приведённых фрагментов.

---

## Карта файлов (создать / изменить)

| Путь | Назначение |
|------|------------|
| `src/memento/rollCardLevelUp.ts` | Канонический бросок уровня карты (копия логики gen-sp). |
| `src/memento/rollMementoLevelUp.ts` | Реэкспорт `rollCardLevelUp`. |
| `src/memento/resolvePercentToken.ts` | `parsePercentToken`, `resolvePercentValue` + алиас `resolvePercentToken` → `resolvePercentValue` (имя из приложения B спеки вики). |
| `src/memento/*.test.ts` | Тесты (зеркально кейсам gen-sp). |
| `scripts/prebuild.mjs` | Оркестратор: nav, db, link warnings. |
| `scripts/lib/scanMdxNav.mjs` | `gray-matter` + `fast-glob` → `nav.json`. |
| `scripts/lib/buildDb.mjs` | Чтение YAML, Zod, merge `content/db/generated/*.yaml`, `db.json`. |
| `scripts/lib/checkLinks.mjs` | Предупреждения `[text](/path)` по известным маршрутам. |
| `content/index.mdx` | Главная `/`. |
| `content/players/**`, `content/dev/**`, `content/games/**` | Статьи по спеке 3.2. |
| `content/db/items/*.yaml` (и skills, mods) | Записи каталога; опционально `content/db/generated/.gitkeep`. |
| `src/generated/.gitkeep` | Папка артефактов (сами json в `.gitignore`). |
| `src/app/router.tsx` | `createBrowserRouter`, lazy MDX из glob, маршруты БД. |
| `src/app/WikiLayout.tsx` | Ant Layout, меню из `nav.json`, `Outlet`. |
| `src/widgets/RollLevelDemo.tsx` | Виджет: уровень + r 1–100 → успех. |
| `src/widgets/PercentTokenDemo.tsx` | Виджет: токен + уровень → значение. |
| `src/pages/DbListPage.tsx` | Списки `/db/items`, `/db/skills`, `/db/mods`. |
| `src/pages/DbDetailPage.tsx` | Карточка `/db/:type/:id`. |
| `src/mdx/components.tsx` | Таблица компонентов для `MDXProvider` (при необходимости). |
| `vite.config.ts` | Плагин MDX (`enforce: 'pre'`), `import.meta.glob` корень `content`. |
| `vitest.config.ts` | `environment: 'node'`, include `src/memento`. |
| `package.json` | Скрипты `predev`, `prebuild`, `test`, зависимости. |
| `.gitignore` | `src/generated/*.json` |
| `index.html`, `src/main.tsx` | RouterProvider вместо прямого App-бойлерплейта. |

---

### Task 1: Инструменты тестирования и скриптов

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1:** Установить dev-зависимости:

```bash
cd c:/sites/gen-memento-docs
npm install -D vitest@^3 @mdx-js/rollup @mdx-js/react react-router-dom gray-matter fast-glob js-yaml zod
npm install @types/js-yaml -D
```

- [ ] **Step 2:** Добавить в `package.json` в `scripts` (без `predev`/`prebuild` до Task 5 — иначе сломанный пайплайн между задачами):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3:** Создать `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/memento/**/*.test.ts'],
  },
})
```

- [ ] **Step 4:** Запустить `npm run test`

Ожидается: PASS с 0 тестов (или отсутствие файлов — тогда Vitest сообщит no tests; после Step 1 можно временно не запускать до появления тестов).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest and content pipeline dependencies"
```

---

### Task 2: `rollCardLevelUp` (TDD)

**Files:**
- Create: `src/memento/rollCardLevelUp.ts`
- Create: `src/memento/rollCardLevelUp.test.ts`

- [ ] **Step 1: Написать падающий тест** — скопировать кейсы из `gen-sp/src/game/memento/rollCardLevelUp.test.ts` (импорт из `./rollCardLevelUp`).

- [ ] **Step 2: Запустить**

```bash
npm run test -- src/memento/rollCardLevelUp.test.ts
```

Ожидается: FAIL (модуль не найден или функция не экспортирована).

- [ ] **Step 3: Реализация** — точная копия тела из gen-sp:

```ts
/** Карточка повышает global_level на +1 после использования — раздел 4.3 gen-game-design */
export function rollCardLevelUp(
  currentLevel: number,
  randomInt1to100: number,
): boolean {
  const r = randomInt1to100
  if (currentLevel > 100) return r === 1
  return r === 100 || r >= currentLevel
}
```

- [ ] **Step 4: Запустить тесты** — ожидается PASS.

- [ ] **Step 5: Commit** `feat(memento): add rollCardLevelUp with tests`

---

### Task 3: `rollMementoLevelUp`

**Files:**
- Create: `src/memento/rollMementoLevelUp.ts`
- Create: `src/memento/rollMementoLevelUp.test.ts` (один тест: равенство результатов с `rollCardLevelUp` на выборочных парах)

- [ ] **Step 1:** `rollMementoLevelUp.ts`:

```ts
export { rollCardLevelUp as rollMementoLevelUp } from './rollCardLevelUp'
```

- [ ] **Step 2:** Тест + `npm run test` → PASS.

- [ ] **Step 3: Commit** `feat(memento): add rollMementoLevelUp re-export`

---

### Task 4: `resolvePercentToken` / `resolvePercentValue` (TDD)

**Files:**
- Create: `src/memento/resolvePercentToken.ts`
- Create: `src/memento/resolvePercentToken.test.ts`

- [ ] **Step 1:** Скопировать реализацию и тесты из `gen-sp/src/game/memento/resolvePercentToken.ts` и `.test.ts`.

- [ ] **Step 2:** Добавить алиас для спеки вики (в конце `resolvePercentToken.ts`):

```ts
/** Алиас по приложению B спеки вики; поведение = resolvePercentValue */
export function resolvePercentToken(level: number, token: string): number | null {
  return resolvePercentValue(level, token)
}
```

- [ ] **Step 3:** В тесте добавить один кейс вызова `resolvePercentToken(0, '40%%')` → `40`.

- [ ] **Step 4:** `npm run test` → PASS.

- [ ] **Step 5: Commit** `feat(memento): add resolvePercentValue and resolvePercentToken alias`

---

### Task 5: Prebuild — навигация и заглушка БД

**Files:**
- Create: `scripts/prebuild.mjs`
- Create: `scripts/lib/scanMdxNav.mjs`
- Create: `scripts/lib/buildDb.mjs` (минимум: пустые массивы если нет файлов)
- Create: `scripts/lib/checkLinks.mjs` (заглушка: no-op или простой лог)
- Create: `src/generated/.gitkeep`
- Modify: `.gitignore` — добавить `src/generated/nav.json`, `src/generated/db.json`

- [ ] **Step 1:** Добавить в `package.json` скрипты `predev`, `prebuild`: `node scripts/prebuild.mjs` (теперь файл существует в этой же задаче).

- [ ] **Step 2:** `scanMdxNav.mjs`: `fast-glob` по `content/**/*.mdx`, `gray-matter` читает `title`, `audience`, `order`, `game`; вычисляет `path` по правилам спеки 3.2: сегменты `content/players/foo/bar.mdx` → `/players/foo/bar`; для **`index.mdx`** в каталоге — путь каталога **без** суффикса `/index` (например `content/players/guide/index.mdx` → `/players/guide`). Для `audience === 'both'` дублировать пункт в деревьях players и dev с одним `path`. Записать `src/generated/nav.json` вида `{ players: [...], dev: [...], games: [...], home: true }`.

- [ ] **Step 3:** `buildDb.mjs`: glob `content/db/items/*.yaml` и т.д.; Zod-схема полей приложения C; выход `src/generated/db.json` `{ items: [], skills: [], modifiers: [] }` (ключи согласовать с UI).

- [ ] **Step 4:** `prebuild.mjs` вызывает оба; при ошибке валидации — `process.exit(1)`.

- [ ] **Step 5:** `node scripts/prebuild.mjs` из корня — успех, файлы созданы.

- [ ] **Step 6: Commit** `feat(build): prebuild nav and db json`

---

### Task 6: MDX + Vite + пример контента

**Files:**
- Modify: `vite.config.ts`
- Create: `content/index.mdx`
- Create: `content/players/.gitkeep` (или одна статья)
- Create: `content/dev/memento-roll.mdx` (демо импорта виджета позже)
- Modify: `tsconfig.app.json` — `"include": ["src", "content"]` при необходимости для типов MDX

- [ ] **Step 1:** В `vite.config.ts` добавить **до** `react()`:

```ts
import mdx from '@mdx-js/rollup'

// plugins:
{ enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react' }) },
```

- [ ] **Step 2:** `content/index.mdx` с frontmatter:

```mdx
---
title: Memento Mori
audience: both
order: 0
---

# Система Memento Mori

Краткое введение (черновик).
```

- [ ] **Step 3:** `npm run build` — убедиться, что prebuild отрабатывает и Vite собирает (может потребоваться временно упростить `App` до минимума в Task 7).

- [ ] **Step 4: Commit** `feat(content): add MDX pipeline and home page`

---

### Task 7: Роутинг и WikiLayout

**Files:**
- Create: `src/app/router.tsx`
- Create: `src/app/WikiLayout.tsx`
- Modify: `src/main.tsx` — обёртка `RouterProvider`, Ant `ConfigProvider` с `locale` из `antd/locale/ru_RU`
- Replace/trim: `src/App.tsx` — удалить бойлерплейт Vite или переэкспорт из router

- [ ] **Step 1:** `import.meta.glob('../../content/**/*.mdx', { eager: false })` — путь от файла `router.tsx`: скорректировать так, чтобы glob указывал на корневую папку `content/` (в Vite обычно `'../content/**/*.mdx'` из `src/app`).

- [ ] **Step 2:** Построить массив `RouteObject`: для каждого ключа glob — `path` по правилу 3.2 (**включая правило `index.mdx` → путь каталога**, как в `scanMdxNav`), `lazy: () => import(...).then(m => ({ Component: m.default }))`, обёртка с `WikiLayout` через родительский route с `Outlet`.

- [ ] **Step 3:** `WikiLayout`: `Layout`, `Sider` с `Menu` из `nav.json` (импорт статический JSON — генерируется prebuild), `Header` с названием сайта «Memento Mori — вики»; на мобильном `Sider` в `drawer` или `breakpoint` collapsible.

- [ ] **Step 4:** Ручная проверка `npm run dev` — главная рендерится, меню видно.

- [ ] **Step 5: Commit** `feat(app): wiki layout and MDX routes`

---

### Task 8: Маршруты каталога БД

**Files:**
- Create: `src/pages/DbListPage.tsx`
- Create: `src/pages/DbDetailPage.tsx`
- Modify: `src/app/router.tsx`

- [ ] **Step 1:** Маршруты `/db/items`, `/db/skills`, `/db/mods` → `DbListPage` с пропом или `useParams` для типа; данные из `import db from '../generated/db.json' assert { type: 'json' }` (или динамический fetch в SPA — предпочтительно статический импорт после генерации).

- [ ] **Step 2:** На каждой странице списка — **фильтр по игре** (Ant `Select`): значение `all` + уникальные `game` из записей; таблица или список карточек показывает только выбранную игру (требование ИА спеки, раздел 7 и раздел 3).

- [ ] **Step 3:** Маршрут `/db/items/:id` и аналоги — `DbDetailPage` ищет запись в `db.json`.

- [ ] **Step 4:** Добавить в `prebuild` пункты меню «База данных» (или захардкодить в `WikiLayout` три дочерних пункта) со ссылками на списки.

- [ ] **Step 5:** Пример `content/db/items/sample.yaml` для демонстрации.

- [ ] **Step 6: Commit** `feat(db): list and detail routes for catalog`

---

### Task 9: Виджеты `RollLevelDemo` и `PercentTokenDemo`

**Files:**
- Create: `src/widgets/RollLevelDemo.tsx`
- Create: `src/widgets/PercentTokenDemo.tsx`
- Modify: `vite.config.ts` или отдельный `mdx-components.tsx` — зарегистрировать глобальные MDX-компоненты через `MDXProvider` в родителе маршрута (обёртка `MdxPage` вокруг `Outlet` content)

- [ ] **Step 1:** `RollLevelDemo`: `Slider` или `InputNumber` Ant Design для `currentLevel` (1–300) и `r` (1–100), вызов `rollCardLevelUp`, отображение «успех / нет» и краткой подсказки правила.

- [ ] **Step 2:** `PercentTokenDemo`: поле ввода токена (default `40%%`), уровень, вывод `resolvePercentToken` или `null`.

- [ ] **Step 3:** В `content/dev/memento-roll.mdx` импортировать и вставить `<RollLevelDemo />` и `<PercentTokenDemo />` (путь импорта относительный или alias `@/widgets/...`).

- [ ] **Step 4:** Проверить страницу в dev.

- [ ] **Step 5: Commit** `feat(widgets): roll and percent token demos for MDX`

---

### Task 10: Проверка внутренних ссылок (warn)

**Files:**
- Modify: `scripts/lib/checkLinks.mjs`
- Modify: `scripts/prebuild.mjs`

- [ ] **Step 1:** Собрать множество допустимых путей: из `nav.json`, из ключей MDX-маршрутов (с тем же правилом `index.mdx`, что в Task 5/7), `/db/items`, `/db/skills`, `/db/mods`, динамические `/db/.../id` из `db.json`.

- [ ] **Step 2:** Regex по `\]\(/[^)]+\)` в `.mdx` и `.md`; при неизвестном пути — `console.warn`.

- [ ] **Step 3:** `prebuild` вызывает checkLinks после scan; exit code остаётся 0.

- [ ] **Step 4: Commit** `feat(build): warn on unknown internal wiki links`

---

### Task 11: 404 и полировка

**Files:**
- Create: `src/pages/NotFoundPage.tsx`
- Modify: `src/app/router.tsx`

- [ ] **Step 1:** `path: '*'` → `NotFoundPage` с ссылкой на `/`.

- [ ] **Step 2:** Убедиться `npm run build && npm run preview` открывают главную и статью.

- [ ] **Step 3: Commit** `feat(app): not found page`

---

### Task 12: Стартовый контент «Примеры в играх»

**Files:**
- Create: `content/games/gen.mdx`

- [ ] **Step 1:** Страница с frontmatter (`title`, `audience: players`, `order`), краткое описание Gen и внешние ссылки (репозиторий по желанию).

- [ ] **Step 2:** `npm run prebuild` (или `npm run dev`) — пункт появляется в меню.

- [ ] **Step 3: Commit** `content: add Gen example game page`

---

### Task 13: Документация для контрибьютора (минимум)

**Files:**
- Modify: `README.md` (корень проекта)

- [ ] **Step 1:** Описать `content/` структуру, frontmatter приложения A, запуск `npm run dev`, `npm run build`, указать спеку и `gen-sp` как норматив формул.

- [ ] **Step 2:** Для деплоя SPA: fallback всех путей на `index.html` (GitHub Pages `404.html` = копия `index.html`, Netlify `_redirects`, и т.д.).

- [ ] **Step 3: Commit** `docs: readme for wiki content authors`

---

## Правило конфликтов БД (из спеки, раздел 6)

**Решение v1:** Файлы в `content/db/generated/` при наличии **перезаписывают** поля записи с тем же `id` и `type` после merge ручных YAML (ручные данные загружаются первыми, generated — вторым слоём). Документировать в `README.md`. Если `id` конфликт без generated — падение валидации с понятным сообщением.

---

## CI (опционально v1)

Добавить workflow GitHub Actions: `npm ci`, `npm run build` — достаточно для проверки prebuild + типов + сборки. Вынести в отдельный маленький PR после основной реализации, если не сделано в Task 13.
