/**
 * A controllable stand-in for HTMLAudioElement. happy-dom gives us an element,
 * but `duration` and `readyState` are read-only there and no media ever loads,
 * so the AudioHost state machine cannot be driven. This exposes both.
 */
export class FakeAudio extends EventTarget {
  src = "";
  currentSrc = "";
  volume = 1;
  paused = true;
  duration = Number.NaN;
  currentTime = 0;
  readyState = 0;
  preload = "metadata";

  playCalls = 0;
  pauseCalls = 0;
  loadCalls = 0;
  playRejection: Error | null = null;

  async play(): Promise<void> {
    this.playCalls += 1;
    if (this.playRejection) throw this.playRejection;
    this.paused = false;
    this.dispatchEvent(new Event("playing"));
  }

  pause(): void {
    this.pauseCalls += 1;
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }

  load(): void {
    this.loadCalls += 1;
    this.currentSrc = this.src;
  }

  /** Simulates the browser finishing metadata load for `seconds` of audio. */
  loadMetadata(seconds: number): void {
    this.duration = seconds;
    this.readyState = 1; // HAVE_METADATA
    this.dispatchEvent(new Event("loadedmetadata"));
  }

  /** Simulates playback advancing to `seconds`. */
  advanceTo(seconds: number): void {
    this.currentTime = seconds;
    this.dispatchEvent(new Event("timeupdate"));
  }

  finish(): void {
    this.paused = true;
    this.dispatchEvent(new Event("ended"));
  }

  fail(): void {
    this.dispatchEvent(new Event("error"));
  }

  asElement(): HTMLAudioElement {
    return this as unknown as HTMLAudioElement;
  }
}
