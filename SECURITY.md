# Security Policy

## Supported versions

Only the latest published release is supported. Security fixes are not
backported to older versions — please update to the latest version from the
[Chrome Web Store](https://chromewebstore.google.com/detail/daily-quran/fjlibnbfcncabmigdmibpginiljglaak)
or [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/kahmdoemofhhnpjiohppcphcdkpkdfbm)
before reporting.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for a security vulnerability.

Instead, email **[hello@kayes.dev](mailto:hello@kayes.dev)** with:

- A description of the issue and its potential impact.
- Steps to reproduce it, including the browser and extension version.
- Any proof-of-concept code, if you have one.

You should get a response within a few days. Once a fix is confirmed, it will
be released and credited (unless you'd prefer to stay anonymous) in
[CHANGELOG.md](./CHANGELOG.md).

## Scope

Daily Quran is a browser extension with no backend of its own. In scope:

- The extension code in this repository (popup, background, offscreen audio
  host, messaging, storage).
- The extension's Content Security Policy and permissions.

Out of scope: the third-party services it reads from (Proggamoy Quran,
AlQuran Cloud, the Islamic Network CDN) — please report issues with those
services to their own maintainers. See [README.md](./README.md#sources--credits)
for what each one is used for.

## What the extension collects

Nothing. Daily Quran has no analytics, no tracking, and no telemetry — see the
[Privacy Policy](https://www.kayes.dev/daily-quran/privacy-policy.html) and
[CONTRIBUTING.md](./CONTRIBUTING.md) for the house rules that keep it that
way.
