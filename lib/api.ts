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
