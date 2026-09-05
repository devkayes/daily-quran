import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchDailyAyah } from "@/lib/api";
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
  volumeItem,
} from "@/lib/storage";

export const AYAH_QUERY_KEY = ["daily-ayah"] as const;

/**
 * Cache-then-revalidate. The popup paints the last ayah from storage
 * immediately and refreshes behind it — what v1 was reaching for by commenting
 * out the fetch on load, but without going stale forever.
 */
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

    // The setting can also be changed from the page context menu, so follow
    // storage rather than trusting our own last write.
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
