import { storage } from "#imports";

/**
 * Every piece of persisted state, in one place, behind one async API.
 *
 * v1 split state between `localStorage` (volume, now-playing, pause position)
 * and `chrome.storage.local` (duration). MV3 service workers have no
 * `localStorage` at all, so half the state was structurally unreachable from
 * the worker. Everything here lives in `chrome.storage`, so every context —
 * popup, background, offscreen — can read and write it.
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
}

export const DEFAULT_VOLUME = 0.5;

/** 0..1. Persisted so a fresh popup opens at the volume you left. */
export const volumeItem = storage.defineItem<number>("local:volume", {
  fallback: DEFAULT_VOLUME,
  version: 1,
});

/** The surah the audio element is currently pointed at, if any. */
export const nowPlayingItem = storage.defineItem<NowPlaying | null>(
  "local:nowPlaying",
  { fallback: null, version: 1 },
);

/** Seconds into the current recitation, so playback resumes where it stopped. */
export const playbackPositionItem = storage.defineItem<number>(
  "local:playbackPosition",
  { fallback: 0, version: 1 },
);

/** Duration of the loaded recitation, in seconds. Drives the timeline max. */
export const audioDurationItem = storage.defineItem<number>("local:audioDuration", {
  fallback: 0,
  version: 1,
});

/**
 * Last successfully fetched ayah. The popup renders this immediately on open
 * and revalidates behind it, which is what commenting out `ayatFetch()` in v1
 * was reaching for.
 */
export const cachedAyahItem = storage.defineItem<CachedAyah | null>(
  "local:cachedAyah",
  { fallback: null, version: 1 },
);

/**
 * When on, finishing a surah starts the next one. Read by the background when
 * the audio host reports "ended".
 */
export const continuousPlaybackItem = storage.defineItem<boolean>(
  "local:continuousPlayback",
  { fallback: false, version: 1 },
);

/** Clears playback state. Used when switching to a different surah. */
export async function resetPlaybackPosition(): Promise<void> {
  await playbackPositionItem.setValue(0);
}
