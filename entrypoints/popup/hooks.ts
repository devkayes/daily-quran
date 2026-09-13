import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { type EnglishAyah, fetchDailyAyah, fetchEnglishAyah } from "@/lib/api";
import { toggleFavorite } from "@/lib/favorites";
import {
  IDLE_PLAYBACK_STATE,
  onMessage,
  type PlaybackState,
  sendMessage,
} from "@/lib/messaging";
import {
  type CachedAyah,
  cachedAyahItem,
  continuousPlaybackItem,
  favoriteSurahsItem,
  type TranslationLanguage,
  translationLanguageItem,
  volumeItem,
} from "@/lib/storage";

export const AYAH_QUERY_KEY = ["daily-ayah"] as const;

/** Cache-then-revalidate: paint the stored ayah at once, refresh behind it. */
export function useDailyAyah() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    void cachedAyahItem.getValue().then((cached) => {
      if (cancelled || !cached) return;
      queryClient.setQueryData(
        AYAH_QUERY_KEY,
        (existing?: CachedAyah) => existing ?? cached,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  return useQuery({
    queryKey: AYAH_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const ayah = await fetchDailyAyah(signal);
      await cachedAyahItem.setValue(ayah);
      return ayah;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** Live playback state: seeded from the audio host, then kept in sync. */
export function usePlaybackState(): PlaybackState {
  const [state, setState] = useState<PlaybackState>(IDLE_PLAYBACK_STATE);

  useEffect(() => {
    let active = true;

    sendMessage("getPlaybackState", undefined)
      .then((current) => {
        if (active) setState(current);
      })
      .catch(() => {
        // No audio host running yet; idle is the correct starting state.
      });

    const unsubscribe = onMessage("playbackStateChanged", ({ data }) => {
      setState(data);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
}

/** Persisted volume, 0..1. */
export function useVolume(): [number, (next: number) => void] {
  const [volume, setLocalVolume] = useState<number>(0.5);

  useEffect(() => {
    let active = true;
    void volumeItem.getValue().then((value) => {
      if (active) setLocalVolume(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const update = (next: number) => {
    setLocalVolume(next);
    void sendMessage("setVolume", next).catch(() => {});
  };

  return [volume, update];
}

/** Whether finishing a surah should start the next one. Persisted. */
export function useContinuousPlayback(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    void continuousPlaybackItem.getValue().then((value) => {
      if (active) setEnabled(value);
    });

    // Also changed from the context menu, so follow storage, not our last write.
    const unwatch = continuousPlaybackItem.watch((value) => setEnabled(value));

    return () => {
      active = false;
      unwatch();
    };
  }, []);

  const update = (next: boolean) => {
    setEnabled(next);
    void continuousPlaybackItem.setValue(next).catch(() => {});
  };

  return [enabled, update];
}

/** Starred surah numbers, as a set for per-row lookup. Persisted. */
export function useFavoriteSurahs(): [
  ReadonlySet<number>,
  (surahNumber: number) => void,
] {
  const [favorites, setFavorites] = useState<readonly number[]>([]);

  useEffect(() => {
    let active = true;
    void favoriteSurahsItem.getValue().then((value) => {
      if (active) setFavorites(value);
    });

    // A second popup writes the same key, so follow storage, not our last write.
    const unwatch = favoriteSurahsItem.watch((value) => setFavorites(value ?? []));

    return () => {
      active = false;
      unwatch();
    };
  }, []);

  const toggle = (surahNumber: number) => {
    const next = toggleFavorite(favorites, surahNumber);
    setFavorites(next);
    void favoriteSurahsItem.setValue(next).catch(() => {});
  };

  return [useMemo(() => new Set(favorites), [favorites]), toggle];
}

/** Which translation to show. Persisted, defaults to Bengali. */
export function useTranslationLanguage(): [
  TranslationLanguage,
  (next: TranslationLanguage) => void,
] {
  const [language, setLanguage] = useState<TranslationLanguage>("bn");

  useEffect(() => {
    let active = true;
    void translationLanguageItem.getValue().then((value) => {
      if (active) setLanguage(value);
    });
    const unwatch = translationLanguageItem.watch((value) => setLanguage(value));
    return () => {
      active = false;
      unwatch();
    };
  }, []);

  const update = (next: TranslationLanguage) => {
    setLanguage(next);
    void translationLanguageItem.setValue(next).catch(() => {});
  };

  return [language, update];
}

/**
 * English text for the ayah the Bengali source already picked. Runs only when
 * English is selected; the result is cached so a reopened popup renders at once.
 */
export function useEnglishAyah(ayah: CachedAyah | undefined, enabled: boolean) {
  return useQuery<EnglishAyah>({
    queryKey: ["english-ayah", ayah?.surahNumber, ayah?.ayatNumber],
    enabled: enabled && ayah !== undefined,
    // A translation of a fixed verse never changes.
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
    // Only present when this ayah has been read in English before. Spread
    // conditionally: the overload rejects an explicit `undefined` here.
    ...(ayah?.english ? { initialData: ayah.english } : {}),
    queryFn: async ({ signal }) => {
      if (!ayah) throw new Error("No ayah to translate.");

      const english = await fetchEnglishAyah(ayah.surahNumber, ayah.ayatNumber, signal);

      const cached = await cachedAyahItem.getValue();
      if (
        cached?.surahNumber === ayah.surahNumber &&
        cached.ayatNumber === ayah.ayatNumber
      ) {
        await cachedAyahItem.setValue({ ...cached, english });
      }
      return english;
    },
  });
}
