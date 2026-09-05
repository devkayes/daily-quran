import { defineExtensionMessaging } from "@webext-core/messaging";

/**
 * The message contract between popup, background and the audio host.
 *
 * v1 passed untyped `{ type, ... }` bags through a stringly-typed `switch`, and
 * used an `offscreen: true` marker so the worker could tell its own relayed
 * traffic apart from the offscreen document's replies. Here every message has a
 * declared payload and return type, and the two legs of the relay have distinct
 * names — so the worker cannot receive a message meant for the audio host, and
 * sender and receiver cannot disagree about a payload.
 */

export interface PlayCommand {
  /** Absolute URL of the recitation to play. */
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
  // ---- popup -> background ----
  play(command: PlayCommand): void;
  pause(): void;
  restart(): void;
  setVolume(volume: number): void;
  seek(seconds: number): void;
  getPlaybackState(): PlaybackState;

  // ---- background -> audio host (offscreen document on Chrome) ----
  hostPlay(command: PlayCommand): void;
  hostPause(): void;
  hostRestart(): void;
  hostSetVolume(volume: number): void;
  hostSeek(seconds: number): void;
  hostGetState(): PlaybackState;

  // ---- audio host -> background ----
  // Chrome offscreen documents cannot reach chrome.storage, so the host reports
  // state here and the background is the one that persists it.
  hostStateChanged(state: PlaybackState): void;

  // ---- background -> popup ----
  playbackStateChanged(state: PlaybackState): void;
}

export const { sendMessage, onMessage, removeAllListeners } =
  defineExtensionMessaging<ProtocolMap>();

/**
 * Broadcasts that nobody may be listening to — the popup is usually closed —
 * must not reject. Every "no receiving end" error is expected traffic.
 */
export function broadcastQuietly(state: PlaybackState): void {
  void sendMessage("playbackStateChanged", state).catch(() => {});
}
