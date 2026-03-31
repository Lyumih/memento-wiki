# Memento card emulation page — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать страницу `/dev/memento-card-emulation`: песочница текста с подстановкой всех токенов `%%` при текущем `L` и мини-блок эмуляции уровня (`S`, бросок, сброс), без графика/таблиц; ссылка на `/dev/memento-roll`.

**Architecture:** Чистая функция `replacePercentTokensInText(level, text)` в `src/memento/` рядом с парсером токенов; сканирование слева направо регулярным выражением с тем же «телом», что у `TOKEN_RE`, без якорей `^`/`$`. UI — один виджет `CardEmulationSandbox` (Ant Design: `Input.TextArea`, `Card`, `Slider`, `InputNumber`, `Button`), логика броска скопирована по образцу `MementoRollLab` без выноса общего компонента (v1). Регистрация в `MdxShell`.

**Tech Stack:** React 19, TypeScript strict, Ant Design 6, Vitest, `rollCardLevelUp`, `parsePercentToken`, `resolvePercentValue`.

**Спека:** `docs/superpowers/specs/2026-03-31-memento-card-emulation-design.md`

---

## Файлы: создание и изменение

| Файл | Назначение |
|------|------------|
| `src/memento/resolvePercentToken.ts` | Добавить `replacePercentTokensInText`; при необходимости вынести общий фрагмент regex из `TOKEN_RE` (DRY). |
| `src/memento/resolvePercentToken.test.ts` | Тесты для `replacePercentTokensInText`. |
| `src/widgets/CardEmulationSandbox.tsx` | Весь интерактив страницы. |
| `src/mdx/MdxShell.tsx` | Импорт и ключ `CardEmulationSandbox` в `components`. |
| `content/dev/memento-card-emulation.mdx` | Текст + `<CardEmulationSandbox />`. |
| `README.md` | Одна строка в абзаце про виджеты: упомянуть `CardEmulationSandbox` и `/dev/memento-card-emulation`. |

**Не трогать:** `rollCardLevelUp.ts`, `MementoRollLab.tsx` (кроме визуального сравнения при ручной проверке), главная `content/index.mdx`.

---

### Task 1: `replacePercentTokensInText`

**Files:**

- Modify: `src/memento/resolvePercentToken.ts`
- Modify: `src/memento/resolvePercentToken.test.ts`

**Алгоритм (норматив спеки §4.1):**

- Регулярное выражение для поиска: то же, что `TOKEN_RE`, но **без** `^` и `$`, флаг **`g`** (и **`u`**). Пример тела: `/(-?\d+)%%(?:-(\d+)|(\d+))?/gu`.
- Цикл по строке: с позиции `i` искать следующее совпадение; добавить в результат `text.slice(i, m.index)`; взять `candidate = m[0]`; если `resolvePercentValue(level, candidate)` не **`null`**, добавить строку числа, иначе добавить **`candidate`** без изменений; **`i := m.index + candidate.length`**. Если совпадений нет — дописать хвост `text.slice(i)`.
- Это совпадает со спекой («сначала `parsePercentToken`»): **`resolvePercentValue`** внутри вызывает **`parsePercentToken`** и даёт **`null`**, если разбор не прошёл — одной проверки на **`null`** достаточно.
- **Важно:** не вызывать `replace` по всей строке рекурсивно на подставленных числах — только один проход по **исходному** `text`.

- [ ] **Step 1: Написать падающий тест**

В `resolvePercentToken.test.ts` добавить **`replacePercentTokensInText`** во второй импорт из `./resolvePercentToken` и новый `describe`:

```ts
describe('replacePercentTokensInText', () => {
  it('leaves plain text without tokens unchanged', () => {
    expect(replacePercentTokensInText(50, 'hello\nworld')).toBe('hello\nworld')
  })

  it('replaces multiple tokens on one line', () => {
    expect(replacePercentTokensInText(0, 'a 10%% b 20%%50 c')).toBe('a 10 b 20 c')
    // 20%%50 at L=0: 20 * (1 + 0) = 20 per resolvePercentValue(0, '20%%50')
  })

  it('leaves invalid tokens unchanged', () => {
    expect(replacePercentTokensInText(10, 'bad 40%%0 tail')).toBe('bad 40%%0 tail')
    expect(replacePercentTokensInText(10, 'x 40%%-0 y')).toBe('x 40%%-0 y')
  })

  it('handles newlines and plain text', () => {
    const input = 'line1\n40%%\nline2'
    expect(replacePercentTokensInText(100, input)).toBe(`line1\n${80}\nline2`)
  })

  it('does not rematch inside replaced numbers', () => {
    expect(replacePercentTokensInText(0, '10%%')).toBe('10')
    // "10" must not be interpreted as start of new token
  })
})
```

Подправьте ожидаемое значение для `40%%` при `L=100`, если расчёт отличается: сверка с `resolvePercentValue(100, '40%%')` (должно быть **80**).

- [ ] **Step 2: Запустить тесты — ожидается FAIL**

```bash
npm run test -- src/memento/resolvePercentToken.test.ts
```

Ожидается: отсутствие экспорта или падающие assert.

- [ ] **Step 3: Реализовать `replacePercentTokensInText`**

Минимальная реализация по алгоритму выше; экспортировать функцию.

- [ ] **Step 4: Запустить тесты — ожидается PASS**

```bash
npm run test -- src/memento/resolvePercentToken.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/memento/resolvePercentToken.ts src/memento/resolvePercentToken.test.ts
git commit -m "feat(memento): replacePercentTokensInText для песочницы карты"
```

---

### Task 2: Виджет `CardEmulationSandbox`

**Files:**

- Create: `src/widgets/CardEmulationSandbox.tsx`

**Поведение (сверка с `MementoRollLab.tsx`):**

- Состояние: `startLevel` (`S`, 1–999), `emulLevel` (`L`), `lastR`, `lastOk` — как в лаборатории.
- `tryLevelUp`: `r = floor(random*100)+1`, `ok = rollCardLevelUp(emulLevel, r)`, при успехе `L++`.
- `resetLevel`: `L = S`, сброс `lastR`/`lastOk`.
- UI: `Space vertical`, две карточки (или одна с секциями):
  1. **Эмуляция уровня:** подписи `S`, слайдер 1–999, `InputNumber`, текущий `L`, кнопки, строка с последним `r` и успехом.
  2. **Текст:** `Input.TextArea` (несколько рядов, `showCount` опционально), стиль с `white-space: pre-wrap` на блоке **превью**.
  3. **Превью:** `Typography.Paragraph` или `pre` с `useMemo(() => replacePercentTokensInText(emulLevel, draft), [emulLevel, draft])`.

Начальное значение textarea: короткий пример с 1–2 токенами (например строка из спеки или `Урон 40%%50, рост 10%%`).

- [ ] **Step 1: Создать компонент**

Отдельной Story-страницы в проекте нет — полная проверка сборки в Task 3 (`npm run build`).

- [ ] **Step 2: `npm run test`** (регрессия; новых тестов для виджета в v1 не требуется)

- [ ] **Step 3: Commit**

```bash
git add src/widgets/CardEmulationSandbox.tsx
git commit -m "feat(widgets): CardEmulationSandbox для эмуляции карты"
```

---

### Task 3: MDX и `MdxShell`

**Files:**

- Modify: `src/mdx/MdxShell.tsx`
- Modify: `content/dev/memento-card-emulation.mdx`

- [ ] **Step 1:** Импорт `CardEmulationSandbox`, добавить в объект `components`.

- [ ] **Step 2:** В `memento-card-emulation.mdx` заменить заглушку на:

  - абзац цели и границ v1 (песочница, без БД и модов);
  - ссылка `[Бросок уровня карты и токены %%](/dev/memento-roll)` (или актуальный title страницы);
  - `<CardEmulationSandbox />`.

- [ ] **Step 3: Проверка**

```bash
npm run test
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/mdx/MdxShell.tsx content/dev/memento-card-emulation.mdx
git commit -m "docs(dev): страница эмуляции карты и виджет в MDX"
```

---

### Task 4: README

**Files:**

- Modify: `README.md`

- [ ] **Step 1:** В строке про MDX-виджеты добавить `CardEmulationSandbox` и путь `/dev/memento-card-emulation`.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README — CardEmulationSandbox"
```

---

## Ручная приёмка

1. Открыть `/dev/memento-card-emulation`: видны textarea, превью, блок `S`/`L`, ссылка на `memento-roll`.
2. Ввести несколько токенов в одной строке; менять `L` бросками — превью совпадает с `resolvePercentValue` для каждого токена при том же `L` (сверка с **`PercentTokenDemo`** и блоком эмуляции на `/dev/memento-roll` или консолью).
3. Невалидный токен (`40%%0`) остаётся в превью как в источнике.

---

## Критерии готовности

Совпадают с §6 спеки `2026-03-31-memento-card-emulation-design.md`.
