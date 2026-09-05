import { browser } from "#imports";

/**
 * Every user-facing string key. The `locales-complete` test asserts that each
 * of these exists in every `public/_locales/*` file, so adding a key here
 * without translating it fails CI rather than shipping a blank label.
 */
export const MESSAGE_KEYS = [
  "extName",
  "extDescription",
  "ayatLabel",
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
  "footerLink",
] as const;

export type MessageKey = (typeof MESSAGE_KEYS)[number];

export function t(key: MessageKey): string {
  // Falling back to the key keeps a missing translation visible instead of
  // rendering an empty element.
  return browser.i18n.getMessage(key) || key;
}
