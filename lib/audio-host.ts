import type { PlaybackState, PlayCommand } from "@/lib/messaging";

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
 * playback. Runs wherever a DOM audio element can live: an offscreen document
 * on Chrome, the background event page on Firefox.
 *
 * It deliberately touches no extension API beyond the DOM. Chrome offscreen
 * documents have access to only a subset of extension APIs — `chrome.storage`
 * is not among them — so persisting from here threw and aborted playback
 * before `audio.play()` was ever reached. State is reported through `onState`
 * and the owner decides what to persist.
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
      // An ended track reports 0 rather than its final timestamp, so the popup
      // shows a rewound timeline and the saved resume position is the start.
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
      // Anything thrown between here and `audio.play()` -- a MediaMetadata
      // constructor that does not exist, a rejected src assignment -- used to
      // abort silently, leaving the UI stuck on "loading" forever.
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

    // Announced first, before src/load(): load() fires a `pause` event, and the
    // loading status is exactly what tells the pause handler to ignore it.
    // Emitting here also lets the popup show a spinner while a long surah
    // downloads -- Al-Baqarah is over 100 MB.
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

  /** Rewind to the start and play from there. */
  async restart(): Promise<void> {
    this.#seekTo(0);
    if (this.#audio.src) {
      try {
        await this.#audio.play();
      } catch {
        // A restart on a source the browser refuses to start is not fatal;
        // the state below still reflects position 0.
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

  // ---------------------------------------------------------------- internals

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
      // `ended` also fires a `pause`; keep the terminal state. `load()` fires
      // one too, which must not look like the user pausing mid-fetch —
      // an explicit pause() sets the status itself.
      if (this.#status === "ended" || this.#status === "loading") return;
      this.#status = "paused";
      this.#emit();
    });

    // Buffering after playback has already started.
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
      // Deliberately no seek here. Rewinding the element at the moment playback
      // ends races the very next thing that happens under continuous play --
      // `src` being replaced and `load()` called for the following surah --
      // and leaves the element wedged with no `loadedmetadata` and no error.
      // `state` reports position 0 for an ended track instead.
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
    this.#onState(this.state);
  }
}
