import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    dailyAyatUrl: "https://api.example.test/daily-ayat",
    audioBaseUrl: "https://audio.example.test",
    englishApiBaseUrl: "https://en.example.test/v1",
    englishEdition: "en.sahih",
    surahDetailsUrl: "https://site.example.test/surahDetails",
    aboutUrl: "https://site.example.test/about",
  },
}));

const { AyahFetchError, fetchDailyAyah, fetchEnglishAyah, surahDetailsUrl } =
  await import("@/lib/api");

const VALID = {
  success: true,
  statusCode: 200,
  message: "Get Daily Ayats",
  data: {
    indexAyat: 518,
    surahNumber: 4,
    surahName: "সূরা আন নিসা",
    ayatNumber: 25,
    fullAyat: "وَمَنۡ لَّمۡ یَسۡتَطِعۡ",
    ayatMean: "আর যে তোমাদের মধ্য থেকে",
  },
};

function mockFetch(body: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchDailyAyah", () => {
  it("returns the parsed ayah and stamps a fetch time", async () => {
    mockFetch(VALID);
    const ayah = await fetchDailyAyah();

    expect(ayah.surahNumber).toBe(4);
    expect(ayah.ayatNumber).toBe(25);
    expect(ayah.surahName).toBe("সূরা আন নিসা");
    expect(ayah.fetchedAt).toBeGreaterThan(0);
  });

  // The surah number is what the "read more" link uses. v1 sent the ayah
  // number here, which opened an unrelated surah.
  it("keeps surahNumber and ayatNumber distinct", async () => {
    mockFetch(VALID);
    const ayah = await fetchDailyAyah();
    expect(ayah.surahNumber).not.toBe(ayah.ayatNumber);
  });

  it("rejects a response whose shape does not match", async () => {
    mockFetch({ success: true, statusCode: 200, data: { surahNumber: "four" } });
    await expect(fetchDailyAyah()).rejects.toBeInstanceOf(AyahFetchError);
  });

  it("rejects a surah number outside 1..114", async () => {
    mockFetch({ ...VALID, data: { ...VALID.data, surahNumber: 200 } });
    await expect(fetchDailyAyah()).rejects.toBeInstanceOf(AyahFetchError);
  });

  it("rejects an empty ayah body rather than rendering a blank verse", async () => {
    mockFetch({ ...VALID, data: { ...VALID.data, fullAyat: "" } });
    await expect(fetchDailyAyah()).rejects.toBeInstanceOf(AyahFetchError);
  });

  it("turns a non-2xx response into an AyahFetchError", async () => {
    mockFetch({}, false, 503);
    await expect(fetchDailyAyah()).rejects.toThrow(/503/);
  });

  it("turns a network failure into an AyahFetchError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(fetchDailyAyah()).rejects.toBeInstanceOf(AyahFetchError);
  });
});

describe("surahDetailsUrl", () => {
  it("builds the public surah page URL", () => {
    expect(surahDetailsUrl(4)).toBe("https://site.example.test/surahDetails/4");
  });
});

const EN_VALID = {
  code: 200,
  status: "OK",
  data: {
    number: 906,
    text: "And the polytheists assign to Allah...",
    numberInSurah: 136,
    surah: { number: 6, englishName: "Al-An'aam", name: "سُورَةُ الأَنۡعَامِ" },
  },
};

describe("fetchEnglishAyah", () => {
  it("requests the ayah by surah:ayah reference and edition", async () => {
    const fetchMock = mockFetch(EN_VALID);
    await fetchEnglishAyah(6, 136);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://en.example.test/v1/ayah/6:136/en.sahih",
      expect.anything(),
    );
  });

  it("returns the translation and the English surah name", async () => {
    mockFetch(EN_VALID);
    await expect(fetchEnglishAyah(6, 136)).resolves.toEqual({
      text: EN_VALID.data.text,
      surahName: "Al-An'aam",
    });
  });

  /*
   * The Bengali source decides which ayah is displayed. If the translation
   * service answered with a different verse we would render one verse's text
   * under another's number, which is worse than showing no translation.
   */
  it("rejects a response for a different ayah", async () => {
    mockFetch({
      ...EN_VALID,
      data: { ...EN_VALID.data, numberInSurah: 99 },
    });
    await expect(fetchEnglishAyah(6, 136)).rejects.toThrow(/expected 6:136/);
  });

  it("rejects a response for a different surah", async () => {
    mockFetch({
      ...EN_VALID,
      data: { ...EN_VALID.data, surah: { number: 7, englishName: "Al-A'raaf" } },
    });
    await expect(fetchEnglishAyah(6, 136)).rejects.toBeInstanceOf(AyahFetchError);
  });

  it("rejects an unexpected shape", async () => {
    mockFetch({ code: 200, data: { text: 42 } });
    await expect(fetchEnglishAyah(6, 136)).rejects.toBeInstanceOf(AyahFetchError);
  });

  it("rejects empty translation text", async () => {
    mockFetch({ ...EN_VALID, data: { ...EN_VALID.data, text: "" } });
    await expect(fetchEnglishAyah(6, 136)).rejects.toBeInstanceOf(AyahFetchError);
  });

  it("turns a non-2xx response into an AyahFetchError", async () => {
    mockFetch({}, false, 502);
    await expect(fetchEnglishAyah(6, 136)).rejects.toThrow(/502/);
  });

  it("turns a network failure into an AyahFetchError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(fetchEnglishAyah(6, 136)).rejects.toBeInstanceOf(AyahFetchError);
  });
});
