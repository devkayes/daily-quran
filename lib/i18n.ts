import { browser } from "#imports";

/**
 * Every user-facing string key. The `locales-complete` test asserts each exists
 * in every `public/_locales/*` file, so an untranslated key fails the suite
 * rather than shipping a blank label.
 */
export const MESSAGE_KEYS = [
  "extName",
  "extDescription",
  "ayatLabel",
  "translationLanguage",
  "translationUnavailable",
  "readMore",
  "reloadAyah",
  "play",
  "pause",
  "restart",
  "volume",
  "progress",
  "ayahLoadError",
  "audioLoadError",
  "retry",
  "loadingAyah",
  "loadingAudio",
  "surahListLabel",
  "addFavorite",
  "removeFavorite",
  "continuous",
  "nextSurah",
  "previousSurah",
  "continuousHint",
  "creditsAyah",
  "creditsTranslation",
  "creditsAudio",
  "creditsIntro",
  "footerLink",
] as const;

export type MessageKey = (typeof MESSAGE_KEYS)[number];

export function t(key: MessageKey, substitutions?: string | string[]): string {
  // Falling back to the key keeps a missing translation visible.
  return browser.i18n.getMessage(key, substitutions) || key;
}
