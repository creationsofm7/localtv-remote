# Contributing to LocalTV Remote

Thanks for your interest in contributing! This document explains how to propose
changes and what to expect.

## Ground rules

- **All changes go through pull requests.** Direct pushes to `main` are disabled —
  even for the maintainer, work happens on branches and merges via PR.
- **You must sign the CLA.** On your first pull request, the CLA Assistant bot will
  ask you to post a one-line comment to sign the [Contributor License Agreement](CLA.md).
  Your PR can't be merged until it's signed (one time per contributor).
- **CI must pass.** Every PR runs typecheck + build on Windows. Green checks are
  required before merge.
- **Be respectful.** This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting started

```bash
git clone https://github.com/creationsofm7/localtv-remote
cd localtv-remote
npm install
npm run dev        # run the daemon from TypeScript via tsx
```

## Making a change

1. **Fork** the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/short-description
   ```
2. Make your change. Keep it focused — one logical change per PR.
3. Verify locally:
   ```bash
   npm run typecheck
   npm run build
   ```
4. Commit with a clear message (we loosely follow
   [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`,
   `docs:`, `chore:`, `ci:`, `refactor:`).
5. Push and open a pull request against `main`. Fill out the PR template.
6. Sign the CLA when the bot asks, and address any review feedback.

## What makes a good PR

- A clear description of **what** changed and **why**.
- Small and reviewable. Large PRs are split where possible.
- No unrelated formatting churn.
- Updates to docs/README when behavior changes.

## Project layout

See the [Project layout](README.md#project-layout) section of the README for a map
of `src/core`, `src/daemon`, `public/control`, and `scripts/`.

## Reporting bugs / requesting features

Use the **Issues** tab and pick the matching template. For security issues, do
**not** open a public issue — see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the
[Apache License 2.0](LICENSE), as described in the [CLA](CLA.md).
