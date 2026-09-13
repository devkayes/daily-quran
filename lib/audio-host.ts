import type { PlaybackState, PlayCommand } from "@/lib/messaging";

/** Inlined: the global is absent in non-browser DOMs, where the guard below would silently pass. */
const HAVE_METADATA = 1;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Owns the single `<audio>` element and is the sole source of truth for playback.
 * Runs wherever a DOM audio element can live: an offscreen document on Chrome, the
 * background event page on Firefox.
 *
 * Touches no extension API beyond the DOM. Offscreen documents cannot reach
 * `chrome.storage`, and calling it here threw before `audio.play()` was reached.
 * State is reported through `onState`; the owner decides what to persist.
 */
export class AudioHost {
  readonly #audio: HTMLAudioElement;
  readonly #onState: (state: PlaybackState) => void;

  #surahNumber: number | null = null;
  #status: PlaybackState["status"] = "idle";
  #errorMessage: string | undefined;
  #pendingSeek: number | null = null;

  constructor(audio: HTMLAudioElement, onState: (state: PlaybackState) => void) {
    this.#audio = audio;
    this.#onState = onState;
    this.#attachListeners();
  }

  get state(): PlaybackState {
    const duration = Number.isFinite(this.#audio.duration) ? this.#audio.duration : 0;
    return {
      status: this.#status,
      // An ended track reports 0 rather than its final timestamp, so the resume
      // position saved from here is the start.
      position:
        this.#status === "ended" || !Number.isFinite(this.#audio.currentTime)
          ? 0
          : this.#audio.currentTime,
      duration,
      surahNumber: this.#surahNumber,
      ...(this.#errorMessage === undefined ? {} : { message: this.#errorMessage }),
    };
  }

  async play(command: PlayCommand): Promise<void> {
    try {
      await this.#startPlayback(command);
    } catch (cause) {
      // Without this the UI stuck on "loading" forever whenever anything before
      // audio.play() threw.
      this.#status = "error";
      this.#errorMessage =
        cause instanceof Error ? cause.message : "Playback could not start.";
      this.#emit();
    }
  }

  async #startPlayback(command: PlayCommand): Promise<void> {
    const audio = this.#audio;
    this.#errorMessage = undefined;
    this.#surahNumber = command.surahNumber;
    audio.volume = clamp01(command.volume);

    // Must precede src/load(): load() fires `pause`, and the loading status is what
    // tells the pause handler to ignore it.
    this.#status = "loading";
    this.#emit();

    const isSameSource = audio.currentSrc === command.url || audio.src === command.url;

    if (!isSameSource) {
      audio.src = command.url;
      this.#pendingSeek = Math.max(0, command.startAt);
      audio.load();
    }

    this.#setMediaMetadata(command.name);
    this.#applyPendingSeek();

    await audio.play();
  }

  pause(): void {
    this.#audio.pause();
    this.#status = "paused";
    this.#emit();
  }

  async restart(): Promise<void> {
    this.#seekTo(0);
    if (this.#audio.src) {
      try {
        await this.#audio.play();
      } catch {
        // Not fatal; the emitted state still reflects position 0.
      }
    }
    this.#emit();
  }

  setVolume(volume: number): void {
    this.#audio.volume = clamp01(volume);
  }

  seek(seconds: number): void {
    this.#seekTo(seconds);
    this.#emit();
  }

  #attachListeners(): void {
    const audio = this.#audio;

    audio.addEventListener("loadedmetadata", () => {
      this.#applyPendingSeek();
      this.#emit();
    });

    audio.addEventListener("playing", () => {
      this.#status = "playing";
      this.#emit();
    });

    audio.addEventListener("pause", () => {
      // `ended` and `load()` both fire `pause`; neither means the user paused.
      if (this.#status === "ended" || this.#status === "loading") return;
      this.#status = "paused";
      this.#emit();
    });

    audio.addEventListener("waiting", () => {
      if (this.#status !== "playing") return;
      this.#status = "loading";
      this.#emit();
    });

    audio.addEventListener("timeupdate", () => {
      if (this.#status !== "playing") return;
      this.#emit();
    });

    audio.addEventListener("ended", () => {
      this.#status = "ended";
      // Deliberately no seek: rewinding here races the `src` swap that continuous
      // play performs next, wedging the element with no `loadedmetadata` and no
      // error. `state` reports position 0 for an ended track instead.
      this.#emit();
    });

    audio.addEventListener("error", () => {
      this.#status = "error";
      this.#errorMessage = "This recitation could not be loaded.";
      this.#emit();
    });
  }

  #applyPendingSeek(): void {
    if (this.#pendingSeek === null) return;
    // `currentTime` is a silent no-op before metadata arrives.
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
        // Not every action exists on every platform.
      }
    }
  }

  #emit(): void {
    this.#onState(this.state);
  }
}
