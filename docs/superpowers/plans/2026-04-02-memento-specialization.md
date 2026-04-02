# Memento specialization — план реализации в gen-memento-docs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать в **gen-memento-docs** эталонные функции **эффективных параметров** специализации (класс Memento), бросок уровня с **`levelUpBonusSteps`**, пороги слотов с **`firstModifierSlotLevel`** / **`modifierSlotStep`**, вероятность успеха с бонусом, демо-виджет **`SpecializationLab`** на [/dev/memento-specialization](/dev/memento-specialization). Норматив: `docs/superpowers/specs/2026-04-02-memento-specialization-design.md`.

**Architecture:** Новый модуль **`mementoSpecialization.ts`** (типы, база, `resolveMementoSpecialization`). **`rollCardLevelUpWithSpecialization`** вызывает **`rollCardLevelUp(L_eff, r)`** при **`currentLevel ≤ 100`**, иначе — базовый бросок. **`modifierSlots`** расширяется **опциональным** аргументом **`ResolvedMementoSpecialization`** (по умолчанию база — регрессия старых тестов). **`cardLevelUpStats`** — функция вероятности с бонусом через **`L_eff`**. Виджет только читает эти функции. Игровой **`previewNextModifierOffer`** в лаборатории отображается как флаг из пресета; симуляция «следующего оффера» в v1 не обязательна (§7 спеки — опционально).

**Tech Stack:** TypeScript, Vitest, React 19, Ant Design 6, существующие `rollCardLevelUp`, `modifierSlots`, `pickModifierOffer` (уже принимает **`count`**).

---

## Файлы (карта)

| Файл | Назначение |
|------|------------|
| `src/memento/mementoSpecialization.ts` | Тип пресета, база, `resolveMementoSpecialization`, именованные демо-пресеты из спеки §6 |
| `src/memento/mementoSpecialization.test.ts` | Слияние с базой, границы полей |
| `src/memento/rollCardLevelUpWithSpecialization.ts` | Обертка броска по §3.1 спеки |
| `src/memento/rollCardLevelUpWithSpecialization.test.ts` | `L=75`, `b=1`, `r=74` → успех; `L>100` игнор бонуса |
| `src/memento/modifierSlots.ts` | Опциональный второй аргумент `eff`; формула `first + step·k` и счётчик слотов |
| `src/memento/modifierSlots.test.ts` | Старые кейсы без второго аргумента; новые с `first=25` |
| `src/memento/cardLevelUpStats.ts` | `cardLevelUpSuccessProbabilityWithBonus` |
| `src/memento/cardLevelUpStats.test.ts` | Вероятность при `b=1` совпадает с `P(L_eff)` |
| `src/widgets/SpecializationLab.tsx` | Выбор пресета, `L`, таблица эффективных параметров, `P` база vs с бонусом, пороги слотов 0–2 |
| `src/mdx/MdxShell.tsx` | Регистрация `SpecializationLab` |
| `content/dev/memento-specialization.mdx` | `<SpecializationLab />` под вводным текстом |

**Вне объёма:** персистентность, gen-sp, изменение `ModifierSlotsLab` (по желанию позже передать `eff` вручную — не в этом плане).

---

### Task 1: `resolveMementoSpecialization` и базовый пресет

**Files:**

- Create: `src/memento/mementoSpecialization.ts`
- Create: `src/memento/mementoSpecialization.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import {
  BASE_MEMENTO_SPECIALIZATION,
  resolveMementoSpecialization,
  DEMO_SPECIALIZATION_PRESETS,
} from './mementoSpecialization'

describe('mementoSpecialization', () => {
  it('resolveMementoSpecialization: пустой объект даёт базу', () => {
    expect(resolveMementoSpecialization({})).toEqual(BASE_MEMENTO_SPECIALIZATION)
  })

  it('resolveMementoSpecialization: частичное перекрытие', () => {
    const r = resolveMementoSpecialization({
      modifierOfferCount: 5,
      firstModifierSlotLevel: 25,
    })
    expect(r.modifierOfferCount).toBe(5)
    expect(r.firstModifierSlotLevel).toBe(25)
    expect(r.modifierSlotStep).toBe(BASE_MEMENTO_SPECIALIZATION.modifierSlotStep)
    expect(r.levelUpBonusSteps).toBe(0)
  })

  it('DEMO_SPECIALIZATION_PRESETS содержит ключи из спеки §6', () => {
    expect(DEMO_SPECIALIZATION_PRESETS.base).toEqual({})
    expect(DEMO_SPECIALIZATION_PRESETS.wideChoice.modifierOfferCount).toBe(5)
    expect(DEMO_SPECIALIZATION_PRESETS.earlyMods.firstModifierSlotLevel).toBe(25)
    expect(DEMO_SPECIALIZATION_PRESETS.lucky.levelUpBonusSteps).toBe(1)
    expect(DEMO_SPECIALIZATION_PRESETS.oracle.previewNextModifierOffer).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/memento/mementoSpecialization.test.ts`  
Expected: FAIL (module missing or exports missing)

- [ ] **Step 3: Implement `mementoSpecialization.ts`**

```typescript
/**
 * Спека: docs/superpowers/specs/2026-04-02-memento-specialization-design.md §3
 */

export type MementoSpecializationPreset = {
  levelUpBonusSteps?: number
  modifierOfferCount?: number
  firstModifierSlotLevel?: number
  modifierSlotStep?: number
  previewNextModifierOffer?: boolean
}

export type ResolvedMementoSpecialization = Required<MementoSpecializationPreset>

export const BASE_MEMENTO_SPECIALIZATION: ResolvedMementoSpecialization = {
  levelUpBonusSteps: 0,
  modifierOfferCount: 3,
  firstModifierSlotLevel: 75,
  modifierSlotStep: 100,
  previewNextModifierOffer: false,
}

export function resolveMementoSpecialization(
  preset: MementoSpecializationPreset = {},
): ResolvedMementoSpecialization {
  return { ...BASE_MEMENTO_SPECIALIZATION, ...preset }
}

/** Иллюстративные пресеты — таблица §6 спеки (имена рабочие). */
export const DEMO_SPECIALIZATION_PRESETS: Record<string, MementoSpecializationPreset> =
  {
    base: {},
    wideChoice: { modifierOfferCount: 5 },
    earlyMods: { firstModifierSlotLevel: 25 },
    lucky: { levelUpBonusSteps: 1 },
    oracle: { previewNextModifierOffer: true },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/memento/mementoSpecialization.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/memento/mementoSpecialization.ts src/memento/mementoSpecialization.test.ts
git commit -m "feat(memento): resolveMementoSpecialization and demo presets"
```

---

### Task 2: Бросок уровня с `levelUpBonusSteps`

**Files:**

- Create: `src/memento/rollCardLevelUpWithSpecialization.ts`
- Create: `src/memento/rollCardLevelUpWithSpecialization.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { rollCardLevelUp } from './rollCardLevelUp'
import { rollCardLevelUpWithSpecialization } from './rollCardLevelUpWithSpecialization'

describe('rollCardLevelUpWithSpecialization', () => {
  it('при L<=100 использует L_eff = max(1, L - b) через rollCardLevelUp', () => {
    const L = 75
    const b = 1
    const r = 74
    expect(rollCardLevelUp(L, r)).toBe(false)
    expect(rollCardLevelUpWithSpecialization(L, r, b)).toBe(rollCardLevelUp(74, r))
    expect(rollCardLevelUpWithSpecialization(L, r, b)).toBe(true)
  })

  it('при L>100 бонус не применяется', () => {
    const L = 101
    expect(rollCardLevelUpWithSpecialization(L, 99, 5)).toBe(
      rollCardLevelUp(L, 99),
    )
    expect(rollCardLevelUpWithSpecialization(L, 100, 5)).toBe(true)
  })

  it('b=0 совпадает с rollCardLevelUp для L<=100', () => {
    for (const L of [1, 50, 100]) {
      for (const r of [1, 50, 100]) {
        expect(rollCardLevelUpWithSpecialization(L, r, 0)).toBe(rollCardLevelUp(L, r))
      }
    }
  })

  it('отрицательный b — RangeError', () => {
    expect(() => rollCardLevelUpWithSpecialization(10, 50, -1)).toThrow(RangeError)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/memento/rollCardLevelUpWithSpecialization.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement**

```typescript
import { rollCardLevelUp } from './rollCardLevelUp'

/**
 * Бросок повышения уровня с учётом levelUpBonusSteps (§3.1 спеки specialization).
 */
export function rollCardLevelUpWithSpecialization(
  currentLevel: number,
  randomInt1to100: number,
  levelUpBonusSteps: number,
): boolean {
  if (!Number.isInteger(levelUpBonusSteps) || levelUpBonusSteps < 0) {
    throw new RangeError('levelUpBonusSteps must be a non-negative integer')
  }
  if (currentLevel > 100) {
    return rollCardLevelUp(currentLevel, randomInt1to100)
  }
  const L_eff = Math.max(1, currentLevel - levelUpBonusSteps)
  return rollCardLevelUp(L_eff, randomInt1to100)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/memento/rollCardLevelUpWithSpecialization.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/memento/rollCardLevelUpWithSpecialization.ts src/memento/rollCardLevelUpWithSpecialization.test.ts
git commit -m "feat(memento): rollCardLevelUpWithSpecialization (L_eff bonus)"
```

---

### Task 3: Пороги слотов с эффективными `first` / `step`

**Files:**

- Modify: `src/memento/modifierSlots.ts`
- Modify: `src/memento/modifierSlots.test.ts`

- [ ] **Step 1: Write new tests (расширение файла)**

Добавить в конец `describe` новый блок:

```typescript
import {
  BASE_MEMENTO_SPECIALIZATION,
  resolveMementoSpecialization,
} from './mementoSpecialization'

// ...

  describe('with specialization (first=25, step=100)', () => {
    const eff = resolveMementoSpecialization({
      firstModifierSlotLevel: 25,
      modifierSlotStep: 100,
    })

    it('modifierSlotUnlockLevel с eff', () => {
      expect(modifierSlotUnlockLevel(0, eff)).toBe(25)
      expect(modifierSlotUnlockLevel(1, eff)).toBe(125)
      expect(modifierSlotUnlockLevel(2, eff)).toBe(225)
    })

    it('modifierUnlockedSlotCount с eff', () => {
      expect(modifierUnlockedSlotCount(24, eff)).toBe(0)
      expect(modifierUnlockedSlotCount(25, eff)).toBe(1)
      expect(modifierUnlockedSlotCount(124, eff)).toBe(1)
      expect(modifierUnlockedSlotCount(125, eff)).toBe(2)
    })
  })
```

Запустить: `npx vitest run src/memento/modifierSlots.test.ts`  
Expected: FAIL (second argument not supported)

- [ ] **Step 2: Implement изменения в `modifierSlots.ts`**

```typescript
import {
  BASE_MEMENTO_SPECIALIZATION,
  type ResolvedMementoSpecialization,
} from './mementoSpecialization'

function assertValidEff(eff: ResolvedMementoSpecialization): void {
  if (eff.firstModifierSlotLevel < 1 || !Number.isInteger(eff.firstModifierSlotLevel)) {
    throw new RangeError('firstModifierSlotLevel must be integer >= 1')
  }
  if (eff.modifierSlotStep < 1 || !Number.isInteger(eff.modifierSlotStep)) {
    throw new RangeError('modifierSlotStep must be integer >= 1')
  }
}

/**
 * Порог L для слота k: firstModifierSlotLevel + modifierSlotStep * k (§3 спеки specialization).
 */
export function modifierSlotUnlockLevel(
  slotIndex: number,
  eff: ResolvedMementoSpecialization = BASE_MEMENTO_SPECIALIZATION,
): number {
  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    throw new RangeError('slotIndex must be a non-negative integer')
  }
  assertValidEff(eff)
  return eff.firstModifierSlotLevel + eff.modifierSlotStep * slotIndex
}

export function modifierUnlockedSlotCount(
  cardLevel: number,
  eff: ResolvedMementoSpecialization = BASE_MEMENTO_SPECIALIZATION,
): number {
  assertValidEff(eff)
  const first = eff.firstModifierSlotLevel
  const step = eff.modifierSlotStep
  if (cardLevel < first) return 0
  return Math.floor((cardLevel - first) / step) + 1
}

export function isModifierSlotUnlocked(
  cardLevel: number,
  slotIndex: number,
  eff: ResolvedMementoSpecialization = BASE_MEMENTO_SPECIALIZATION,
): boolean {
  if (slotIndex < 0) return false
  return cardLevel >= modifierSlotUnlockLevel(slotIndex, eff)
}
```

- [ ] **Step 3: Run full modifierSlots tests**

Run: `npx vitest run src/memento/modifierSlots.test.ts`  
Expected: PASS (все старые + новые)

- [ ] **Step 4: Commit**

```bash
git add src/memento/modifierSlots.ts src/memento/modifierSlots.test.ts
git commit -m "feat(memento): modifier slot thresholds from ResolvedMementoSpecialization"
```

---

### Task 4: Вероятность успеха с бонусом

**Files:**

- Modify: `src/memento/cardLevelUpStats.ts`
- Modify: `src/memento/cardLevelUpStats.test.ts`

- [ ] **Step 1: Add failing tests**

Расширить импорт из `./cardLevelUpStats`: добавить `cardLevelUpSuccessProbabilityWithBonus`.

```typescript
import {
  cardLevelUpSuccessProbability,
  cardLevelUpSuccessProbabilityWithBonus,
} from './cardLevelUpStats'

// внутри describe('cardLevelUpStats'):
  it('cardLevelUpSuccessProbabilityWithBonus: L<=100 совпадает с P(L_eff)', () => {
    const L = 75
    const b = 1
    const L_eff = Math.max(1, L - b)
    expect(cardLevelUpSuccessProbabilityWithBonus(L, b)).toBe(
      cardLevelUpSuccessProbability(L_eff),
    )
  })

  it('cardLevelUpSuccessProbabilityWithBonus: L>100 игнорирует b', () => {
    expect(cardLevelUpSuccessProbabilityWithBonus(101, 5)).toBe(
      cardLevelUpSuccessProbability(101),
    )
  })
```

Run: `npx vitest run src/memento/cardLevelUpStats.test.ts`  
Expected: FAIL

- [ ] **Step 2: Implement**

Добавить в `cardLevelUpStats.ts`:

```typescript
/**
 * Вероятность успеха одного броска с levelUpBonusSteps (§3.1 спеки specialization).
 * При L > 100 бонус не применяется.
 */
export function cardLevelUpSuccessProbabilityWithBonus(
  level: number,
  levelUpBonusSteps: number,
): number {
  if (!Number.isInteger(levelUpBonusSteps) || levelUpBonusSteps < 0) {
    throw new RangeError('levelUpBonusSteps must be a non-negative integer')
  }
  if (level > 100) {
    return cardLevelUpSuccessProbability(level)
  }
  const L_eff = Math.max(1, level - levelUpBonusSteps)
  return cardLevelUpSuccessProbability(L_eff)
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/memento/cardLevelUpStats.test.ts`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/memento/cardLevelUpStats.ts src/memento/cardLevelUpStats.test.ts
git commit -m "feat(memento): cardLevelUpSuccessProbabilityWithBonus"
```

---

### Task 5: `SpecializationLab` и MDX

**Files:**

- Create: `src/widgets/SpecializationLab.tsx`
- Modify: `src/mdx/MdxShell.tsx`
- Modify: `content/dev/memento-specialization.mdx`

- [ ] **Step 1: Implement виджет**

Паттерн: как `ModifierSlotsLab` — `Card`, `Typography`, `Select` для ключа из `Object.keys(DEMO_SPECIALIZATION_PRESETS)`, `Slider` или `InputNumber` для **`L`** в диапазоне **1…300**, `Table` или `Descriptions`:

- строки: `levelUpBonusSteps`, `modifierOfferCount`, `firstModifierSlotLevel`, `modifierSlotStep`, `previewNextModifierOffer` (да/нет);
- столбцы: значение из `resolveMementoSpecialization(selectedPreset)`;
- дополнительно: при текущем **`L`**: `P_base = cardLevelUpSuccessProbability(L)`, `P_spec = cardLevelUpSuccessProbabilityWithBonus(L, eff.levelUpBonusSteps)`;
- пороги слотов **0, 1, 2**: `modifierSlotUnlockLevel(k, eff)`.

Импорты: `react` `useState`, `antd`, `@/memento/mementoSpecialization`, `@/memento/cardLevelUpStats`, `@/memento/modifierSlots`.

- [ ] **Step 2: Register in `MdxShell.tsx`**

Добавить импорт `SpecializationLab` и ключ в объект `components`.

- [ ] **Step 3: MDX**

В `content/dev/memento-specialization.mdx` после первого абзаца (перед ссылкой на путь спеки) вставить `<SpecializationLab />`, убрать или сократить абзац «Интерактив» про отложенную фазу — заменить на «ниже лаборатория по спеке §7 (минимальный контракт v1)».

- [ ] **Step 4: Verify**

Run: `npm run prebuild`  
Expected: `prebuild: nav.json + db.json OK`

Run: `npx vitest run src/memento`  
Expected: все тесты PASS

- [ ] **Step 5: Commit**

```bash
git add src/widgets/SpecializationLab.tsx src/mdx/MdxShell.tsx content/dev/memento-specialization.mdx
git commit -m "feat(wiki): SpecializationLab on memento-specialization page"
```

---

## Проверка плана по спеке

| Раздел спеки | Покрытие |
|--------------|----------|
| §3 таблица параметров | Task 1 `resolve`, Task 3 слоты, Task 4 P, виджет показывает все поля |
| §3.1 бонус броска | Task 2, Task 4 |
| §3.2 предпросмотр | Отображение флага в лаборатории (Task 5); RNG-оффер опущен (опционально позже) |
| §4 стекинг v1 | Не требует кода |
| §5 согласованность | Регрессия `modifierSlots` без второго аргумента |
| §7 SpecializationLab | Task 5 минимальный контракт |
| §8 критерии приёмки | Тесты Task 1–4 + нулевой пресет |

**Plan complete and saved to `docs/superpowers/plans/2026-04-02-memento-specialization.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — отдельный субагент на каждую задачу, ревью между задачами.

**2. Inline Execution** — выполнение задач в этой сессии пакетами с чекпоинтами.

**Which approach?**
