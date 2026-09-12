import { env } from "@/lib/env";
import type { Surah } from "@/lib/surahs";

/** Islamic Network CDN pattern: `{base}/{bitrate}/{reciter}/{1-114}.mp3`. */
export function audioUrlFor(surah: Pick<Surah, "number">): string {
  return `${env.audioBaseUrl}/${env.audioBitrate}/${env.audioReciter}/${surah.number}.mp3`;
}
