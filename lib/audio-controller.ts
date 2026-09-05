import { browser } from "#imports";
import { AudioHost } from "@/lib/audio-host";
import {
  broadcastQuietly,
  IDLE_PLAYBACK_STATE,
  type PlaybackState,
  type PlayCommand,
  sendMessage,
} from "@/lib/messaging";

/**
 * What the background talks to in order to control audio. Chrome and Firefox
 * get different implementations because they can host a DOM audio element in
 * different places, but the background code above this line is identical.
 */
export interface AudioController {
  play(command: PlayCommand): Promise<void>;
  pause(): Promise<void>;
  restart(): Promise<void>;
  setVolume(volume: number): Promise<void>;
  seek(seconds: number): Promise<void>;
  getState(): Promise<PlaybackState>;
}

const OFFSCREEN_URL = "offscreen.html";

/**
 * Chrome/Edge: an MV3 service worker has no DOM, so audio lives in an offscreen
 * document that the worker creates on demand.
 */
function createOffscreenController(): AudioController {
  let creating: Promise<void> | null = null;

  async function ensureDocument(): Promise<void> {
    if (await browser.offscreen.hasDocument()) return;
    // Concurrent commands must not race into two createDocument calls.
    creating ??= browser.offscreen
      .createDocument({
        url: OFFSCREEN_URL,
        reasons: ["AUDIO_PLAYBACK"],
        justification:
          "Necessary for playing Quranic audio in the background when the extension is active.",
      })
      .finally(() => {
        creating = null;
      });
    await creating;
  }

  return {
    async play(command) {
      await ensureDocument();
      await sendMessage("hostPlay", command);
    },
    async pause() {
      await ensureDocument();
      await sendMessage("hostPause", undefined);
    },
    async restart() {
      await ensureDocument();
      await sendMessage("hostRestart", undefined);
    },
    async setVolume(volume) {
      await ensureDocument();
      await sendMessage("hostSetVolume", volume);
    },
    async seek(seconds) {
      await ensureDocument();
      await sendMessage("hostSeek", seconds);
    },
    async getState() {
      // Do not spin up an offscreen document just to answer "are you playing?".
      if (!(await browser.offscreen.hasDocument())) return IDLE_PLAYBACK_STATE;
      return sendMessage("hostGetState", undefined);
    },
  };
}

/**
 * Firefox: MV3 background scripts run in an event page, which has a DOM, so the
 * audio element lives here directly and no offscreen document is involved.
 */
function createInPageController(): AudioController {
  let host: AudioHost | null = null;

  function ensureHost(): AudioHost {
    if (host) return host;
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    document.body.append(audio);
    host = new AudioHost(audio, broadcastQuietly);
    return host;
  }

  return {
    play: async (command) => ensureHost().play(command),
    pause: async () => ensureHost().pause(),
    restart: async () => ensureHost().restart(),
    setVolume: async (volume) => ensureHost().setVolume(volume),
    seek: async (seconds) => ensureHost().seek(seconds),
    getState: async () => host?.state ?? IDLE_PLAYBACK_STATE,
  };
}

export function createAudioController(): AudioController {
  return import.meta.env.FIREFOX
    ? createInPageController()
    : createOffscreenController();
}
