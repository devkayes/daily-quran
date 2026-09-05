import { createAudioController } from "@/lib/audio-controller";
import { broadcastQuietly, onMessage, type PlaybackState } from "@/lib/messaging";
import {
  audioDurationItem,
  nowPlayingItem,
  playbackPositionItem,
  volumeItem,
} from "@/lib/storage";

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

    function handleState(state: PlaybackState): void {
      void persist(state).catch(() => {
        // A failed write must never take down playback.
      });
      broadcastQuietly(state);
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
