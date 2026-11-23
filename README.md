# AlgoStreak Club

Daily algorithm challenge for a small group of friends. One shared junior-level problem per day, solved locally in your own IDE and submitted as a Pull Request.

## Rules

- Tasks and solutions are plain JavaScript (ES modules, Node.js 24). The club tooling in `src/` is TypeScript; you never need to touch it.
- A new challenge starts every day at 00:00 UTC; the dates in `schedule/` are UTC dates.
- Your solution goes into `solutions/<github-username>/<YYYY-MM-DD>-<challenge-id>/` with `solution.js` and a short `README.md`.
- One PR per solution. Touch only your own folder.
- A day counts towards your streak when the PR is merged with a green check before the end of that challenge's UTC date. You merge your own PR.
- If today's challenge is still open, your current streak is not broken yet.
- Trust model: honour system. Tests are visible to everyone; please do not edit them or the workflows.

## Daily flow

1. Read today's task in `challenges/<id>/statement.md`.
2. Copy `starter/solution.js` into your solution folder and solve it.
3. Run the tests locally.
4. Open a PR using the template: data structures, Big O, an optional note.

## Repository layout

- `challenges/` — tasks and their tests, see [challenges/README.md](challenges/README.md).
- `schedule/` — which task runs on which UTC date.
- `solutions/` — everyone's solutions.
- `src/` — catalog validation and, later, streak and review scripts.

## Development

Requires Node.js 24 (see `.nvmrc`).

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run validate
```

## License

Mixed licensing:

- Code, workflows, tasks written by the club and tasks adapted from Exercism are under the MIT License ([LICENSE](LICENSE)).
- Tasks adapted from CSES stay under CC BY-NC-SA 4.0; each such folder in `challenges/` has its own `LICENSE`, and the MIT License does not apply to it.
- Every borrowed task is credited in [ATTRIBUTION.md](ATTRIBUTION.md).

Status: MVP 0, in setup. Spec: [docs/specs/mvp-0-club-repo.md](docs/specs/mvp-0-club-repo.md).
