---
tags:
  - spec
project: algostreak
status: draft
created: 2026-11-23
branch: 
prs: []
---
# AlgoStreak – MVP 0 club-repo

## Мета
Запустити двотижневий тест AlgoStreak серед друзів та одногрупників за `$0`: один спільний репозиторій `algostreak-club`, де кожен щодня здає рішення задачі дня через PR, автоматична перевірка зараховує його, streak рахується у `streaks.json`, а група отримує сповіщення в Telegram. Перевіряємо гіпотезу з розділу 17 AlgoStreak – Product Concept, рішення — з розділу 23.

## Критерії готовності

Структура репозиторію
- [ ] Є `challenges/<id>/` з `statement.md`, `metadata.json` (`id`, `title`, `difficulty`, `topics`, `timeLimitMs`, `stressSize`, `source`, `sourceUrl`, `license`), `public.test.ts`, `stress.test.ts` і `starter/solution.ts` для 14 задач.
- [ ] Задачі взято з дозволених джерел (див. «Джерела задач»); у кожній `metadata.json` заповнені `source`, `sourceUrl` і `license`, а `ATTRIBUTION.md` у корені перелічує всі запозичені задачі з посиланнями та ліцензіями. Скрипт валідації падає, якщо ці поля порожні.
- [ ] Є `schedule/2026.json` (або `schedule/<рік>.json`), що мапить UTC-дату на `id` задачі; скрипт валідації падає, якщо дата повторюється або `id` не існує.
- [ ] Рішення лежать у `solutions/<github-username>/<YYYY-MM-DD>-<id>/solution.ts` + `README.md` за шаблоном PR-журналу (Approach, Complexity, Data Structures, What I Learned).
- [ ] Є `.github/PULL_REQUEST_TEMPLATE.md` зі швидким журналом: теги структур даних, Time/Space Big O, 1 необов'язкова нотатка.
- [ ] `README.md` описує правила streak (UTC, зарахування після merge до кінця UTC-дати задачі, модель довіри «чесне слово») і щоденний флоу.

Перевірка PR
- [ ] Workflow `check.yml` на `pull_request` визначає папку рішення, дату й `id` задачі та запускає `public.test.ts` і `stress.test.ts` проти `solutions/<user>/<date>-<id>/solution.ts`.
- [ ] Check падає, якщо PR змінює файли поза `solutions/<автор PR>/` (чужі папки, `challenges/`, `.github/`, `scripts/`), якщо дата в імені папки не збігається з `schedule`, або якщо в PR більше однієї папки рішення.
- [ ] Стрес-тест: еталонне `O(n)`-рішення вкладається в `timeLimitMs`, а еталонне `O(n²)` перевищує його щонайменше в 10 разів на `ubuntu-latest`; ліміт = ×3–5 від часу еталонного рішення. Перевіряється скриптом калібрування, результат записано в `metadata.json`.
- [ ] Branch protection на `main`: merge тільки через PR зі зеленим `check`. Учасник мерджить свій PR сам; auto-merge не вмикається.

Gemini-рев'ю
- [ ] Job `review` у `check.yml` запускається тільки після зеленого `check` і робить 1 запит до Gemini Flash (Free Tier) на head SHA PR. Повторний запуск на тому ж SHA новий коментар не створює.
- [ ] Бот залишає 1 коментар у PR: оцінка Time/Space Big O за кодом, чи відповідає Big O з опису PR коду, 1 конкретна порада.
- [ ] Рев'ю не блокує merge: помилка API, ліміт або відсутній `GEMINI_API_KEY` пропускають job без падіння `check`.
- [ ] Workflow використовує тригер `pull_request`, не `pull_request_target`, щоб PR із форків стороннього користувача не отримували секрети.

Streak
- [ ] `scripts/streaks.ts` будує `streaks.json` (`current`, `longest`, `total`, `lastSolvedDate` на кожного учасника) з merged PR через GitHub API.
- [ ] Unit-тести алгоритму покривають: незакритий сьогоднішній день не обриває серію; пропущений день обриває; merge після кінця UTC-дати задачі не зараховується; кілька PR за один день дають +1; `longest` зберігається після обриву.
- [ ] Workflow `streaks.yml` запускається на `push` у `main` і за cron `15 0 * * *`, має `concurrency: streaks`, комітить `streaks.json` тільки при зміні.
- [ ] Після merge в Telegram-чат приходить повідомлення «<ім'я> закрив Daily #<n> за <Time Big O>! Поточний streak: <n> днів 🔥»; за cron — денний підсумок. Імена беруться з `members.json` (`github` → `displayName`).
- [ ] Якщо секрет `TELEGRAM_BOT_TOKEN` відсутній, крок сповіщення пропускається без падіння workflow.

Інфраструктура коду
- [ ] TypeScript, Node.js LTS, Vitest; `npm run typecheck`, `npm run lint`, `npm test` проходять локально й у CI.
- [ ] Секрети (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `GEMINI_API_KEY`) лежать тільки в secrets club-repo; у коді й логах їх немає.

## Обмеження та рішення
- Модель довіри — «чесне слово»: тести публічні в межах repo, прихованих тестів і захисту від підміни workflow немає. Свідомо прийнято для MVP 0.
- Еталонні рішення в repo не комітяться; в `metadata.json` зберігається тільки відкалібрований `timeLimitMs`.
- Патерн: Clean Architecture — домен (streak, schedule) без залежностей від GitHub API і fs; адаптери окремо.
- Поза скоупом: CLI (`algo today/test/submit`) — окрема спека; персональні repo (Варіант Б, MVP 1); GitHub App, SVG-бейдж (MVP 2); Streak Freeze; Part 2 follow-up.
- Gemini: перед стартом перевірити актуальну назву моделі Flash, ліміти Free Tier і умови використання даних (Free Tier може використовувати запити для покращення продуктів Google). Код учасника йде в промпт як дані; коментар бота інформаційний, тому prompt injection у коді не впливає на зарахування.

## Джерела задач
Не пишемо всі задачі самі: стартова база збирається з відкритих наборів, авторські задачі додаються поступово.
- **Exercism [problem-specifications](https://github.com/exercism/problem-specifications)** — основне джерело для MVP 0. Ліцензія MIT; умови в Markdown, тестові дані в `canonical-data.json` конвертуються в `public.test.ts`. Беремо тільки алгоритмічні вправи, бо багато задач там на роботу з даними. Атрибуція обов'язкова.
- **[CSES Problem Set](https://cses.fi/problemset/)** — ~400 класичних алгоритмічних задач (Sorting and Searching, DP, Graphs, Trees, Strings, Mathematics). Ліцензія CC BY-NC-SA 4.0: допустимо для некомерційного club-repo з атрибуцією, але адаптовані умови мають лишатися під CC BY-NC-SA, а перед будь-яким комерційним використанням їх треба прибрати або отримати дозвіл. У `metadata.json` такі задачі позначаються `"license": "CC-BY-NC-SA-4.0"`.
- **[Codeforces API](https://codeforces.com/apiHelp/methods)** (`problemset.problems`) — тільки для пошуку, тегів, складності й посилань на оригінали. Умови не копіюємо: API їх не надає і права на копіювання не дає.
- **[ICPC Problem Archive](https://icpc.io/archive)** — є умови, тестові дані й розв'язки, але дозвіл на поширення треба перевіряти для кожного пакета окремо. У MVP 0 не використовуємо без такої перевірки.
- **Авторські задачі** — ліцензія repo; умову, еталонне рішення й тести перевіряє людина, навіть якщо чернетку допоміг скласти AI.
- `$0`: тільки GitHub Free (Actions minutes) і Telegram Bot API.
- Repo: `max93139/algostreak-club`, особистий акаунт без організації, публічний (на Free-плані branch protection працює лише для публічних repo). Учасники додаються як collaborators. Рішення видно всім — режим Open Practice.

## Відкриті питання
- Дата старту двотижневого тесту (перша дата в `schedule`) — користувач напише пізніше; на реалізацію інфраструктури не впливає.
- Ліцензія самого repo (MIT для коду й авторських задач?) і як поєднати її з CC BY-NC-SA для задач із CSES.

Вирішено 2026-11-23: джерела задач — див. «Джерела задач»; учасник мерджить PR сам; Gemini-рев'ю входить у цю спеку.

## Нотатки реалізації
<!-- Заповнює Клод: гілка, ключові рішення, PR. -->
