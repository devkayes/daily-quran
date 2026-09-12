import type { Surah } from "@/lib/surahs";

export function toggleFavorite(
  favorites: readonly number[],
  surahNumber: number,
): number[] {
  return favorites.includes(surahNumber)
    ? favorites.filter((number) => number !== surahNumber)
    : [...favorites, surahNumber];
}

/**
 * Starred surahs first, the rest after, each half still in mushaf order.
 * Ordering by mushaf number rather than by when a surah was starred means
 * starring one never reshuffles the others.
 */
export function orderByFavorites(
  surahs: readonly Surah[],
  favorites: ReadonlySet<number>,
): readonly Surah[] {
  if (favorites.size === 0) return surahs;

  return [
    ...surahs.filter((surah) => favorites.has(surah.number)),
    ...surahs.filter((surah) => !favorites.has(surah.number)),
  ];
}

/**
 * The surah `delta` steps from `current` in the reader's own ordering — starred
 * first — not by mushaf number, so next/previous match what is on screen.
 * Undefined past either end, so continuous playback stops rather than wrapping.
 */
export function stepSurah(
  surahs: readonly Surah[],
  favorites: ReadonlySet<number>,
  current: number,
  delta: number,
): Surah | undefined {
  const ordered = orderByFavorites(surahs, favorites);
  const index = ordered.findIndex((surah) => surah.number === current);
  if (index === -1) return undefined;

  return ordered[index + delta];
}
