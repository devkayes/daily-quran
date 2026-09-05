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
  /** Root of the surah recitation CDN. */
  audioBaseUrl: required(
    import.meta.env.WXT_AUDIO_BASE_URL,
    "WXT_AUDIO_BASE_URL",
  ).replace(/\/$/, ""),
  /** Surah-level audio exists at 96 and 128 kbps only. */
  audioBitrate: import.meta.env.WXT_AUDIO_BITRATE ?? "128",
  /** Reciter id, e.g. `ar.alafasy`. All 114 surahs exist for every 128k id. */
  audioReciter: import.meta.env.WXT_AUDIO_RECITER ?? "ar.alafasy",
  /** Public site page for a full surah, opened by "read more". */
  surahDetailsUrl: required(
    import.meta.env.WXT_SURAH_DETAILS_URL,
    "WXT_SURAH_DETAILS_URL",
  ).replace(/\/$/, ""),
  aboutUrl: import.meta.env.WXT_ABOUT_URL ?? "https://www.kayes.dev/talks/daily-quran",
} as const;
