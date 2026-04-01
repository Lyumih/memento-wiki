# Memento modifiers (встроенные моды) — план реализации в gen-memento-docs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дать в репозитории **gen-memento-docs** эталонную реализацию на TypeScript: пороги слотов по **`L`**, масштаб силы по **`Lm`**, выбор **3** модификаторов из пула, бросок уровня модификатора через **`rollCardLevelUp`**, юнит-тесты и компактный **демо-виджет** на странице `/dev/memento-modifiers`. Боевая логика, персистентность и UI игры остаются в **gen-sp** (отдельный перенос API после стабилизации модулей здесь).

**Architecture:** Чистые функции в `src/memento/` без React; детерминируемый RNG передаётся в функции выбора оффера; виджет только вызывает эти функции и `rollCardLevelUp`. Формула «удвоение к `Lm = 100`» в v1 — **`modifierPotencyMultiplier`**: линейный рост от **1** при **`Lm = 1`** до **2** при **`Lm = 100`**, далее мягкий хвост для демо **`Lm > 100`** (не претендует на финальный баланс из спеки §2.3).

**Tech Stack:** TypeScript, Vitest, React 19, Ant Design 6, существующие модули `rollCardLevelUp`, `cardLevelUpStats` (при необходимости только ссылка в MDX).

---

## Файлы (карта)

| Файл | Назначение |
|------|------------|
| `src/memento/modifierSlots.ts` | Пороги `75 + 100k`, число открытых слотов, флаг «слот разблокирован» |
| `src/memento/modifierSlots.test.ts` | Тесты порогов |
| `src/memento/modifierPotency.ts` | Множитель силы от `Lm`, округлённый процент от базы |
| `src/memento/modifierPotency.test.ts` | Тесты 40→80 при `Lm=100` и края |
| `src/memento/modifierOffer.ts` | Фильтр пула по тегам, выбор 3 с возвращением |
| `src/memento/modifierOffer.test.ts` | Тесты пустого пула, дубликатов в оффере, фильтра |
| `src/memento/rollModifierLevelUp.ts` | Семантический реэкспорт `rollCardLevelUp` |
| `src/memento/rollModifierLevelUp.test.ts` | Совпадение поведения с `rollCardLevelUp` на выборке |
| `src/widgets/ModifierSlotsLab.tsx` | Демо: `L`, открытые слоты, `Lm` слота 0, бросок, пример оффера |
| `src/mdx/MdxShell.tsx` | Регистрация `ModifierSlotsLab` |
| `content/dev/memento-modifiers.mdx` | Вставка `<ModifierSlotsLab />` под вводным текстом |

**Вне объёма этого плана:** YAML-каталог модификаторов в `content/db`, изменения в `gen-sp`, правила двойной/тройной атаки в бою (спека §6 — отдельный документ/план).

---

### Task 1: Пороги слотов по уровню карты `L`

**Files:**

- Create: `src/memento/modifierSlots.ts`
- Create: `src/memento/modifierSlots.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import {
  modifierSlotUnlockLevel,
  modifierUnlockedSlotCount,
  isModifierSlotUnlocked,
} from './modifierSlots'

describe('modifierSlots', () => {
  it('modifierSlotUnlockLevel: k=0 -> 75, k=1 -> 175', () => {
    expect(modifierSlotUnlockLevel(0)).toBe(75)
    expect(modifierSlotUnlockLevel(1)).toBe(175)
    expect(modifierSlotUnlockLevel(2)).toBe(275)
  })

  it('modifierUnlockedSlotCount', () => {
    expect(modifierUnlockedSlotCount(74)).toBe(0)
    expect(modifierUnlockedSlotCount(75)).toBe(1)
    expect(modifierUnlockedSlotCount(174)).toBe(1)
    expect(modifierUnlockedSlotCount(175)).toBe(2)
    expect(modifierUnlockedSlotCount(275)).toBe(3)
  })

  it('isModifierSlotUnlocked', () => {
    expect(isModifierSlotUnlocked(100, 0)).toBe(true)
    expect(isModifierSlotUnlocked(100, 1)).toBe(false)
    expect(isModifierSlotUnlocked(175, 1)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/memento/modifierSlots.test.ts`  
Expected: FAIL (cannot find module `./modifierSlots` or missing exports)

- [ ] **Step 3: Implement `modifierSlots.ts`**

```typescript
/**
 * Порог уровня карты L, начиная с которого доступен слот модификатора с индексом k (k = 0, 1, 2, …).
 * Спека: docs/superpowers/specs/2026-04-01-memento-modifiers-design.md §2.2
 */
export function modifierSlotUnlockLevel(slotIndex: number): number {
  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    throw new RangeError('slotIndex must be a non-negative integer')
  }
  return 75 + 100 * slotIndex
}

/** Число слотов, уже открытых при текущем L (0, если L < 75). */
export function modifierUnlockedSlotCount(cardLevel: number): number {
  if (cardLevel < 75) return 0
  return Math.floor((cardLevel - 75) / 100) + 1
}

export function isModifierSlotUnlocked(cardLevel: number, slotIndex: number): boolean {
  if (slotIndex < 0) return false
  return cardLevel >= modifierSlotUnlockLevel(slotIndex)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/memento/modifierSlots.test.ts`  
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/memento/modifierSlots.ts src/memento/modifierSlots.test.ts
git commit -m "feat(memento): пороги слотов модификаторов по уровню карты L"
```

---

### Task 2: Множитель силы модификатора от `Lm` (v1)

**Files:**

- Create: `src/memento/modifierPotency.ts`
- Create: `src/memento/modifierPotency.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { modifierPotencyMultiplier, modifierScaledPercent } from './modifierPotency'

describe('modifierPotency', () => {
  it('Lm=1 -> multiplier 1; Lm=100 -> multiplier 2', () => {
    expect(modifierPotencyMultiplier(1)).toBe(1)
    expect(modifierPotencyMultiplier(100)).toBe(2)
  })

  it('example 40% base at Lm=100 -> 80', () => {
    expect(modifierScaledPercent(40, 100)).toBe(80)
  })

  it('rejects Lm < 1', () => {
    expect(() => modifierPotencyMultiplier(0)).toThrow(RangeError)
    expect(() => modifierScaledPercent(10, 0)).toThrow(RangeError)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/memento/modifierPotency.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `modifierPotency.ts`**

```typescript
/**
 * v1: линейный рост от 1 при Lm=1 до 2 при Lm=100; для Lm>100 — медленный хвост для демо.
 * Финальная кривая — таблица баланса (спека §2.3).
 */
export function modifierPotencyMultiplier(lm: number): number {
  if (!Number.isInteger(lm) || lm < 1) {
    throw new RangeError('lm must be an integer >= 1')
  }
  if (lm <= 100) {
    return 1 + (lm - 1) / 99
  }
  return 2 + (lm - 100) / 100
}

export function modifierScaledPercent(basePercent: number, lm: number): number {
  return Math.round(basePercent * modifierPotencyMultiplier(lm))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/memento/modifierPotency.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/memento/modifierPotency.ts src/memento/modifierPotency.test.ts
git commit -m "feat(memento): множитель силы модификатора от Lm (v1)"
```

---

### Task 3: Семантический реэкспорт броска для `Lm`

**Files:**

- Create: `src/memento/rollModifierLevelUp.ts`
- Create: `src/memento/rollModifierLevelUp.test.ts`

- [ ] **Step 1: Write `rollModifierLevelUp.ts`**

```typescript
export { rollCardLevelUp as rollModifierLevelUp } from './rollCardLevelUp'
```

- [ ] **Step 2: Write test that aliases match**

```typescript
import { describe, it, expect } from 'vitest'
import { rollCardLevelUp } from './rollCardLevelUp'
import { rollModifierLevelUp } from './rollModifierLevelUp'

describe('rollModifierLevelUp', () => {
  it('matches rollCardLevelUp for sample levels and r', () => {
    const pairs: [number, number][] = [
      [1, 50],
      [50, 49],
      [50, 50],
      [100, 99],
      [100, 100],
      [150, 1],
      [150, 100],
    ]
    for (const [level, r] of pairs) {
      expect(rollModifierLevelUp(level, r)).toBe(rollCardLevelUp(level, r))
    }
  })
})
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/memento/rollModifierLevelUp.test.ts src/memento/rollCardLevelUp.test.ts`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/memento/rollModifierLevelUp.ts src/memento/rollModifierLevelUp.test.ts
git commit -m "feat(memento): rollModifierLevelUp как алиас rollCardLevelUp"
```

---

### Task 4: Пул, теги и оффер из трёх модификаторов

**Files:**

- Create: `src/memento/modifierOffer.ts`
- Create: `src/memento/modifierOffer.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import {
  type ModifierDefLike,
  filterModifierPoolByTags,
  pickModifierOffer,
} from './modifierOffer'

describe('modifierOffer', () => {
  const defs: ModifierDefLike[] = [
    { id: 'a', tags: ['melee', 'attack'] },
    { id: 'b', tags: ['melee'] },
    { id: 'c', tags: ['spell'] },
  ]

  it('filterModifierPoolByTags: empty required -> all', () => {
    expect(filterModifierPoolByTags(defs, []).map((d) => d.id)).toEqual(['a', 'b', 'c'])
  })

  it('filterModifierPoolByTags: melee -> a,b', () => {
    expect(filterModifierPoolByTags(defs, ['melee']).map((d) => d.id)).toEqual(['a', 'b'])
  })

  it('filterModifierPoolByTags: melee+attack -> a', () => {
    expect(filterModifierPoolByTags(defs, ['melee', 'attack']).map((d) => d.id)).toEqual(['a'])
  })

  it('pickModifierOffer: deterministic duplicates', () => {
    const pool = [{ id: 'x' }, { id: 'y' }]
    const indices = [0, 0, 1]
    let i = 0
    const rng = (len: number) => {
      expect(len).toBe(pool.length)
      return indices[i++]!
    }
    const offer = pickModifierOffer(pool, 3, rng)
    expect(offer.map((o) => o.id)).toEqual(['x', 'x', 'y'])
  })

  it('pickModifierOffer: empty pool throws', () => {
    expect(() => pickModifierOffer([], 3, () => 0)).toThrow(/empty/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/memento/modifierOffer.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `modifierOffer.ts`**

```typescript
export type ModifierDefLike = { id: string; tags: string[] }

export function filterModifierPoolByTags(
  defs: ModifierDefLike[],
  requiredTags: string[],
): ModifierDefLike[] {
  if (requiredTags.length === 0) return defs.slice()
  return defs.filter((d) => requiredTags.every((t) => d.tags.includes(t)))
}

/**
 * Три (или count) случайных выбора с возвращением из пула.
 * randomIndex(n) возвращает целое в [0, n).
 */
export function pickModifierOffer<T>(
  pool: T[],
  count: number,
  randomIndex: (n: number) => number,
): T[] {
  if (pool.length === 0) {
    throw new Error('modifier pool is empty')
  }
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative integer')
  }
  const out: T[] = []
  for (let i = 0; i < count; i++) {
    out.push(pool[randomIndex(pool.length)]!)
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/memento/modifierOffer.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/memento/modifierOffer.ts src/memento/modifierOffer.test.ts
git commit -m "feat(memento): фильтр пула по тегам и оффер из трёх модификаторов"
```

---

### Task 5: Виджет `ModifierSlotsLab`

**Files:**

- Create: `src/widgets/ModifierSlotsLab.tsx`
- Modify: `src/mdx/MdxShell.tsx` (добавить компонент в `components`)

- [ ] **Step 1: Add `ModifierSlotsLab.tsx`**

Минимальное поведение:

- `Slider` для **`L`** (например 1…300).
- Текст: **`modifierUnlockedSlotCount(L)`** и список порогов для первых 3 слотов через **`modifierSlotUnlockLevel`**.
- Для демо **слота 0**: `InputNumber` или слайдер **`Lm`** (1…120), кнопка «Бросок +1 к Lm» с `Math.floor(Math.random() * 100) + 1` и **`rollModifierLevelUp(lm, r)`**; показать последние `r` и успех.
- Блок «Пример оффера»: захардкоженный массив `ModifierDefLike`, `filterModifierPoolByTags(..., ['melee'])`, кнопка «Сгенерировать 3 варианта» с `pickModifierOffer(..., 3, () => Math.floor(Math.random() * pool.length))`.
- Показать **`modifierScaledPercent(40, lm)`** как подпись к примеру «двойной удар».

Импорты: `antd` (Card, Space, Slider, Typography, Button, InputNumber), `useState` из `react`, функции из `@/memento/...`.

- [ ] **Step 2: Register in `MdxShell.tsx`**

```typescript
import { ModifierSlotsLab } from '@/widgets/ModifierSlotsLab'

const components = {
  // ...existing
  ModifierSlotsLab,
}
```

- [ ] **Step 3: Run tests and lint**

Run: `npm run test`  
Expected: PASS (все файлы)

Run: `npm run build` (или `npm run prebuild && npm run build` если так принято в проекте)  
Expected: успешная сборка

- [ ] **Step 4: Commit**

```bash
git add src/widgets/ModifierSlotsLab.tsx src/mdx/MdxShell.tsx
git commit -m "feat(widgets): ModifierSlotsLab для демо слотов и Lm"
```

---

### Task 6: Встроить виджет в MDX

**Files:**

- Modify: `content/dev/memento-modifiers.mdx`

- [ ] **Step 1: После первого абзаца (или секции «Не путать с каталогом») вставить**

```mdx
## Интерактив (демо)

<ModifierSlotsLab />
```

Убедиться, что в начале файла **нет** конфликтующих импортов (компонент из `MdxShell`).

- [ ] **Step 2: Проверка ссылок**

Run: `npm run prebuild`  
Expected: `prebuild: nav.json + db.json OK` без ошибок `checkLinks`

- [ ] **Step 3: Commit**

```bash
git add content/dev/memento-modifiers.mdx
git commit -m "docs(mdx): ModifierSlotsLab на странице memento-modifiers"
```

---

### Task 7: Обновить нормативную спеку (ссылка на план)

**Files:**

- Modify: `docs/superpowers/specs/2026-04-01-memento-modifiers-design.md` (§10)

- [ ] **Step 1: В §10 заменить «следующий шаг» на**

Текст вида: план реализации в репозитории вики — `docs/superpowers/plans/2026-04-01-memento-modifiers.md` (эталон TS + демо); перенос в **gen-sp** — отдельный план после стабилизации API.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-01-memento-modifiers-design.md
git commit -m "docs(spec): ссылка на план реализации модификаторов"
```

---

## Plan self-review

**1. Spec coverage (спека 2026-04-01)**

| Требование | Задача |
|------------|--------|
| §2.1 Независимость `L` / `Lm`, тот же закон броска | Task 3 + пояснения в виджете (отдельные кнопки/состояния для `L` и `Lm`) |
| §2.2 Пороги слотов | Task 1 |
| §2.3 Рост значения (ориентир ×2 к 100) | Task 2 (`modifierScaledPercent` 40→80) |
| §3 Оффер из 3, дубликаты, пул | Task 4 + Task 5 |
| §4 Бросок `Lm` = `rollCardLevelUp` | Task 3 |
| §5 Единый каркас (типы пула) | Task 4 (`ModifierDefLike`) |
| §8 Критерии приёмки | Покрыты тестами Task 1–4; UI демонстрирует пороги и бросок |
| §6 Порядок в бою / комбо ударов | Вне объёма (явно в плане) |
| §9 Вне объёма v1 | Не входит |

**2. Placeholder scan:** нет TBD/TODO в шагах.

**3. Type consistency:** `rollModifierLevelUp(level, r)` совпадает с `rollCardLevelUp`; `randomIndex(n)` везде **0…n−1**.

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-01-memento-modifiers.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — отдельный субагент на каждую задачу, ревью между задачами, быстрые итерации.  
2. **Inline Execution** — выполнять задачи в этой сессии пакетами с чекпоинтами.

**Which approach?**
