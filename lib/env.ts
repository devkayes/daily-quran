/**
 * Build-time configuration. Values come from `.env.<mode>` via WXT and are
 * inlined at build time — this replaces the old untracked `config.js` globals,
 * which were loaded *after* the scripts that read them.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing build-time env var ${name}. Copy .env.example and set it.`,
    );
  }
  return value;
}

const apiBaseUrl = required(import.meta.env.WXT_API_BASE_URL, "WXT_API_BASE_URL");
const dailyAyatPath = required(
  import.meta.env.WXT_DAILY_AYAT_PATH,
  "WXT_DAILY_AYAT_PATH",
);

export const env = {
  /** Endpoint returning one ayah with its Bengali translation. */
  dailyAyatUrl: new URL(dailyAyatPath, apiBaseUrl).toString(),
  /** Bucket root the per-surah mp3 paths hang off. */
  audioBaseUrl: required(
    import.meta.env.WXT_AUDIO_BASE_URL,
    "WXT_AUDIO_BASE_URL",
  ).replace(/\/$/, ""),
  /** Public site page for a full surah, opened by "read more". */
  surahDetailsUrl: required(
    import.meta.env.WXT_SURAH_DETAILS_URL,
    "WXT_SURAH_DETAILS_URL",
  ).replace(/\/$/, ""),
  aboutUrl: import.meta.env.WXT_ABOUT_URL ?? "https://www.kayes.dev/talks/daily-quran",
} as const;
