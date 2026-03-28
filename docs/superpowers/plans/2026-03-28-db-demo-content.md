# Демо-контент каталога «База данных» — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить вымышленные YAML-записи в `content/db/items`, `content/db/skills`, `content/db/mods` согласно спеке, удалить устаревший `sample.yaml`, убедиться что `prebuild` и сборка проходят.

**Architecture:** Один файл YAML = одна сущность; поля совпадают со схемой Zod в `scripts/lib/buildDb.mjs`. Две игры (`gen`, `arcade-demo`) для демонстрации фильтра в UI. Проверка — без новых unit-тестов: интеграционно через `npm run prebuild` (и при желании `npm run build`).

**Tech Stack:** YAML, существующий `scripts/lib/buildDb.mjs` (Zod, js-yaml), npm-скрипты репозитория.

**Спека:** `docs/superpowers/specs/2026-03-28-db-demo-content-design.md`

---

## Карта файлов

| Путь | Действие |
|------|----------|
| `content/db/items/*.yaml` | Создать 6 новых файлов; **удалить** `sample.yaml` |
| `content/db/skills/*.yaml` | Создать 6 файлов (каталог при отсутствии — создать) |
| `content/db/mods/*.yaml` | Создать 6 файлов (каталог при отсутствии — создать) |
| `scripts/lib/buildDb.mjs` | Только сверка полей при сомнениях (изменять не планируется) |

**Сверка схемы перед авторингом** (обязательные поля): `id`, `game`, `type`, `name`, `summary`; опционально `body`. Значение `type` должно совпадать с папкой: `item` / `skill` / `modifier`.

**Имена файлов:** совпадают с `id` + `.yaml` (kebab-case), чтобы не путаться при поиске.

---

### Task 1: Предметы, игра `gen`

**Files:**
- Create: `content/db/items/rusty-training-blade.yaml`
- Create: `content/db/items/salve-of-questionable-origin.yaml`
- Create: `content/db/items/key-to-the-void-door.yaml`

- [ ] **Step 1:** Создать `rusty-training-blade.yaml`:

```yaml
id: rusty-training-blade
game: gen
type: item
name: Ржавый тренировочный клинок
summary: Стандартный меч из первого квеста — больше моральный якорь, чем оружие.
body: |
  Выдаётся наставником с фразой «Это не легенда, это старт». Урон скромный,
  зато предмет идеально подходит для демонстрации строки «уровень растёт от использования»
  на страницах вики — без отсылки к реальному балансу какой-либо игры.
```

- [ ] **Step 2:** Создать `salve-of-questionable-origin.yaml`:

```yaml
id: salve-of-questionable-origin
game: gen
type: item
name: Мазь сомнительного происхождения
summary: Восстанавливает немного здоровья и немного самоуважения героя.
```

- [ ] **Step 3:** Создать `key-to-the-void-door.yaml`:

```yaml
id: key-to-the-void-door
game: gen
type: item
name: Ключ от двери в никуда
summary: Подходит к замку, которого на карте не существует — чисто квестовый абсурд.
body: |
  Описание в журнале: «Щёлк». Дверь не открылась, зато всплыло достижение
  «Оптимист». На вики такие вещи полезны как пример «флейворного» предмета без боевой механики.
```

- [ ] **Step 4: Commit**

```bash
git add content/db/items/rusty-training-blade.yaml content/db/items/salve-of-questionable-origin.yaml content/db/items/key-to-the-void-door.yaml
git commit -m "content(db): demo items for gen game"
```

---

### Task 2: Предметы, игра `arcade-demo`

**Files:**
- Create: `content/db/items/neon-stim-pack.yaml`
- Create: `content/db/items/combo-meter-trinket.yaml`
- Create: `content/db/items/boss-token-souvenir.yaml`

- [ ] **Step 1:** Создать `neon-stim-pack.yaml`:

```yaml
id: neon-stim-pack
game: arcade-demo
type: item
name: Неоновый стим-пакет
summary: Одноразовый буст скорости — вспышка на экране и лёгкая вина перед сюжетом.
body: |
  В вымышленном аркадном режиме даёт три секунды «световой дорожки».
  Запись в каталоге показывает, как одна и та же схема YAML работает для другой `game` в фильтре списка.
```

- [ ] **Step 2:** Создать `combo-meter-trinket.yaml`:

```yaml
id: combo-meter-trinket
game: arcade-demo
type: item
name: Брелок «счётчик комбо»
summary: Не влияет на урон, но мигает приятнее, чем индикатор батареи.
```

- [ ] **Step 3:** Создать `boss-token-souvenir.yaml`:

```yaml
id: boss-token-souvenir
game: arcade-demo
type: item
name: Сувенирный жетон босса
summary: Трофей за победу над боссом, который на самом деле был учебным манекеном.
```

- [ ] **Step 4: Commit**

```bash
git add content/db/items/neon-stim-pack.yaml content/db/items/combo-meter-trinket.yaml content/db/items/boss-token-souvenir.yaml
git commit -m "content(db): demo items for arcade-demo game"
```

---

### Task 3: Умения, смесь игр

**Files:**
- Create: `content/db/skills/wide-arc-slash.yaml`
- Create: `content/db/skills/second-wind-whisper.yaml`
- Create: `content/db/skills/ui-friendly-blink.yaml`
- Create: `content/db/skills/hyper-dash-arcade.yaml`
- Create: `content/db/skills/score-ego-boost.yaml`
- Create: `content/db/skills/continue-screen-zen.yaml`

- [ ] **Step 1:** Создать `wide-arc-slash.yaml`:

```yaml
id: wide-arc-slash
game: gen
type: skill
name: Рубящий взмах
summary: Базовая атака по дуге — понятна даже тем, кто не читал правила.
```

- [ ] **Step 2:** Создать `second-wind-whisper.yaml`:

```yaml
id: second-wind-whisper
game: gen
type: skill
name: Шёпот второго дыхания
summary: Пассивка: один раз за бой может подправить исход проверки «усталость».
body: |
  В демо-тексте не привязана к формулам — только к идее «пассивное умение с редким срабатыванием».
  Удобно показать разницу между кратким summary и развёрнутым body на карточке.
```

- [ ] **Step 3:** Создать `ui-friendly-blink.yaml`:

```yaml
id: ui-friendly-blink
game: gen
type: skill
name: Дружелюбное мигание
summary: Системная подсказка в обличье умения — мигает, когда пора нажать «Понятно».
```

- [ ] **Step 4:** Создать `hyper-dash-arcade.yaml`:

```yaml
id: hyper-dash-arcade
game: arcade-demo
type: skill
name: Гипер-рывок
summary: Рывок с шлейфом из пикселей; в тексте каталога — чистая витрина скилла.
```

- [ ] **Step 5:** Создать `score-ego-boost.yaml`:

```yaml
id: score-ego-boost
game: arcade-demo
type: skill
name: Эго-буст по очкам
summary: Чем выше комбо, тем громче звук собственной значимости в наушниках.
body: |
  Намёк на масштабирование от «счётчика» без чисел — чтобы не путать демо-вики с балансом Gen.
```

- [ ] **Step 6:** Создать `continue-screen-zen.yaml`:

```yaml
id: continue-screen-zen
game: arcade-demo
type: skill
name: Дзен экрана продолжения
summary: Пассивно снижает панику при надписи «Game Over» на долю секунды.
```

- [ ] **Step 7: Commit**

```bash
git add content/db/skills/
git commit -m "content(db): demo skills for gen and arcade-demo"
```

---

### Task 4: Модификаторы, смесь игр

**Files:**
- Create: `content/db/mods/floor-blessing-luck.yaml`
- Create: `content/db/mods/heavy-contract.yaml`
- Create: `content/db/mods/double-treasure-clause.yaml`
- Create: `content/db/mods/extra-credit-life.yaml`
- Create: `content/db/mods/screen-shake-amplifier.yaml`
- Create: `content/db/mods/timer-anxiety.yaml`

- [ ] **Step 1:** Создать `floor-blessing-luck.yaml`:

```yaml
id: floor-blessing-luck
game: gen
type: modifier
name: Благословение этажа — удача
summary: До выхода с уровня лут чуть щедрее на «вкусные» подписи.
```

- [ ] **Step 2:** Создать `heavy-contract.yaml`:

```yaml
id: heavy-contract
game: gen
type: modifier
name: Тяжёлый контракт
summary: Враги сильнее, зато подпись в углу экрана выглядит серьёзнее.
body: |
  Классический «дебафф забега» в мягкой формулировке. Подходит для списка модификаторов
  без привязки к конкретным числам из Gen.
```

- [ ] **Step 3:** Создать `double-treasure-clause.yaml`:

```yaml
id: double-treasure-clause
game: gen
type: modifier
name: Оговорка о двойной добыче
summary: Сундуки иногда содержат два визуально идентичных предмета — шутка каталога.
```

- [ ] **Step 4:** Создать `extra-credit-life.yaml`:

```yaml
id: extra-credit-life
game: arcade-demo
type: modifier
name: Жизнь за кредиты
summary: Одна «жетонная» смерть не заканчивает забег — будто в зале осталась мелочь.
```

- [ ] **Step 5:** Создать `screen-shake-amplifier.yaml`:

```yaml
id: screen-shake-amplifier
game: arcade-demo
type: modifier
name: Усилитель тряски экрана
summary: Визуальный мод: всё важное происходит с драмой earthquake-lite.
```

- [ ] **Step 6:** Создать `timer-anxiety.yaml`:

```yaml
id: timer-anxiety
game: arcade-demo
type: modifier
name: Тревога таймера
summary: На экране тикает полоска; каталог описывает её как правило настроения, не кода.
body: |
  Имитация модификатора «давление времени». Текст намеренно без секунд и процентов —
  только читаемое описание для страницы `/db/mods/:id`.
```

- [ ] **Step 7: Commit**

```bash
git add content/db/mods/
git commit -m "content(db): demo modifiers for gen and arcade-demo"
```

---

### Task 5: Удалить старый sample и проверить сборку

**Files:**
- Delete: `content/db/items/sample.yaml`

- [ ] **Step 1:** Удалить `content/db/items/sample.yaml` (заменён осмысленным набором; дубликат по смыслу «демо-меча» не нужен).

- [ ] **Step 2:** Запустить prebuild из корня репозитория:

```bash
cd c:/sites/gen-memento-docs
npm run prebuild
```

Ожидается: завершение без ошибок Zod, в логе `prebuild: nav.json + db.json OK`.

- [ ] **Step 3 (опционально):** Полная сборка:

```bash
npm run build
```

Ожидается: успешный exit code.

- [ ] **Step 4:** Быстрая ручная сверка `src/generated/db.json` (после prebuild): в каждом из массивов `items`, `skills`, `modifiers` ≥ 6 записей; в каждом массиве есть хотя бы одна запись с `"game": "gen"` и хотя бы одна с `"game": "arcade-demo"`.

- [ ] **Step 5: Commit**

```bash
git rm content/db/items/sample.yaml
git commit -m "chore(db): remove placeholder sample item"
```

(Если удаление удобнее сделать в одном коммите с первым батчем предметов — допустимо, главное чтобы `sample.yaml` не остался в репозитории.)

---

### Task 6: Финальная проверка

- [ ] **Step 1:** `npm run test` — убедиться, что регрессий нет (должно быть зелёным как до изменений).

- [ ] **Step 2:** При необходимости обновить `README.md` только если после реализации обнаружится явное расхождение с реальностью; **по умолчанию не менять** (спека демо-контента не требует).

---

## Примечание для исполнителя

Если `content/db/skills` или `content/db/mods` отсутствуют, создать каталоги перед добавлением файлов. Не вводить новые поля в YAML без изменения `entitySchema` в `buildDb.mjs` (вне этого плана).
