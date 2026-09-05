import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    dailyAyatUrl: "https://api.example.test/daily-ayat",
    audioBaseUrl: "https://cdn.example.test/quran/audio-surah",
    audioBitrate: "128",
    audioReciter: "ar.alafasy",
    surahDetailsUrl: "https://site.example.test/surahDetails",
    aboutUrl: "https://site.example.test/about",
  },
}));

const { audioUrlFor } = await import("@/lib/audio-url");
const { SURAHS } = await import("@/lib/surahs");

describe("audioUrlFor", () => {
  it("builds {base}/{bitrate}/{reciter}/{number}.mp3", () => {
    expect(audioUrlFor({ number: 1, name: "x" })).toBe(
      "https://cdn.example.test/quran/audio-surah/128/ar.alafasy/1.mp3",
    );
  });

  it("addresses the last surah by number, not a stored path", () => {
    expect(audioUrlFor({ number: 114, name: "x" })).toBe(
      "https://cdn.example.test/quran/audio-surah/128/ar.alafasy/114.mp3",
    );
  });

  // The whole point of moving to the CDN: nothing is missing any more.
  it("produces a distinct, well-formed URL for every one of the 114 surahs", () => {
    const urls = SURAHS.map(audioUrlFor);

    expect(new Set(urls).size).toBe(114);
    for (const url of urls) {
      expect(url).toMatch(
        /^https:\/\/cdn\.example\.test\/quran\/audio-surah\/128\/ar\.alafasy\/\d{1,3}\.mp3$/,
      );
    }
  });
});
