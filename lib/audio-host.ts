import type { PlaybackState, PlayCommand } from "@/lib/messaging";
import {
  audioDurationItem,
  nowPlayingItem,
  playbackPositionItem,
  volumeItem,
} from "@/lib/storage";

const POSITION_PERSIST_INTERVAL_MS = 1000;

/**
 * `HTMLMediaElement.HAVE_METADATA`, inlined. Reading it off the global would
 * make this guard depend on a constant that is absent in non-browser DOM
 * implementations, where `readyState < undefined` is false and the guard
 * silently stops guarding.
 */
const HAVE_METADATA = 1;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Owns the single `<audio>` element and is the only source of truth for
 * playback. Runs inside whichever context can hold a DOM audio element: an
 * offscreen document on Chrome, the background event page on Firefox.
 *
 * It reports state two ways — a broadcast for a popup that is open right now,
 * and `chrome.storage` for a popup that opens later — so a freshly opened popup
 * paints the correct state without waiting for a round trip.
 */
export class AudioHost {
  readonly #audio: HTMLAudioElement;
  readonly #broadcast: (state: PlaybackState) => void;

  #surahNumber: number | null = null;
  #status: PlaybackState["status"] = "idle";
  #errorMessage: string | undefined;
  #pendingSeek: number | null = null;
  #lastPersistedAt = 0;

  constructor(audio: HTMLAudioElement, broadcast: (state: PlaybackState) => void) {
    this.#audio = audio;
    this.#broadcast = broadcast;
    this.#attachListeners();
    void this.#restoreVolume();
  }

  get state(): PlaybackState {
    const duration = Number.isFinite(this.#audio.duration) ? this.#audio.duration : 0;
    return {
      status: this.#status,
      position: Number.isFinite(this.#audio.currentTime) ? this.#audio.currentTime : 0,
      duration,
      surahNumber: this.#surahNumber,
      ...(this.#errorMessage === undefined ? {} : { message: this.#errorMessage }),
    };
  }

  async play(command: PlayCommand): Promise<void> {
    const audio = this.#audio;
    this.#errorMessage = undefined;
    this.#surahNumber = command.surahNumber;
    audio.volume = clamp01(command.volume);

    const isSameSource = audio.currentSrc === command.url || audio.src === command.url;

    if (!isSameSource) {
      audio.src = command.url;
      this.#pendingSeek = Math.max(0, command.startAt);
      audio.load();
      await nowPlayingItem.setValue({
        surahNumber: command.surahNumber,
        name: command.name,
        url: command.url,
      });
    }

    this.#setMediaMetadata(command.name);
    this.#applyPendingSeek();

    try {
      await audio.play();
    } catch (cause) {
      this.#status = "error";
      this.#errorMessage =
        cause instanceof Error ? cause.message : "Playback could not start.";
      this.#emit();
    }
  }

  pause(): void {
    this.#audio.pause();
    void this.#persistPosition(true);
  }

  /** Rewind to the start and play from there. */
  async restart(): Promise<void> {
    this.#seekTo(0);
    await this.#persistPosition(true);
    if (this.#audio.src) {
      try {
        await this.#audio.play();
      } catch {
        // A restart on a source the browser refuses to start is not fatal;
        // the state broadcast below still reflects position 0.
      }
    }
    this.#emit();
  }

  setVolume(volume: number): void {
    const next = clamp01(volume);
    this.#audio.volume = next;
    void volumeItem.setValue(next);
  }

  seek(seconds: number): void {
    this.#seekTo(seconds);
    void this.#persistPosition(true);
    this.#emit();
  }

  // ---------------------------------------------------------------- internals

  #attachListeners(): void {
    const audio = this.#audio;

    audio.addEventListener("loadedmetadata", () => {
      this.#applyPendingSeek();
      void audioDurationItem.setValue(
        Number.isFinite(audio.duration) ? audio.duration : 0,
      );
      this.#emit();
    });

    audio.addEventListener("playing", () => {
      this.#status = "playing";
      this.#emit();
    });

    audio.addEventListener("pause", () => {
      // `ended` also fires a `pause`; keep the terminal state.
      if (this.#status === "ended") return;
      this.#status = "paused";
      this.#emit();
    });

    audio.addEventListener("timeupdate", () => {
      if (this.#status !== "playing") return;
      void this.#persistPosition(false);
      this.#emit();
    });

    audio.addEventListener("ended", () => {
      this.#status = "ended";
      this.#seekTo(0);
      void this.#persistPosition(true);
      this.#emit();
    });

    audio.addEventListener("error", () => {
      this.#status = "error";
      this.#errorMessage = "This recitation could not be loaded.";
      this.#emit();
    });
  }

  async #restoreVolume(): Promise<void> {
    this.#audio.volume = clamp01(await volumeItem.getValue());
  }

  #applyPendingSeek(): void {
    if (this.#pendingSeek === null) return;
    // `currentTime` silently does nothing before metadata arrives, which is why
    // v1 lost the resume position on a cold start.
    if (this.#audio.readyState < HAVE_METADATA) return;
    this.#seekTo(this.#pendingSeek);
    this.#pendingSeek = null;
  }

  #seekTo(seconds: number): void {
    const duration = this.#audio.duration;
    const max = Number.isFinite(duration) ? duration : Number.MAX_SAFE_INTEGER;
    const target = Math.min(Math.max(0, seconds), max);
    try {
      this.#audio.currentTime = target;
    } catch {
      this.#pendingSeek = target;
    }
  }

  async #persistPosition(force: boolean): Promise<void> {
    const now = Date.now();
    if (!force && now - this.#lastPersistedAt < POSITION_PERSIST_INTERVAL_MS) return;
    this.#lastPersistedAt = now;
    const position = Number.isFinite(this.#audio.currentTime)
      ? this.#audio.currentTime
      : 0;
    await playbackPositionItem.setValue(position);
  }

  #setMediaMetadata(name: string): void {
    if (!("mediaSession" in navigator) || !navigator.mediaSession) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: name,
      artist: "Daily Quran",
    });

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => void this.#audio.play()],
      ["pause", () => this.pause()],
      ["seekbackward", () => this.seek(Math.max(0, this.#audio.currentTime - 10))],
      ["seekforward", () => this.seek(this.#audio.currentTime + 10)],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Not every action is supported on every platform.
      }
    }
  }

  #emit(): void {
    this.#broadcast(this.state);
  }
}
