import { describe, expect, it } from "vitest";
import {
  FIRST_PLAYABLE_SURAH,
  findSurah,
  hasAudio,
  SURAHS,
  SURAHS_AUDIO_FIRST,
} from "@/lib/surahs";

describe("SURAHS", () => {
  it("contains all 114 surahs", () => {
    expect(SURAHS).toHaveLength(114);
  });

  it("numbers them 1..114 with no gaps or duplicates", () => {
    expect(SURAHS.map((s) => s.number)).toEqual(
      Array.from({ length: 114 }, (_, i) => i + 1),
    );
  });

  it("gives every surah a non-empty name", () => {
    expect(SURAHS.every((s) => s.name.trim().length > 0)).toBe(true);
  });

  it("gives every audio path a leading slash and an .mp3 extension", () => {
    for (const surah of SURAHS.filter(hasAudio)) {
      expect(surah.audioPath).toMatch(/^\/[\w.-]+\.mp3$/);
    }
  });

  it("has no duplicate audio paths", () => {
    const paths = SURAHS.filter(hasAudio).map((s) => s.audioPath);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("hasAudio", () => {
  it("narrows to the surahs that actually have a recitation", () => {
    const withAudio = SURAHS.filter(hasAudio);
    expect(withAudio.length).toBeGreaterThan(0);
    expect(withAudio.length).toBeLessThan(SURAHS.length);
    expect(withAudio.every((s) => typeof s.audioPath === "string")).toBe(true);
  });
});

describe("SURAHS_AUDIO_FIRST", () => {
  it("keeps every surah exactly once", () => {
    expect(SURAHS_AUDIO_FIRST).toHaveLength(SURAHS.length);
    expect(new Set(SURAHS_AUDIO_FIRST.map((s) => s.number)).size).toBe(114);
  });

  it("puts every playable surah before every unavailable one", () => {
    const firstUnavailable = SURAHS_AUDIO_FIRST.findIndex((s) => !hasAudio(s));
    const lastPlayable = SURAHS_AUDIO_FIRST.map(hasAudio).lastIndexOf(true);
    expect(lastPlayable).toBeLessThan(firstUnavailable);
  });

  it("orders each group by surah number", () => {
    const playable = SURAHS_AUDIO_FIRST.filter(hasAudio).map((s) => s.number);
    expect(playable).toEqual([...playable].sort((a, b) => a - b));
  });

  // v1 sorted the shared module-level array in place, so the display order
  // mutated the data every other module read from.
  it("does not mutate SURAHS", () => {
    expect(SURAHS.map((s) => s.number)).toEqual(
      Array.from({ length: 114 }, (_, i) => i + 1),
    );
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

describe("FIRST_PLAYABLE_SURAH", () => {
  it("is Al-Fatiha, the default the popup falls back to", () => {
    expect(FIRST_PLAYABLE_SURAH.number).toBe(1);
    expect(FIRST_PLAYABLE_SURAH.audioPath).toBe("/1-fatiha.mp3");
  });
});
