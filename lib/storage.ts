import { storage } from "#imports";

/**
 * Every piece of persisted state, behind one async API. All of it lives in
 * `chrome.storage`: MV3 service workers have no `localStorage`, so state kept
 * there would be unreachable from the worker.
 */

export interface NowPlaying {
  readonly surahNumber: number;
  readonly name: string;
  readonly url: string;
}

export interface CachedAyah {
  readonly surahNumber: number;
  readonly surahName: string;
  readonly ayatNumber: number;
  readonly fullAyat: string;
  readonly ayatMean: string;
  /** Epoch ms, so the popup can decide whether to revalidate. */
  readonly fetchedAt: number;
  /** Filled in lazily the first time this ayah is read in English. */
  readonly english?: { readonly text: string; readonly surahName: string };
}

export type TranslationLanguage = "bn" | "en";

export const DEFAULT_VOLUME = 0.5;

export const translationLanguageItem = storage.defineItem<TranslationLanguage>(
  "local:translationLanguage",
  { fallback: "bn", version: 1 },
);

/** 0..1. */
export const volumeItem = storage.defineItem<number>("local:volume", {
  fallback: DEFAULT_VOLUME,
  version: 1,
});

export const nowPlayingItem = storage.defineItem<NowPlaying | null>(
  "local:nowPlaying",
  { fallback: null, version: 1 },
);

/** Seconds into the current recitation. */
export const playbackPositionItem = storage.defineItem<number>(
  "local:playbackPosition",
  { fallback: 0, version: 1 },
);

/** Seconds. Drives the timeline max. */
export const audioDurationItem = storage.defineItem<number>("local:audioDuration", {
  fallback: 0,
  version: 1,
});

/** Rendered immediately on open while a fresh fetch revalidates behind it. */
export const cachedAyahItem = storage.defineItem<CachedAyah | null>(
  "local:cachedAyah",
  { fallback: null, version: 1 },
);

/**
 * Starred surah numbers. Only ever used as a set — starred surahs keep their
 * mushaf order in the list, so position here carries no meaning. An array
 * because `chrome.storage` serialises to JSON, which has no Set.
 */
export const favoriteSurahsItem = storage.defineItem<readonly number[]>(
  "local:favoriteSurahs",
  { fallback: [], version: 1 },
);

export const continuousPlaybackItem = storage.defineItem<boolean>(
  "local:continuousPlayback",
  { fallback: false, version: 1 },
);

export async function resetPlaybackPosition(): Promise<void> {
  await playbackPositionItem.setValue(0);
}
