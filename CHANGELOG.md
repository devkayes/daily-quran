# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- A **BN/EN translation toggle** at the top of the popup, defaulting to
  Bengali. Bengali keeps using the existing source unchanged; English is looked
  up per ayah from AlQuran Cloud (`en.sahih`) by `surah:ayah` reference, so
  switching language never changes which verse is shown. In English the surah
  name and ayah number switch to English and Western digits too. The choice
  persists, and a fetched translation is cached with the ayah so a reopened
  popup renders it without a request.
- **Audio controls in the page right-click menu**, under a single "Daily Quran"
  entry: play/pause, restart, previous and next surah, and a continuous
  checkbox. The play/pause label follows the actual playback state, and the
  checkbox stays in step with the popup in both directions. Needs the new
  `contextMenus` permission.
- A **continuous playback** control: a repeat button in the transport row that
  highlights when on. Finishing a surah then starts the next one automatically.
  It stops after An-Nas rather than wrapping back to Al-Fatiha, and the setting
  persists. The advance runs in the background, so it works with the popup
  closed.
- Source credits in the footer, naming and linking the ayah text and Bengali
  translation (Proggamoy Quran) and the recitations (reciter name, Islamic
  Network).
- Recitations for **all 114 surahs**. Audio moved to the Islamic Network CDN
  (`cdn.islamic.network/quran/audio-surah/{bitrate}/{reciter}/{number}.mp3`),
  replacing the private S3 bucket that carried 33. The disabled "coming soon"
  buttons are gone.
- Reciter and bitrate are configurable via `WXT_AUDIO_RECITER` and
  `WXT_AUDIO_BITRATE`. Defaults are `ar.alafasy` at 128 kbps.
- A loading indicator while a recitation is being fetched, shown both beside
  the surah name and in place of the play control. It also reappears if the
  stream stalls mid-playback. Matters more now that the longest surahs are
  large files.

### Fixed
- Continuous playback often failed to start the next surah. The offscreen
  document answered `play` by returning the promise that settles when playback
  *begins*, which held the extension message channel open for the whole
  download; on a slow connection Chrome closed the channel first and the
  background treated a successful play as a failure. Playback commands are now
  acknowledged immediately, with progress reported through state broadcasts.
- `AudioHost.play()` reports any internal failure instead of aborting silently.
  Only `audio.play()` was guarded before, so anything thrown ahead of it left
  the popup stuck on "loading" with no error.
- A failed attempt to queue the next surah is logged rather than swallowed.
- The play, pause and restart icons rendered as empty circles. They were sized
  15x15 with 6px padding, which was correct under the browser's default
  `content-box` but left a 13x3 content area under Tailwind's `border-box`
  preflight. The controls are sized explicitly now, so neither box model
  changes the result.

### Changed
- A surah's recitation is addressed by its number, so no per-surah audio path
  is stored and the "surah without audio" case no longer exists in the types.
- Resuming rebuilds the audio URL from the surah number rather than replaying a
  stored URL, so changing reciter, bitrate or CDN cannot strand a saved
  position on a dead address.
- Dropped the audio host from `host_permissions`. Recitations load through an
  `<audio>` element, which `media-src` covers, so the install prompt no longer
  asks for access to the audio host.

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