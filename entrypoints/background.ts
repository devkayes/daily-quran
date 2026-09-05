import { createAudioController } from "@/lib/audio-controller";
import { audioUrlFor } from "@/lib/audio-url";
import { broadcastQuietly, onMessage, type PlaybackState } from "@/lib/messaging";
import {
  audioDurationItem,
  continuousPlaybackItem,
  nowPlayingItem,
  playbackPositionItem,
  volumeItem,
} from "@/lib/storage";
import { findSurah, type Surah } from "@/lib/surahs";

/** How often playback position is written while audio is running. */
const POSITION_PERSIST_INTERVAL_MS = 1000;

export default defineBackground({
  type: "module",
  main() {
    let lastPersistedAt = 0;

    /**
     * The single place playback state is persisted. The audio host itself
     * cannot do this on Chrome — offscreen documents have no `chrome.storage` —
     * so every state change funnels through here, whether it arrived over a
     * message (Chrome) or from a host running in this very context (Firefox).
     */
    async function persist(state: PlaybackState): Promise<void> {
      if (state.duration > 0) await audioDurationItem.setValue(state.duration);

      const now = Date.now();
      const isCheckpoint = state.status !== "playing";
      if (isCheckpoint || now - lastPersistedAt >= POSITION_PERSIST_INTERVAL_MS) {
        lastPersistedAt = now;
        await playbackPositionItem.setValue(state.position);
      }
    }

    /** Starts a surah from the beginning and records it as now playing. */
    async function start(surah: Surah): Promise<void> {
      const url = audioUrlFor(surah);
      await nowPlayingItem.setValue({
        surahNumber: surah.number,
        name: surah.name,
        url,
      });
      await playbackPositionItem.setValue(0);
      await audio.play({
        url,
        surahNumber: surah.number,
        name: surah.name,
        volume: await volumeItem.getValue(),
        startAt: 0,
      });
    }

    /**
     * Continuous playback. Runs on "ended" only, so it cannot loop: the next
     * surah has to finish before this fires again. Stops after An-Nas rather
     * than wrapping back to Al-Fatiha.
     */
    async function advance(state: PlaybackState): Promise<void> {
      if (state.surahNumber === null) return;
      if (!(await continuousPlaybackItem.getValue())) return;

      const next = findSurah(state.surahNumber + 1);
      if (!next) return;

      await start(next);
    }

    function handleState(state: PlaybackState): void {
      void persist(state).catch(() => {
        // A failed write must never take down playback.
      });
      broadcastQuietly(state);

      if (state.status === "ended") {
        void advance(state).catch(() => {
          // Failing to queue the next surah leaves playback stopped, which is
          // the same place it would have been without the setting.
        });
      }
    }

    const audio = createAudioController(handleState);

    // Chrome: the offscreen document reports here. Firefox: never fires,
    // because the host calls `handleState` directly.
    onMessage("hostStateChanged", ({ data }) => handleState(data));

    onMessage("play", async ({ data }) => {
      await nowPlayingItem.setValue({
        surahNumber: data.surahNumber,
        name: data.name,
        url: data.url,
      });
      await volumeItem.setValue(data.volume);
      await playbackPositionItem.setValue(data.startAt);
      await audio.play(data);
    });

    onMessage("pause", () => audio.pause());
    onMessage("restart", () => audio.restart());

    onMessage("setVolume", async ({ data }) => {
      await volumeItem.setValue(data);
      await audio.setVolume(data);
    });

    onMessage("seek", async ({ data }) => {
      await playbackPositionItem.setValue(data);
      await audio.seek(data);
    });

    onMessage("getPlaybackState", () => audio.getState());
  },
});
