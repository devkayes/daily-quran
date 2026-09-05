# Changelog

All notable changes to this project will be documented in this file.

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