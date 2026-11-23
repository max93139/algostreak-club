---
tags:
  - spec
project: algostreak
status: in-progress
created: 2026-11-23
branch: feature/catalog-foundation
prs:
  - https://github.com/max93139/algostreak-club/pull/1
  - https://github.com/max93139/algostreak-club/pull/2
---
# AlgoStreak – MVP 0 club-repo

## Мета
Запустити двотижневий тест AlgoStreak серед друзів та одногрупників за `$0`: один спільний репозиторій `algostreak-club`, де кожен щодня здає рішення задачі дня через PR, автоматична перевірка зараховує його, streak рахується у `streaks.json`, а група отримує сповіщення в Telegram. Перевіряємо гіпотезу з розділу 17 AlgoStreak – Product Concept, рішення — з розділу 23.

## Критерії готовності

Структура репозиторію
- [ ] Є `challenges/<id>/` з `statement.md`, `metadata.json` (`id`, `title`, `difficulty`, `topics`, `timeLimitMs`, `stressSize`, `source`, `sourceUrl`, `license`), `public.test.js`, `stress.test.js` і `starter/solution.js` для 14 задач.
- [ ] Задачі взято з дозволених джерел (див. «Джерела задач»); у кожній `metadata.json` заповнені `source`, `sourceUrl` і `license`, а `ATTRIBUTION.md` у корені перелічує всі запозичені задачі з посиланнями та ліцензіями. Скрипт валідації падає, якщо ці поля порожні.
- [x] Є `schedule/2026.json` (або `schedule/<рік>.json`), що мапить UTC-дату на `id` задачі; скрипт валідації падає, якщо дата повторюється або `id` не існує.
- [ ] Рішення лежать у `solutions/<github-username>/<YYYY-MM-DD>-<id>/solution.js` + `README.md` за шаблоном PR-журналу (Approach, Complexity, Data Structures, What I Learned).
- [x] Є `.github/PULL_REQUEST_TEMPLATE.md` зі швидким журналом: теги структур даних, Time/Space Big O, 1 необов'язкова нотатка.
- [x] `README.md` описує правила streak (UTC, зарахування після merge до кінця UTC-дати задачі, модель довіри «чесне слово») і щоденний флоу.

Перевірка PR
- [ ] Workflow `check.yml` на `pull_request` визначає папку рішення, дату й `id` задачі та запускає `public.test.js` і `stress.test.js` проти `solutions/<user>/<date>-<id>/solution.js`.
- [ ] Check падає, якщо PR змінює файли поза `solutions/<автор PR>/` (чужі папки, `challenges/`, `.github/`, `scripts/`), якщо дата в імені папки не збігається з `schedule`, або якщо в PR більше однієї папки рішення.
- [ ] Стрес-тест: еталонне `O(n)`-рішення вкладається в `timeLimitMs`, а еталонне `O(n²)` перевищує його щонайменше в 10 разів на `ubuntu-latest`; ліміт = ×3–5 від часу еталонного рішення. Перевіряється скриптом калібрування, результат записано в `metadata.json`.
- [ ] Branch protection на `main`: merge тільки через PR зі зеленим required status check — саме job `check`, а не весь workflow, щоб пропущене чи червоне рев'ю не блокувало merge. Учасник мерджить свій PR сам; auto-merge не вмикається.

Gemini-рев'ю
- [ ] Workflow `review.yml` на `workflow_run` (завершення `check.yml` зі статусом success) робить 1 запит до Gemini Flash (Free Tier) на head SHA PR. Повторний запуск на тому ж SHA новий коментар не створює.
- [ ] `review.yml` не робить checkout і не виконує код PR: файл рішення й опис PR беруться через GitHub API як дані.
- [ ] Бот залишає 1 коментар у PR: оцінка Time/Space Big O за кодом, чи відповідає Big O з опису PR коду, 1 конкретна порада.
- [ ] Рев'ю не блокує merge: помилка API, ліміт або відсутній `GEMINI_API_KEY` пропускають job без падіння `check`.
- [ ] `check.yml` (тригер `pull_request`) не використовує жодних секретів. Причина: учасники — collaborators і пушать гілки в той самий repo, тому workflow із PR-гілки, включно з новим `.yml`, виконується з доступом до repo-секретів.

Streak
- [ ] `scripts/streaks.ts` будує `streaks.json` (`current`, `longest`, `total`, `lastSolvedDate` на кожного учасника) з merged PR через GitHub API.
- [ ] Unit-тести алгоритму покривають: незакритий сьогоднішній день не обриває серію; пропущений день обриває; merge після кінця UTC-дати задачі не зараховується; кілька PR за один день дають +1; `longest` зберігається після обриву.
- [ ] Workflow `streaks.yml` запускається на `push` у `main` і за cron `15 0 * * *`, має `concurrency: streaks`, комітить `streaks.json` тільки при зміні.
- [ ] Після merge в Telegram-чат приходить повідомлення «<ім'я> закрив Daily #<n> за <Time Big O>! Поточний streak: <n> днів 🔥»; за cron — денний підсумок. Імена беруться з `members.json` (`github` → `displayName`).
- [ ] Якщо секрет `TELEGRAM_BOT_TOKEN` відсутній, крок сповіщення пропускається без падіння workflow.

Інфраструктура коду
- [x] TypeScript, Node.js LTS, Vitest; `npm run typecheck`, `npm run lint`, `npm test` проходять локально й у CI.
- [ ] Секрети (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `GEMINI_API_KEY`) лежать тільки в GitHub Environment `bot` з deployment branch rule «тільки `main`», а не в repo-level secrets; у коді й логах їх немає. Environment використовують лише `streaks.yml` і `review.yml`, які виконуються з `main`.
- [ ] Перевірено вручну: тестовий PR-воркфлоу з гілки, що звертається до `secrets.GEMINI_API_KEY`, отримує порожнє значення.

## Обмеження та рішення
- Модель довіри — «чесне слово»: тести публічні в межах repo, прихованих тестів і захисту від підміни workflow немає. Свідомо прийнято для MVP 0.
- Еталонні рішення в repo не комітяться; в `metadata.json` зберігається тільки відкалібрований `timeLimitMs`.
- Патерн: Clean Architecture — домен (streak, schedule) без залежностей від GitHub API і fs. Use cases: розбір PR (папка, дата, `id`), підрахунок streak, формування рев'ю й повідомлень — без прямих викликів API. Адаптери: GitHub API (PR, comments, commits), Gemini-клієнт, Telegram-клієнт, fs.
- Поза скоупом: CLI (`algo today/test/submit`) — окрема спека; персональні repo (Варіант Б, MVP 1); GitHub App, SVG-бейдж (MVP 2); Streak Freeze; Part 2 follow-up.
- Gemini: перед стартом перевірити актуальну назву моделі Flash, ліміти Free Tier і умови використання даних (Free Tier може використовувати запити для покращення продуктів Google). Код учасника йде в промпт як дані; коментар бота інформаційний, тому prompt injection у коді не впливає на зарахування.

## Джерела задач
Не пишемо всі задачі самі: стартова база збирається з відкритих наборів, авторські задачі додаються поступово.

**Рівень задач у MVP 0 — junior.** Усі 14 задач мають `difficulty` `easy` або нижній `medium`, розв'язуються за 15–30 хв і покривають базові теми: Arrays, Strings, Hash Map / Set, Two Pointers, Stack, Binary Search, проста Sorting. DP, графи й складна комбінаторика — після MVP 0. З CSES підходить переважно розділ Introductory Problems. Скрипт валідації падає, якщо в `schedule` MVP 0 потрапила задача з `difficulty: hard`.
- **Exercism [problem-specifications](https://github.com/exercism/problem-specifications)** — основне джерело для MVP 0. Ліцензія MIT; умови в Markdown, тестові дані в `canonical-data.json` конвертуються в `public.test.js`. Беремо тільки алгоритмічні вправи, бо багато задач там на роботу з даними. Атрибуція обов'язкова.
- **[CSES Problem Set](https://cses.fi/problemset/)** — ~400 класичних алгоритмічних задач (Sorting and Searching, DP, Graphs, Trees, Strings, Mathematics). Ліцензія CC BY-NC-SA 4.0: допустимо для некомерційного club-repo з атрибуцією, але адаптовані умови мають лишатися під CC BY-NC-SA, а перед будь-яким комерційним використанням їх треба прибрати або отримати дозвіл. У `metadata.json` такі задачі позначаються `"license": "CC-BY-NC-SA-4.0"`.
- **[Codeforces API](https://codeforces.com/apiHelp/methods)** (`problemset.problems`) — тільки для пошуку, тегів, складності й посилань на оригінали. Умови не копіюємо: API їх не надає і права на копіювання не дає.
- **[ICPC Problem Archive](https://icpc.io/archive)** — є умови, тестові дані й розв'язки, але дозвіл на поширення треба перевіряти для кожного пакета окремо. У MVP 0 не використовуємо без такої перевірки.
- **Авторські задачі** — ліцензія repo; умову, еталонне рішення й тести перевіряє людина, навіть якщо чернетку допоміг скласти AI.

## Ліцензування repo
- Кореневий `LICENSE` — MIT: код, workflow, скрипти, авторські задачі, задачі з Exercism (MIT, з атрибуцією в `ATTRIBUTION.md`).
- Кожна папка `challenges/<id>/` із задачею CSES містить власний `LICENSE` з текстом CC BY-NC-SA 4.0 і атрибуцією; MIT на неї не поширюється.
- `README.md` прямо каже, що repo має змішане ліцензування, і перелічує винятки.
- [x] Скрипт валідації падає, якщо задача з `"license": "CC-BY-NC-SA-4.0"` не має `LICENSE` у своїй папці.
- Мова задач і рішень — JavaScript (ES modules, Node.js 24), рішення користувача від 2026-11-23; інфраструктурний код у `src/` лишається на TypeScript.
- `$0`: тільки GitHub Free (Actions minutes) і Telegram Bot API.
- Repo: `max93139/algostreak-club`, особистий акаунт без організації, публічний (на Free-плані branch protection працює лише для публічних repo). Учасники додаються як collaborators. Рішення видно всім — режим Open Practice.

## Відкриті питання
- Дата старту двотижневого тесту (перша дата в `schedule`) — користувач напише пізніше; на реалізацію інфраструктури не впливає.

Змінено 2026-11-23 на прохання користувача: файли задач і рішень — `.js` замість `.ts` (критерії структури repo й перевірки PR оновлено).

Вирішено 2026-11-23: джерела задач — див. «Джерела задач»; рівень задач MVP 0 — junior; учасник мерджить PR сам; Gemini-рев'ю входить у цю спеку; ліцензія repo — MIT для коду, авторських задач і задач Exercism, а задачі CSES лишаються під CC BY-NC-SA 4.0 (див. «Ліцензування repo»).

## Нотатки реалізації
<!-- Заповнює Клод: гілка, ключові рішення, PR. -->

Спеку реалізуємо 5 PR (етапи):
1. Фундамент — `feature/catalog-foundation`: tooling, формат задач, валідатор каталогу (`npm run validate`), LICENSE / ATTRIBUTION / README / шаблон PR, CI `ci.yml`.
2. `check.yml`: перевірка рішень PR, калібрування стрес-тесту, branch protection.
3. Streak: `streaks.json`, `streaks.yml`, Telegram, Environment `bot`, `members.json`.
4. Gemini-рев'ю: `review.yml` на `workflow_run`.
5. 14 junior-задач і `schedule` (потрібна дата старту).

Етап 1 (2026-11-23):
- Перевірено `schedule` (дублікати дат у тому числі між файлами, невідомий `id`, неіснуюча дата, рік не збігається з файлом, `hard` у MVP 0): `src/domain/catalog.test.ts` → `checkSchedules`.
- Перевірено `LICENSE` для CC-BY-NC-SA-4.0: `catalog.test.ts` → «requires a LICENSE file for CC-BY-NC-SA-4.0 tasks».
- Перевірено шаблон PR і правила в README: вручну, `.github/PULL_REQUEST_TEMPLATE.md`, `README.md`.
- Частково: перевірки порожніх `source` / `sourceUrl` / `license` і `ATTRIBUTION.md` уже є (`validate-catalog.test.ts`, `checkAttribution`), але критерій закриється разом із 14 задачами на етапі 5.
- Рішення: код скриптів лежить у `src/` (domain / application / adapters / cli), а не в `scripts/`. На етапі 2 `check.yml` має забороняти зміни в `src/`, а не в `scripts/`.
- Рішення: Node 24 запускає `.ts` напряму (type stripping), тому `tsx` і збірка не потрібні; `tsconfig` має `erasableSyntaxOnly` і `allowImportingTsExtensions`.
- Перевірено `typecheck` / `lint` / `test` локально (`project-preflight-check`, 32 тести) і в CI (`ci.yml`, run 45085327499 на PR #2).
- Рішення: тільки адаптер знає розкладку файлів repo; домен і use case отримують `location` від адаптера (знахідка pattern-reviewer).
- Рішення: атрибуція перевіряється точним збігом URL, а не підрядком; `zod` лежить в `application` як валідація недовіреного вводу.
- Lockfile, згенерований на macOS, ламав `npm ci` на Linux (не було опційних `@emnapi/*`); виправлено повною перегенерацією lockfile.
- PR етапу 1: https://github.com/max93139/algostreak-club/pull/2.
- Рішення: `schedule/<YYYY>.json` — масив `{ date, challengeId }`, а не об'єкт `дата → id`, бо `JSON.parse` мовчки поглинає дублікати ключів і дублікат дати неможливо було б виявити.
