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
- [ ] Є `challenges/<id>/` з `statement.md`, `metadata.json` (`id`, `title`, `difficulty`, `topics`, `timeLimitMs`, `stressSize`, `source`, `license`), `public.test.ts`, `stress.test.ts` і `starter/solution.ts` для 14 задач.
- [ ] Є `schedule/2026.json` (або `schedule/<рік>.json`), що мапить UTC-дату на `id` задачі; скрипт валідації падає, якщо дата повторюється або `id` не існує.
- [ ] Рішення лежать у `solutions/<github-username>/<YYYY-MM-DD>-<id>/solution.ts` + `README.md` за шаблоном PR-журналу (Approach, Complexity, Data Structures, What I Learned).
- [ ] Є `.github/PULL_REQUEST_TEMPLATE.md` зі швидким журналом: теги структур даних, Time/Space Big O, 1 необов'язкова нотатка.
- [ ] `README.md` описує правила streak (UTC, зарахування після merge до кінця UTC-дати задачі, модель довіри «чесне слово») і щоденний флоу.

Перевірка PR
- [ ] Workflow `check.yml` на `pull_request` визначає папку рішення, дату й `id` задачі та запускає `public.test.ts` і `stress.test.ts` проти `solutions/<user>/<date>-<id>/solution.ts`.
- [ ] Check падає, якщо PR змінює файли поза `solutions/<автор PR>/` (чужі папки, `challenges/`, `.github/`, `scripts/`), якщо дата в імені папки не збігається з `schedule`, або якщо в PR більше однієї папки рішення.
- [ ] Стрес-тест: еталонне `O(n)`-рішення вкладається в `timeLimitMs`, а еталонне `O(n²)` перевищує його щонайменше в 10 разів на `ubuntu-latest`; ліміт = ×3–5 від часу еталонного рішення. Перевіряється скриптом калібрування, результат записано в `metadata.json`.
- [ ] Branch protection на `main`: merge тільки через PR зі зеленим `check`.

Streak
- [ ] `scripts/streaks.ts` будує `streaks.json` (`current`, `longest`, `total`, `lastSolvedDate` на кожного учасника) з merged PR через GitHub API.
- [ ] Unit-тести алгоритму покривають: незакритий сьогоднішній день не обриває серію; пропущений день обриває; merge після кінця UTC-дати задачі не зараховується; кілька PR за один день дають +1; `longest` зберігається після обриву.
- [ ] Workflow `streaks.yml` запускається на `push` у `main` і за cron `15 0 * * *`, має `concurrency: streaks`, комітить `streaks.json` тільки при зміні.
- [ ] Після merge в Telegram-чат приходить повідомлення «<ім'я> закрив Daily #<n> за <Time Big O>! Поточний streak: <n> днів 🔥»; за cron — денний підсумок. Імена беруться з `members.json` (`github` → `displayName`).
- [ ] Якщо секрет `TELEGRAM_BOT_TOKEN` відсутній, крок сповіщення пропускається без падіння workflow.

Інфраструктура коду
- [ ] TypeScript, Node.js LTS, Vitest; `npm run typecheck`, `npm run lint`, `npm test` проходять локально й у CI.
- [ ] Секрети (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) лежать тільки в secrets club-repo; у коді й логах їх немає.

## Обмеження та рішення
- Модель довіри — «чесне слово»: тести публічні в межах repo, прихованих тестів і захисту від підміни workflow немає. Свідомо прийнято для MVP 0.
- Еталонні рішення в repo не комітяться; в `metadata.json` зберігається тільки відкалібрований `timeLimitMs`.
- Патерн: Clean Architecture — домен (streak, schedule) без залежностей від GitHub API і fs; адаптери окремо.
- Поза скоупом: CLI (`algo today/test/submit`) — окрема спека; Gemini-рев'ю; персональні repo (Варіант Б, MVP 1); GitHub App, SVG-бейдж (MVP 2); Streak Freeze; Part 2 follow-up.
- `$0`: тільки GitHub Free (Actions minutes) і Telegram Bot API.
- Repo: `max93139/algostreak-club`, особистий акаунт без організації, публічний (на Free-плані branch protection працює лише для публічних repo). Учасники додаються як collaborators. Рішення видно всім — режим Open Practice.

## Відкриті питання
- Дата старту двотижневого тесту (перша дата в `schedule`).
- Хто пише 14 задач і звідки: авторські, Exercism (з атрибуцією) чи інше.
- Merge: учасник мерджить свій PR сам після зеленого check, чи вмикаємо auto-merge?
- Чи додавати Gemini-рев'ю в цю ж спеку, чи окремою після запуску.

## Нотатки реалізації
<!-- Заповнює Клод: гілка, ключові рішення, PR. -->
