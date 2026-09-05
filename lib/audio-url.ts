import { env } from "@/lib/env";
import type { SurahWithAudio } from "@/lib/surahs";

/** Absolute URL of a surah's recitation. */
export function audioUrlFor(surah: SurahWithAudio): string {
  const path = surah.audioPath.startsWith("/")
    ? surah.audioPath
    : `/${surah.audioPath}`;
  return `${env.audioBaseUrl}${path}`;
}
