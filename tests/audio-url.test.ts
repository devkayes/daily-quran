import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    dailyAyatUrl: "https://api.example.test/daily-ayat",
    audioBaseUrl: "https://audio.example.test",
    surahDetailsUrl: "https://site.example.test/surahDetails",
    aboutUrl: "https://site.example.test/about",
  },
}));

const { audioUrlFor } = await import("@/lib/audio-url");

describe("audioUrlFor", () => {
  it("joins the bucket root and the surah path", () => {
    expect(audioUrlFor({ number: 1, name: "x", audioPath: "/1-fatiha.mp3" })).toBe(
      "https://audio.example.test/1-fatiha.mp3",
    );
  });

  it("tolerates a path with no leading slash", () => {
    expect(audioUrlFor({ number: 1, name: "x", audioPath: "1-fatiha.mp3" })).toBe(
      "https://audio.example.test/1-fatiha.mp3",
    );
  });
});
