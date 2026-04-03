# Memento Mori — вики

Публичная документация по фреймворку **Memento Mori** (бесконечное улучшение механик). Сайт: React 19, Vite 8, Ant Design 6, MDX.

## Спецификации

- Вики: `docs/superpowers/specs/2026-03-28-memento-wiki-design.md`
- Норматив формул для виджетов (Gen): репозиторий `gen-sp`, файл `docs/superpowers/specs/2026-03-28-gen-game-design.md` и код `src/game/memento/`

## Разработка

```bash
npm install
npm run dev
```

Перед `dev` и `build` автоматически выполняется `scripts/prebuild.mjs`: генерируются `src/generated/nav.json` и `src/generated/db.json` (файлы в `.gitignore`). Без этого шага импорты JSON в приложении не соберутся.

Тот же prebuild дополнительно создаёт **`memento-wiki-export.md`** (консолидированный текст статей для ИИ и IDE) и копию каталога БД в **`public/memento-db.json`**. Копии лежат в `public/` и в `.gitignore`, чтобы не коммитить снимки; они появляются локально и в CI после `predev` / `prebuild`.

```bash
npm run test
npm run test:export
npm run build
```

## Экспорт для ИИ и скачивание

На сайте страница **`/export`**: предпросмотр собранного Markdown и ссылки на скачивание `memento-wiki-export.md` и `memento-db.json`. В шапке есть пункт «Экспорт».

Статические файлы из `public/` (в том числе `.md` и `.json`) при деплое на Vercel обычно отдаются напрямую, до SPA-fallback. После выкладки имеет смысл проверить, что `GET /memento-wiki-export.md` возвращает текст, а не `index.html`.

## Контент

| Путь | Назначение |
|------|------------|
| `content/index.mdx` | Главная `/` |
| `content/players/**/*.mdx` | Раздел для игроков → `/players/...` |
| `content/dev/**/*.mdx` | Для разработчиков → `/dev/...` |
| `content/games/*.mdx` | Примеры игр → `/games/...` |
| `content/db/items/*.yaml` и т.д. | Каталог БД (см. схему в спеке, приложение C) |

Frontmatter статей: `title`, `audience` (`players` \| `dev` \| `both`), опционально `order`, `game`, `menuTitle` (короткая подпись для горизонтального меню в шапке; если нет — в меню попадает `title`). Файл `index.mdx` в подпапке даёт URL каталога без суффикса `/index`.

В MDX доступны виджеты `<RollLevelDemo />`, `<PercentTokenDemo />`, `<MementoRollLab />` (страница `/dev/memento-roll`: формулы, эмуляция, график и таблицы ожиданий), `<CardEmulationSandbox />` (страница `/dev/memento-card-emulation`: текст с токенами `%%`, эмуляция **L** и опционально одного демо-модификатора **Lm**), `<ModifierSlotsLab />` (страница `/dev/memento-modifiers`: слоты по **`L`**, бросок **`Lm`**, демо-оффер из пула) и `<MermaidDiagram definition={...} />` (через `MdxShell` или импорт из `@/widgets/...` при необходимости).

## Деплой (SPA)

Сборка — одностраничное приложение. На хостинге настройте fallback всех путей на `index.html` (например копия `index.html` как `404.html` для GitHub Pages, или `_redirects` на Netlify).

## Импорт в «Базу данных»

Поддерживается слой `content/db/*/generated/*.yaml`: при совпадении `id` с ручной записью поля из generated перезаписывают ручные (см. план в `docs/superpowers/plans/2026-03-28-memento-wiki.md`).
