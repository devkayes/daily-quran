# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-09-05

A technical release. No new features: the extension does what 1.1.3 did, on a
foundation that can be maintained. See [CONTRIBUTING.md](./CONTRIBUTING.md) for
the stack and the reasoning.

### Changed
- Rebuilt on [WXT](https://wxt.dev) with TypeScript in `strict` mode, React 19
  and Tailwind CSS v4. The extension now has a build step, a type checker, a
  linter and a test suite.
- Playback state moved from `localStorage` to `chrome.storage`. An MV3 service
  worker cannot read `localStorage`, so half of v1's state was structurally
  invisible to the background.
- Messages between the popup, background and audio host are a typed protocol
  instead of untyped `{ type }` objects routed through a string `switch`.
- The ayah API response is validated with Zod before rendering, so an
  unexpected shape produces an error state instead of a broken popup.
- The popup renders the last ayah from cache immediately and revalidates behind
  it, instead of showing a hardcoded verse until the reload button was pressed.
- Audio for Firefox plays in the background event page rather than an offscreen
  document, behind a shared interface. Chrome and Edge are unchanged.
- Endpoints moved from an untracked `config.js` of globals to `.env` files
  resolved at build time.
- "Restart" now rewinds and plays from the beginning, rather than stopping.

### Added
- Bengali and English translations via `_locales`, following the browser's
  language. A missing translation now fails the test suite.
- MediaSession support, so OS media keys and the system player control
  recitation.
- 53 unit tests and 6 end-to-end tests that drive the real built extension.
- GitHub Actions for typecheck, lint, tests, both browser builds, and releases.

### Security
- Content Security Policy tightened to `default-src 'self'` with an explicit
  allowlist per directive, and network hosts declared as `host_permissions`.
- Removed the invalid `https://www.kayes.dev/*` CSP source, which could never
  have matched.

### Removed
- `offline_enabled` from the manifest. Every ayah and recitation is fetched over
  the network, so the claim was not accurate.

## [1.1.3] - 2026-09-05
### Security
- Ayah text from the API is now written with `textContent` instead of `innerHTML`, so remote content can no longer inject markup into the extension page.

### Fixed
- "আরও পড়ুন" now opens the correct surah. It was passing the ayah number where the surah number belonged.
- The audio timeline no longer accumulates a new event listener on every playback tick (previously ~4 per second).
- "Restart" now rewinds to the beginning and reports its state back, so the popup no longer shows a pause button over stopped audio.
- The service worker no longer wakes for every `timeupdate` broadcast from the offscreen document.

### Changed
- Shipped real 16/32/48/128 icons instead of downscaling a single 2000×2000 image. Package assets dropped from 1.2 MB to 164 KB.
- Removed the Google Fonts `@import` for a font the stylesheet never applied, eliminating a third-party request on every popup open.
- Added accessible names to the audio controls.

## [1.1.2] - 2025-02-09
### Fixed
- Added new FIve Surah 
    - Al Bakara
    - Al Imraan
    - Al Nisa
    - Al Maida
    - Al Anam

## [1.1.1] - 2025-01-07
### Fixed
- Resolved Chrome Web Store installation warnings.

## [1.0.0] - 2025-01-05
### Added
- Released version 1.0.0 of the Daily Quran extension.
- Added functionality to access random Ayahs with Bengali translations.
- Integrated audio playback for Surahs with customizable controls.
- Background audio support for uninterrupted playback.
- Feature to resume audio from the last paused point.
- Volume control for audio customization.

### Fixed
- Initial release with essential features working.


<!-- Template

## [Unreleased]
### Added
- Initial draft for Changelog file.
  
### Changed
- Structure and format for better readability.

### Fixed
- N/A 
    -->