/** Build-time configuration, inlined from `.env.<mode>` by WXT. */

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
  dailyAyatUrl: new URL(dailyAyatPath, apiBaseUrl).toString(),
  englishApiBaseUrl: (
    import.meta.env.WXT_EN_API_BASE_URL ?? "https://api.alquran.cloud/v1"
  ).replace(/\/$/, ""),
  englishEdition: import.meta.env.WXT_EN_EDITION ?? "en.sahih",
  englishEditionName: import.meta.env.WXT_EN_EDITION_NAME ?? "Saheeh International",
  englishSourceName: "AlQuran Cloud",
  englishSourceUrl: "https://alquran.cloud",
  audioBaseUrl: required(
    import.meta.env.WXT_AUDIO_BASE_URL,
    "WXT_AUDIO_BASE_URL",
  ).replace(/\/$/, ""),
  /** Surah-level audio exists at 96 and 128 kbps only. */
  audioBitrate: import.meta.env.WXT_AUDIO_BITRATE ?? "128",
  /** Reciter id, e.g. `ar.alafasy`. */
  audioReciter: import.meta.env.WXT_AUDIO_RECITER ?? "ar.alafasy",
  audioReciterName: import.meta.env.WXT_AUDIO_RECITER_NAME ?? "Mishary Rashid Alafasy",
  audioSourceName: "Islamic Network",
  audioSourceUrl: "https://islamic.network",
  ayahSourceName: "Proggamoy Quran",
  ayahSourceUrl: import.meta.env.WXT_AYAH_SOURCE_URL ?? "https://proggamoyquran.com",
  surahDetailsUrl: required(
    import.meta.env.WXT_SURAH_DETAILS_URL,
    "WXT_SURAH_DETAILS_URL",
  ).replace(/\/$/, ""),
  aboutUrl: import.meta.env.WXT_ABOUT_URL ?? "https://www.kayes.dev/talks/daily-quran",
} as const;
