import { describe, expect, it } from "vitest";
import { FIRST_SURAH, findSurah, SURAHS } from "@/lib/surahs";

describe("SURAHS", () => {
  it("contains all 114 surahs", () => {
    expect(SURAHS).toHaveLength(114);
  });

  it("numbers them 1..114 in order, with no gaps or duplicates", () => {
    expect(SURAHS.map((s) => s.number)).toEqual(
      Array.from({ length: 114 }, (_, i) => i + 1),
    );
  });

  it("gives every surah a non-empty name", () => {
    expect(SURAHS.every((s) => s.name.trim().length > 0)).toBe(true);
  });

  it("has no duplicate names", () => {
    expect(new Set(SURAHS.map((s) => s.name)).size).toBe(114);
  });
});

describe("findSurah", () => {
  it("finds by number", () => {
    expect(findSurah(1)?.name).toBe("সূরা আল ফাতিহা");
    expect(findSurah(114)?.name).toBe("সূরা আন নাস");
  });

  it("returns undefined outside 1..114", () => {
    expect(findSurah(0)).toBeUndefined();
    expect(findSurah(115)).toBeUndefined();
  });
});

describe("FIRST_SURAH", () => {
  it("is Al-Fatiha, what the play button falls back to", () => {
    expect(FIRST_SURAH.number).toBe(1);
    expect(FIRST_SURAH).toEqual(SURAHS[0]);
  });
});
