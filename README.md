# Daily Quran

Assalamu Alaykum, Daily Quran is a user-friendly web extension available on the different Web Extension Store, designed to provide quick and easy access to the Holy Quran. The main objective of this extension is to make the Quran as accessible as possible, allowing users to read and reflect on its verses anytime, directly from their browser. Whether you're at home, work, or on the go. Read more about Daily Quran from [here](https://www.kayes.dev/talks/daily-quran)

## Availability

- **[Microsoft Edge Add-on](https://microsoftedge.microsoft.com/addons/detail/kahmdoemofhhnpjiohppcphcdkpkdfbm)**
  *(Install Now)*

- **[Chrome Web Store](https://chromewebstore.google.com/detail/daily-quran/fjlibnbfcncabmigdmibpginiljglaak)**
  *(Install Now)*

- **Firefox** — built from this repo (`pnpm build:firefox`); not yet published
  to Firefox Add-ons.

## Features of Daily Quran

- **A daily ayah, with your choice of translation**
  Instantly get an ayah with a Bengali translation, or switch to English
  (Saheeh International) with one click. The surah name, ayah number and
  digits switch language too; the verse itself never changes underneath you.

- **Recitations for all 114 surahs**
  Every surah is available to listen to, recited by Mishary Rashid Alafasy,
  with a fully customizable audio controller — play, pause, restart, seek and
  volume.

- **Favourite surahs**
  Star any surah to pin it to the front of the list, so the ones you return to
  most are always one click away. Favourites stay in their usual numbered
  order — no separate list to manage, and starring one never reshuffles the
  others.

- **Continuous playback**
  Turn on continuous play and one surah leads straight into the next,
  stopping after An-Nas. Keeps running in the background even with the popup
  closed.

- **Right-click controls**
  Play, pause, restart, skip to the next or previous surah, and toggle
  continuous play — all from the page's right-click menu, no need to open the
  popup.

- **Resume where you left off**
  Audio resumes from the exact point you paused, and the system media keys
  (and OS media player, via MediaSession) control it like any other audio.

- **Works from cache**
  The popup shows the last ayah you loaded immediately, even before the
  network request behind it resolves.

## Donation - Support Daily Quran

Maintaining cloud databases and services for this extension is costly. Your donations help cover these expenses and support the growth of the project. By donating, you help spread the message of the Holy Quran.

If you'd like to contribute, please email me at [hello@kayes.dev](mailto:hello@kayes.dev), and I will get in touch with you directly.

*Donations will be tracked!*


## Contact Information

If you have any questions, suggestions, or need support, feel free to reach out:

- **Email**: [hello@kayes.dev](mailto:hello@kayes.dev)
- **GitHub Issues**: [Project Repository Issues](https://github.com/devkayes/daily-quran/issues)
- **LinkedIn**: [@its-kayes](https://www.linkedin.com/in/its-kayes/)

We welcome your feedback and contributions!

## Sources & Credits

Daily Quran doesn't run its own backend for ayah text or recitations — it
reads from, and credits, these public sources:

| What | Source | Used for |
| --- | --- | --- |
| Ayah text & Bengali translation | [Proggamoy Quran](https://proggamoyquran.com) | The daily ayah shown in Bengali, and "Read more" links to the full surah |
| English translation | [AlQuran Cloud](https://alquran.cloud) (Saheeh International, `en.sahih`) | The daily ayah shown when English is selected |
| Recitation audio | [Islamic Network](https://islamic.network) CDN, reciter Mishary Rashid Alafasy (`ar.alafasy`) | All 114 surah recordings |

The active sources are also named in the popup's footer, and their endpoints
are configured in [`.env.example`](./.env.example).

## Development

Daily Quran 2.0 is built with [WXT](https://wxt.dev), TypeScript, React 19 and
Tailwind CSS v4, and builds for Chrome, Edge and Firefox from one source.

```bash
corepack enable
pnpm install
cp .env.example .env.development   # then fill in the endpoints
pnpm dev                            # Chrome, with hot reload
pnpm dev:firefox
```

| Command | What it does |
| --- | --- |
| `pnpm check` | Typecheck, lint and unit tests |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright, against a real built extension |
| `pnpm build` / `pnpm build:firefox` | Production build |
| `pnpm zip` / `pnpm zip:firefox` | Store-ready package |

See [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request, and
its [Releasing](./CONTRIBUTING.md#releasing) section for how versions are cut
and published.

## Contributing to Daily Quran

Developers are welcome to contribute to this project and help make it more dynamic. Before contributing I will suggest you to read the [Developers Guide](./CONTRIBUTING.md) and the [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

Daily Quran is free software, licensed under the
[GNU General Public License v3.0](./LICENSE.txt) (or, at your option, any
later version).

That means you're free to use, study, modify and redistribute it — including
commercially — as long as any distributed version (modified or not) stays
under the same license and keeps its source available. See
[LICENSE.txt](./LICENSE.txt) for the full terms.

## Security

Found a security issue? Please don't open a public GitHub issue — see
[SECURITY.md](./SECURITY.md) for how to report it privately.

## Privacy Policy

I/We do not collect any personal information or other user data through the Daily Quran extension. Read full privacy policy from  [here](https://www.kayes.dev/daily-quran/privacy-policy.html)
