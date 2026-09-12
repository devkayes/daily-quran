import { defineExtensionMessaging } from "@webext-core/messaging";

/** The typed message contract between popup, background and the audio host. */

export interface PlayCommand {
  url: string;
  surahNumber: number;
  name: string;
  /** 0..1 */
  volume: number;
  /** Seconds to resume from. */
  startAt: number;
}

export interface PlaybackState {
  /** "loading" covers both the initial fetch and mid-playback buffering. */
  status: "loading" | "playing" | "paused" | "ended" | "idle" | "error";
  /** Seconds. */
  position: number;
  /** Seconds; 0 until metadata loads. */
  duration: number;
  surahNumber: number | null;
  /** Present only when `status` is "error". */
  message?: string;
}

export const IDLE_PLAYBACK_STATE: PlaybackState = {
  status: "idle",
  position: 0,
  duration: 0,
  surahNumber: null,
};

interface ProtocolMap {
  // popup -> background
  play(command: PlayCommand): void;
  pause(): void;
  restart(): void;
  setVolume(volume: number): void;
  seek(seconds: number): void;
  getPlaybackState(): PlaybackState;

  // background -> audio host (offscreen document on Chrome)
  hostPlay(command: PlayCommand): void;
  hostPause(): void;
  hostRestart(): void;
  hostSetVolume(volume: number): void;
  hostSeek(seconds: number): void;
  hostGetState(): PlaybackState;

  // audio host -> background. Offscreen documents cannot reach chrome.storage,
  // so the host reports state and the background persists it.
  hostStateChanged(state: PlaybackState): void;

  // background -> popup
  playbackStateChanged(state: PlaybackState): void;
}

export const { sendMessage, onMessage, removeAllListeners } =
  defineExtensionMessaging<ProtocolMap>();

/** The popup is usually closed, so "no receiving end" is expected traffic. */
export function broadcastQuietly(state: PlaybackState): void {
  void sendMessage("playbackStateChanged", state).catch(() => {});
}
