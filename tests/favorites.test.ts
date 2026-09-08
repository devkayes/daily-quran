import { describe, expect, it } from "vitest";
import { orderByFavorites, stepSurah, toggleFavorite } from "@/lib/favorites";
import { SURAHS } from "@/lib/surahs";

describe("toggleFavorite", () => {
  it("adds a surah that is not starred yet", () => {
    expect(toggleFavorite([], 2)).toEqual([2]);
    expect(toggleFavorite([2], 36)).toEqual([2, 36]);
  });

  it("removes a surah that is already starred", () => {
    expect(toggleFavorite([2, 36, 55], 36)).toEqual([2, 55]);
  });

  it("does not mutate the array it is given", () => {
    const favorites = [2];
    toggleFavorite(favorites, 36);
    toggleFavorite(favorites, 2);
    expect(favorites).toEqual([2]);
  });
});

describe("orderByFavorites", () => {
  it("leaves the list untouched when nothing is starred", () => {
    expect(orderByFavorites(SURAHS, new Set())).toBe(SURAHS);
  });

  it("moves starred surahs to the front", () => {
    const ordered = orderByFavorites(SURAHS, new Set([36, 2]));
    expect(ordered.slice(0, 2).map((s) => s.number)).toEqual([2, 36]);
  });

  it("keeps mushaf order within each half, whatever order they were starred in", () => {
    const ordered = orderByFavorites(SURAHS, new Set([114, 55, 1]));

    expect(ordered.slice(0, 3).map((s) => s.number)).toEqual([1, 55, 114]);
    // The unstarred remainder is still 2, 3, 4, ...
    expect(ordered.slice(3, 6).map((s) => s.number)).toEqual([2, 3, 4]);
  });

  it("keeps every surah exactly once", () => {
    const ordered = orderByFavorites(SURAHS, new Set([9, 18, 67]));

    expect(ordered).toHaveLength(114);
    expect(new Set(ordered.map((s) => s.number)).size).toBe(114);
  });

  it("ignores numbers that match no surah", () => {
    const ordered = orderByFavorites(SURAHS, new Set([0, 115]));
    expect(ordered.map((s) => s.number)).toEqual(SURAHS.map((s) => s.number));
  });
});

describe("stepSurah", () => {
  it("without favourites, steps by mushaf number, same as before", () => {
    expect(stepSurah(SURAHS, new Set(), 1, 1)?.number).toBe(2);
    expect(stepSurah(SURAHS, new Set(), 55, -1)?.number).toBe(54);
  });

  it("stops instead of wrapping past either end when nothing is starred", () => {
    expect(stepSurah(SURAHS, new Set(), 114, 1)).toBeUndefined();
    expect(stepSurah(SURAHS, new Set(), 1, -1)).toBeUndefined();
  });

  it("a lone favourite is followed by the first non-favourite, not by its own number plus one", () => {
    // The reported bug: surah 10 starred alone should be followed by 1, the
    // next surah in the reordered list -- not 11.
    expect(stepSurah(SURAHS, new Set([10]), 10, 1)?.number).toBe(1);
  });

  it("walks through every favourite, in mushaf order, before the rest", () => {
    const favorites = new Set([36, 2, 55]);

    // 2, 36, 55 is the order starred surahs appear in the list.
    expect(stepSurah(SURAHS, favorites, 2, 1)?.number).toBe(36);
    expect(stepSurah(SURAHS, favorites, 36, 1)?.number).toBe(55);
    // After the last favourite, the list continues with the first
    // non-favourite in mushaf order -- surah 1, not 56.
    expect(stepSurah(SURAHS, favorites, 55, 1)?.number).toBe(1);
    expect(stepSurah(SURAHS, favorites, 1, 1)?.number).toBe(3);
  });

  it("stepping backward from a favourite returns to the previous favourite", () => {
    const favorites = new Set([36, 2]);
    expect(stepSurah(SURAHS, favorites, 36, -1)?.number).toBe(2);
    expect(stepSurah(SURAHS, favorites, 2, -1)).toBeUndefined();
  });

  it("when the last surah is favourited, the order -- and where it stops -- shifts with it", () => {
    const ordered = stepSurah(SURAHS, new Set([114]), 113, 1);
    // 114 now sits at the front of the list, so 113 is the new last surah.
    expect(ordered).toBeUndefined();
  });

  it("returns undefined for a surah number that is not in the list", () => {
    expect(stepSurah(SURAHS, new Set(), 0, 1)).toBeUndefined();
    expect(stepSurah(SURAHS, new Set(), 115, 1)).toBeUndefined();
  });
});
