import { env } from "@/lib/env";
import type { Surah } from "@/lib/surahs";

/**
 * Recitation URL for a surah, built from the Islamic Network CDN's pattern:
 * `{base}/{bitrate}/{reciter}/{1-114}.mp3`.
 *
 * Every surah is available, so there is no longer a per-surah audio path to
 * store — the number is the whole address. The CDN serves range requests, so
 * seeking works on the long surahs.
 */
export function audioUrlFor(surah: Surah): string {
  return `${env.audioBaseUrl}/${env.audioBitrate}/${env.audioReciter}/${surah.number}.mp3`;
}
