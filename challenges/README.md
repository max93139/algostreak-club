# Challenges

One directory per task, named after its `id` (kebab-case). Starters and tests are plain JavaScript ES modules:

```text
challenges/<id>/
├── statement.md
├── metadata.json
├── public.test.js
├── stress.test.js
├── starter/
│   └── solution.js
└── LICENSE            # required only for CC-BY-NC-SA-4.0 tasks
```

`metadata.json`:

```json
{
  "id": "two-sum",
  "title": "Two Sum",
  "difficulty": "easy",
  "topics": ["arrays", "hash-map"],
  "timeLimitMs": 500,
  "stressSize": 100000,
  "source": "exercism",
  "sourceUrl": "https://github.com/exercism/problem-specifications/tree/main/exercises/two-sum",
  "license": "MIT"
}
```

- `difficulty`: `easy`, `medium` or `hard`. MVP 0 schedules junior-level tasks only, so `hard` is rejected in `schedule/`.
- `source`: `original` for tasks written by the club; anything else must be listed in `ATTRIBUTION.md` by `sourceUrl`.
- `timeLimitMs` is calibrated on `ubuntu-latest`: 3–5× the reference solution's time. Reference solutions are not committed.

`schedule/<YYYY>.json` maps UTC dates to tasks:

```json
[{ "date": "2026-12-01", "challengeId": "two-sum" }]
```

Run `npm run validate` before opening a PR that touches `challenges/` or `schedule/`.
