# Memento-roll: формулы, эмуляция, график E₁ и таблицы E_cum — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать на странице `content/dev/memento-roll.mdx` формулы (бросок Memento + токены `%%`), единый интерактив с выбираемым стартом `S`, эмуляцией уровня `L`, графиком `E₁(L)` для `L=1…200` и таблицами кумулятивного ожидания `E_cum(S,T)` по вехам из спеки `docs/superpowers/specs/2026-03-30-memento-roll-formulas-design.md`.

**Architecture:** Чистый модуль `cardLevelUpStats` дублирует вероятность успеха, согласованную с `rollCardLevelUp`, и считает `E₁` и `E_cum`. UI — один составной виджет `MementoRollLab` (состояние `S`, `L`, последний `r`, строка токена), дочерний SVG-график и таблицы Ant Design. Главная `content/index.mdx` по-прежнему использует отдельные `RollLevelDemo` / `PercentTokenDemo`; для переиспользования логики токена `PercentTokenDemo` получает опциональный контролируемый `level` без слайдера уровня.

**Tech Stack:** React 19, TypeScript, Vite, Ant Design 6, Vitest, существующие `@/memento/rollCardLevelUp`, `@/memento/resolvePercentToken`.

**Спека:** `docs/superpowers/specs/2026-03-30-memento-roll-formulas-design.md`

---

## Файлы: создание и ответственность

| Файл | Назначение |
|------|------------|
| `src/memento/cardLevelUpStats.ts` | `cardLevelUpSuccessProbability`, `expectedRollsForOneSuccess`, `expectedRollsToReachLevel` |
| `src/memento/cardLevelUpStats.test.ts` | Юнит-тесты статистики |
| `src/widgets/LevelUpExpectationChart.tsx` | SVG: ось X `L` 1–200, ось Y `E₁(L)` из модуля |
| `src/widgets/MementoRollLab.tsx` | Слайдер/ввод `S`, кнопки, токен, график, таблицы |
| `src/widgets/PercentTokenDemo.tsx` | Опционально `level?: number` — скрыть слайдер уровня, брать `L` снаружи |
| `src/mdx/MdxShell.tsx` | Зарегистрировать `MementoRollLab` в `components` |
| `content/dev/memento-roll.mdx` | Текст формул + `<MementoRollLab />`; убрать прямые `RollLevelDemo`/`PercentTokenDemo` |
| `README.md` | Одна строка: на `/dev/memento-roll` — `MementoRollLab` |
| `src/index.css` (при необходимости) | Узкие классы для графика/таблиц, только если без них ломается тёмная тема |

**Не трогать:** `content/index.mdx` (оставить старые демо в Collapse), `rollCardLevelUp.ts` (только импорт), страницы БД.

**Константы вех (можно в `cardLevelUpStats.ts` или в виджете):**

```ts
export const MILESTONES_LOW = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const
export const MILESTONES_HIGH = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const
```

---

### Task 1: Модуль `cardLevelUpStats`

**Files:**

- Create: `src/memento/cardLevelUpStats.ts`
- Create: `src/memento/cardLevelUpStats.test.ts`

**Контракт:**

- `cardLevelUpSuccessProbability(level: number): number`  
  - Для целого `level >= 1`: если `level > 100` → `0.01`; иначе `(101 - level) / 100`.  
  - Для `level < 1` (защита): можно вернуть `1` как у `rollCardLevelUp(0, r)` (все `r` успешны) **или** явно ограничить демо и не вызывать с `level < 1` — в коде виджета `L` после сброса всегда `>= 1`. План: **для `level < 1` вернуть `1`** чтобы не делить на ноль; график и эмуляция не используют `L < 1`.
- `expectedRollsForOneSuccess(level: number): number` → `1 / cardLevelUpSuccessProbability(level)`.
- `expectedRollsToReachLevel(startLevel: number, targetLevel: number): number` → если `targetLevel <= startLevel` return `0`; иначе `sum(expectedRollsForOneSuccess(L) for L from startLevel to targetLevel-1 inclusive)`.

Проверка согласованности с `rollCardLevelUp`: для выборочных пар `(L,r)` вероятность успеха по перебору `r` совпадает с `cardLevelUpSuccessProbability(L)` (опциональный тест в том же файле).

- [ ] **Step 1: Написать падающий тест**

```ts
import { describe, expect, it } from 'vitest'
import {
  cardLevelUpSuccessProbability,
  expectedRollsForOneSuccess,
  expectedRollsToReachLevel,
} from './cardLevelUpStats'

describe('cardLevelUpStats', () => {
  it('P(1) is 1 and E1 is 1', () => {
    expect(cardLevelUpSuccessProbability(1)).toBe(1)
    expect(expectedRollsForOneSuccess(1)).toBe(1)
  })

  it('P(100) and P(101)', () => {
    expect(cardLevelUpSuccessProbability(100)).toBe(0.01)
    expect(cardLevelUpSuccessProbability(101)).toBe(0.01)
    expect(expectedRollsForOneSuccess(100)).toBe(100)
  })

  it('P(50) matches 51 favorable outcomes', () => {
    expect(cardLevelUpSuccessProbability(50)).toBe(51 / 100)
    expect(expectedRollsForOneSuccess(50)).toBeCloseTo(100 / 51, 10)
  })

  it('E_cum(1, 10) equals sum of E1 for L=1..9', () => {
    let sum = 0
    for (let L = 1; L <= 9; L++) sum += expectedRollsForOneSuccess(L)
    expect(expectedRollsToReachLevel(1, 10)).toBeCloseTo(sum, 10)
  })

  it('E_cum(S, T) is 0 when T <= S', () => {
    expect(expectedRollsToReachLevel(5, 5)).toBe(0)
    expect(expectedRollsToReachLevel(10, 3)).toBe(0)
  })
})
```

- [ ] **Step 2: Запустить тест — ожидается FAIL** (`функции не существуют`)

Run: `npm run test -- src/memento/cardLevelUpStats.test.ts`  
Expected: FAIL (import/module missing)

- [ ] **Step 3: Реализовать `cardLevelUpStats.ts`** минимально под тесты.

- [ ] **Step 4: Запустить тесты — PASS**

Run: `npm run test -- src/memento/cardLevelUpStats.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/memento/cardLevelUpStats.ts src/memento/cardLevelUpStats.test.ts
git commit -m "feat(memento): card level-up expectation stats"
```

---

### Task 2: SVG-график `E₁(L)` для L = 1…200

**Files:**

- Create: `src/widgets/LevelUpExpectationChart.tsx`
- Test (опционально, лёгкий): `src/widgets/LevelUpExpectationChart.test.tsx` — снапшот или `getByRole('img', { name: ... })` если задать `aria-label`

- [ ] **Step 1:** Импортировать `expectedRollsForOneSuccess` из `@/memento/cardLevelUpStats`. Построить массив точек `L = 1..200`.

- [ ] **Step 2:** Отрисовать `<svg>` с полями, полилинией/ломаной, подписями осей («Уровень L», «E₁(L), ожидание бросков до одного успеха»), легендой одной строкой.

- [ ] **Step 3:** Масштаб по Y: `min = 0`, `max = max(E₁(1..200))` (= `100`). Адаптивная ширина: `width="100%"` + `viewBox` или фиксированная ширина ≤ контента вики.

- [ ] **Step 4:** `npm run test` (если добавлен тест) и визуально `npm run dev` открыть страницу после Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/widgets/LevelUpExpectationChart.tsx
git commit -m "feat(widgets): chart E1(L) for card level-up"
```

---

### Task 3: `PercentTokenDemo` — опциональный внешний `level`

**Files:**

- Modify: `src/widgets/PercentTokenDemo.tsx`
- Modify: `src/widgets/MermaidDiagram.test.tsx` или существующий тест виджетов — только если ломается импорт; иначе добавить краткий тест в новом файле `PercentTokenDemo.test.tsx`

Поведение:

- Если передан проп **`level: number`**: не рендерить `Slider` уровня; использовать этот `level` в `resolvePercentToken(level, token)`.
- Если **`level` не передан**: текущее поведение (внутренний `useState` + слайдер).

- [ ] **Step 1:** Рефакторинг с `level` optional + условный слайдер.

- [ ] **Step 2:** `npm run test` — все тесты проекта.

- [ ] **Step 3: Commit**

```bash
git add src/widgets/PercentTokenDemo.tsx
git commit -m "feat(widgets): optional controlled level on PercentTokenDemo"
```

---

### Task 4: Виджет `MementoRollLab`

**Files:**

- Create: `src/widgets/MementoRollLab.tsx`
- Modify: `src/mdx/MdxShell.tsx`

Состояние и UI:

1. **`startLevel` (`S`)**: `Slider` или `Slider` + `InputNumber`, диапазон **1–999**. Начальное значение `1`.
2. **`emulLevel` (`L`)**: начальное `1`. **Не** синхронизировать автоматически при смене `S` (только кнопки).
3. **«Сбросить уровень»**: `setEmulLevel(startLevel)`.
4. **«Поднять уровень»**: `r = Math.floor(Math.random() * 100) + 1`; `ok = rollCardLevelUp(emulLevel, r)`; если `ok`, `setEmulLevel(x => x + 1)`; показать последние `r` и «успех / нет» (`Typography.Text`).
5. **Токен:** `<PercentTokenDemo level={emulLevel} />` (без дублирования слайдера уровня).
6. **График:** `<LevelUpExpectationChart />`.
7. **Таблицы:** две `Table` Ant Design или две секции с маленькими таблицами:
   - строки `MILESTONES_LOW`, колонки «Цель T», «E_cum(S, T)»;
   - строки `MILESTONES_HIGH`, те же колонки.
8. Формат чисел: `Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })`; при `|value| >= 1e7` (порог подобрать) — `toExponential(2)` для читаемости.
9. Над таблицей короткий текст: при `T ≤ S` значение **0**; веха **100** в обеих таблицах **допустима**.

`MdxShell.tsx`: добавить `import { MementoRollLab } from '@/widgets/MementoRollLab'` и ключ `MementoRollLab` в объект `components`.

- [ ] **Step 1:** Реализовать компонент и зарегистрировать в `MdxShell`.

- [ ] **Step 2:** `npm run lint` на затронутых файлах; `npm run test`.

- [ ] **Step 3: Commit**

```bash
git add src/widgets/MementoRollLab.tsx src/mdx/MdxShell.tsx
git commit -m "feat(widgets): MementoRollLab for dev roll page"
```

---

### Task 5: MDX `content/dev/memento-roll.mdx` — формулы и замена демо

**Files:**

- Modify: `content/dev/memento-roll.mdx`

Структура (порядок можно слегка переставить, сохраняя логику «сначала теория»):

1. Frontmatter без изменений по смыслу.
2. Секция **«Формулы: бросок уровня»** — текст на русском:
   - равномерный `r ∈ {1,…,100}`;
   - при `L > 100` успех только при `r = 100`, `P = 1/100`, `E₁ = 100`;
   - при `1 ≤ L ≤ 100` успех при `r ≥ L` (эквивалентно исходам `L…100`), `P = (101−L)/100`, `E₁ = 1/P`;
   - кумулятив `E_cum(S,T) = Σ_{L=S}^{T−1} E₁(L)` при `T > S`, иначе `0`.
3. Секция **«Токены %%»** — кратко три вида (`plain` / `cap` / `neg`) в терминах `resolvePercentToken`, без полного копипаста спеки; отсылка к коду.
4. Импорт: `import { MementoRollLab } from '@/widgets/MementoRollLab'` (или только через глобальный компонент из `MdxShell` — если в проекте принято не импортировать, а писать `<MementoRollLab />` без импорта, следовать **текущему** стилю `memento-roll.mdx`: сейчас там явные импорты — **оставить явный импорт** `MementoRollLab`).
5. Удалить импорты и вставки `RollLevelDemo`, `PercentTokenDemo`.
6. `<MementoRollLab />` после формул.

- [ ] **Step 1:** Вставить текст и компонент.

- [ ] **Step 2:** `npm run build` (или `npm run prebuild && npm run build`) — убедиться, что MDX собирается.

- [ ] **Step 3: Commit**

```bash
git add content/dev/memento-roll.mdx
git commit -m "docs(mdx): formulas and MementoRollLab on memento-roll page"
```

---

### Task 6: README и приёмка

**Files:**

- Modify: `README.md` (параграф про MDX-виджеты)

- [ ] **Step 1:** Упомянуть `<MementoRollLab />` для страницы разработчика о броске/токенах.

- [ ] **Step 2:** Полная проверка: `npm run test`, `npm run lint`, `npm run build`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: mention MementoRollLab in README"
```

---

## Проверка вручную (браузер)

1. Открыть маршрут статьи `memento-roll` (как в `router` — обычно `/dev/memento-roll`).
2. Сменить `S`, убедиться, что таблицы пересчитываются; при `S ≥ 100` первая таблица даёт нули.
3. «Поднять уровень» много раз — `L` растёт только при успехе; токен обновляется от `L`.
4. «Сбросить» — `L === S`.
5. График без обрезания в светлой/тёмной теме.

---

## Следующий шаг после плана

Диспетчеризация **plan-document-reviewer** (или `code-reviewer`) на файлы плана и спеки; после **Approved** — выбор **Subagent-Driven** vs **Inline Execution** для реализации.
