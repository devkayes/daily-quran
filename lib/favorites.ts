import type { Surah } from "@/lib/surahs";

/**
 * Starred surahs, and the single list they share with everything else.
 *
 * Favourites are not a separate section and do not get their own numbering:
 * a starred surah moves to the front of the one list and keeps the mushaf
 * number it has always had, so "২. সূরা আল বাকারা" reads the same whether it
 * sits first or second.
 */

/** Adds a surah to the starred set, or removes it if it is already there. */
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
 *
 * Ordering by mushaf number rather than by when a surah was starred keeps the
 * list predictable: starring one surah never reshuffles the others.
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
