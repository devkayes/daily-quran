import { z } from "zod";
import { env } from "@/lib/env";
import type { CachedAyah } from "@/lib/storage";

/**
 * The ayah API response, parsed at the boundary instead of trusted.
 *
 * This is the structural half of the `innerHTML` fix: unknown shape in, known
 * shape out. If the API changes or a proxy returns something else, we get a
 * typed error instead of writing whatever arrived into the DOM.
 */
const ayahResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  data: z.object({
    surahNumber: z.number().int().min(1).max(114),
    surahName: z.string().min(1),
    ayatNumber: z.number().int().positive(),
    fullAyat: z.string().min(1),
    ayatMean: z.string().min(1),
  }),
});

/**
 * AlQuran Cloud's per-ayah response. Only the fields actually rendered are
 * declared; the endpoint returns juz, page, sajda and more that we ignore.
 */
const englishAyahSchema = z.object({
  code: z.number(),
  data: z.object({
    text: z.string().min(1),
    numberInSurah: z.number().int().positive(),
    surah: z.object({
      number: z.number().int().min(1).max(114),
      englishName: z.string().min(1),
    }),
  }),
});

export class AyahFetchError extends Error {
  override readonly name = "AyahFetchError";
}

export async function fetchDailyAyah(signal?: AbortSignal): Promise<CachedAyah> {
  let response: Response;
  try {
    response = await fetch(env.dailyAyatUrl, {
      signal: signal ?? null,
      headers: { accept: "application/json" },
    });
  } catch (cause) {
    throw new AyahFetchError("Could not reach the ayah service.", { cause });
  }

  if (!response.ok) {
    throw new AyahFetchError(`Ayah service returned ${response.status}.`);
  }

  const parsed = ayahResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new AyahFetchError("Ayah service returned an unexpected shape.", {
      cause: parsed.error,
    });
  }

  return { ...parsed.data.data, fetchedAt: Date.now() };
}

/** Public site URL for a full surah. */
export function surahDetailsUrl(surahNumber: number): string {
  return `${env.surahDetailsUrl}/${surahNumber}`;
}

export interface EnglishAyah {
  readonly text: string;
  readonly surahName: string;
}

/**
 * English translation for one ayah, looked up by `surah:ayah`.
 *
 * The Bengali source stays authoritative for *which* ayah is shown; this only
 * translates the one it picked, so switching language never changes the verse.
 */
export async function fetchEnglishAyah(
  surahNumber: number,
  ayatNumber: number,
  signal?: AbortSignal,
): Promise<EnglishAyah> {
  const url = `${env.englishApiBaseUrl}/ayah/${surahNumber}:${ayatNumber}/${env.englishEdition}`;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: signal ?? null,
      headers: { accept: "application/json" },
    });
  } catch (cause) {
    throw new AyahFetchError("Could not reach the translation service.", { cause });
  }

  if (!response.ok) {
    throw new AyahFetchError(`Translation service returned ${response.status}.`);
  }

  const parsed = englishAyahSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new AyahFetchError("Translation service returned an unexpected shape.", {
      cause: parsed.error,
    });
  }

  // A mismatched reference would show one verse's text under another's number.
  const { data } = parsed.data;
  if (data.surah.number !== surahNumber || data.numberInSurah !== ayatNumber) {
    throw new AyahFetchError(
      `Translation service returned ${data.surah.number}:${data.numberInSurah}, expected ${surahNumber}:${ayatNumber}.`,
    );
  }

  return { text: data.text, surahName: data.surah.englishName };
}
