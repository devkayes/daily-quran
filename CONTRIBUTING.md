# Developers Guide

Assalamu Alaykum, and thank you for considering a contribution to **Daily Quran**.

## What changed in 2.0, and why

Earlier versions of this guide banned build tooling, TypeScript, and every
third-party package. The reasoning behind that rule was sound at the time:
Manifest V3 was still moving, background audio was the hard part, and a heavy
dependency could have stranded the project.

That rule has been retired, because it was solving the wrong problem. It ruled
out type checking, tests, and linting — tools that ship *nothing* to users and
catch exactly the class of bug that reached production in v1.x, including an
ayah's number being passed where its surah number belonged, and an event
listener being registered several times a second during playback.

The intent behind the old rule is kept, and it is still binding:

- **Few runtime dependencies, each deliberate.** Anything shipped in the bundle
  must earn its place, and must be replaceable in an afternoon.
- **No analytics, no tracking, no telemetry.** The extension collects nothing.
- **Stay light.** The whole package is well under 1 MB. Keep it that way.

Build-time tooling — TypeScript, Vite, Biome, Vitest, Playwright — is
unrestricted. None of it reaches the user.

## The stack

| Concern | Tool |
| --- | --- |
| Extension framework | [WXT](https://wxt.dev) |
| Language | TypeScript, `strict` |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Messaging | `@webext-core/messaging` |
| Storage | `wxt/storage` |
| Validation | Zod |
| Data fetching | TanStack Query |
| Lint and format | Biome |
| Unit tests | Vitest |
| End-to-end | Playwright |

## Getting started

```bash
corepack enable
pnpm install
cp .env.example .env.development   # then fill in the endpoints
pnpm dev                            # Chrome, with hot reload
pnpm dev:firefox
```

## Before you open a pull request

```bash
pnpm check      # typecheck + lint + unit tests
pnpm build      # must produce a loadable extension
```

For anything touching playback or the popup, also run the end-to-end suite:

```bash
pnpm exec playwright install chromium   # first time only
pnpm build && pnpm test:e2e
```

## House rules

1. **Types are not optional.** `strict` is on, along with
   `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Do not reach for
   `any`; Biome will reject it.
2. **Validate anything that crosses a boundary.** Network responses are parsed
   with Zod before use. Never assign remote content with `innerHTML`.
3. **All state goes through `lib/storage.ts`.** No `localStorage`. An MV3
   service worker cannot see it, which is the whole reason v1's playback state
   was unreachable from the background.
4. **Messages go through `lib/messaging.ts`.** No ad-hoc
   `chrome.runtime.sendMessage` with an untyped object.
5. **User-facing strings go in `public/_locales`.** A key added to
   `MESSAGE_KEYS` without a translation in every locale fails the test suite.
6. **Cover the logic you add.** Pure logic belongs in `lib/` with a Vitest test.
   Behaviour a user can observe belongs in `e2e/`.
7. **Conventional commits.** `feat:`, `fix:`, `refactor:`, `perf:`, `docs:`,
   `chore:`. Releases and the changelog are generated from these, so the prefix
   decides the version bump.
8. **Cross-browser code branches behind an interface.** See
   `lib/audio-controller.ts`: Chrome uses an offscreen document, Firefox uses its
   background event page, and everything above that line is shared.

## Layout

```
entrypoints/
  background.ts        service worker (Chrome) / event page (Firefox)
  offscreen/           audio host for Chrome, where the worker has no DOM
  popup/               React UI
lib/                   shared, testable logic
public/                static assets, icons, _locales
tests/                 Vitest unit tests
e2e/                   Playwright, drives the real built extension
```

By submitting a contribution you agree that it is governed by the project's
[LICENSE](./LICENSE.txt), and that you will not reuse the project code outside
this project.
