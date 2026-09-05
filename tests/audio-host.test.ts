import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { AudioHost } from "@/lib/audio-host";
import type { PlaybackState, PlayCommand } from "@/lib/messaging";
import {
  audioDurationItem,
  nowPlayingItem,
  playbackPositionItem,
  volumeItem,
} from "@/lib/storage";
import { FakeAudio } from "./fake-audio";

const COMMAND: PlayCommand = {
  url: "https://audio.example.test/1-fatiha.mp3",
  surahNumber: 1,
  name: "সূরা আল ফাতিহা",
  volume: 0.5,
  startAt: 0,
};

function setup() {
  const audio = new FakeAudio();
  const states: PlaybackState[] = [];
  const host = new AudioHost(audio.asElement(), (state) => states.push(state));
  return { audio, host, states, latest: () => states.at(-1) };
}

beforeEach(() => {
  fakeBrowser.reset();
});

describe("AudioHost.play", () => {
  it("points the element at the requested recitation and starts it", async () => {
    const { audio, host } = setup();
    await host.play(COMMAND);

    expect(audio.src).toBe(COMMAND.url);
    expect(audio.loadCalls).toBe(1);
    expect(audio.playCalls).toBe(1);
  });

  it("records what is now playing so a later popup can resume it", async () => {
    const { host } = setup();
    await host.play(COMMAND);

    expect(await nowPlayingItem.getValue()).toEqual({
      surahNumber: 1,
      name: "সূরা আল ফাতিহা",
      url: COMMAND.url,
    });
  });

  it("does not reload the element when the same surah is resumed", async () => {
    const { audio, host } = setup();
    await host.play(COMMAND);
    audio.loadMetadata(120);
    audio.advanceTo(30);

    await host.play({ ...COMMAND, startAt: 30 });

    expect(audio.loadCalls).toBe(1);
    expect(audio.currentTime).toBe(30);
  });

  // v1 set `currentTime` immediately after `play()`, before metadata existed,
  // so a cold resume silently started from zero.
  it("defers a resume seek until metadata has loaded", async () => {
    const { audio, host } = setup();
    await host.play({ ...COMMAND, startAt: 42 });

    expect(audio.currentTime).toBe(0);

    audio.loadMetadata(120);
    expect(audio.currentTime).toBe(42);
  });

  it("reports an error state when the browser refuses to start playback", async () => {
    const { audio, host, latest } = setup();
    audio.playRejection = new Error("blocked");

    await host.play(COMMAND);

    expect(latest()?.status).toBe("error");
    expect(latest()?.message).toBe("blocked");
  });

  it("publishes the duration once metadata arrives", async () => {
    const { audio, host } = setup();
    await host.play(COMMAND);
    audio.loadMetadata(213.5);

    expect(await audioDurationItem.getValue()).toBe(213.5);
  });
});

describe("AudioHost.setVolume", () => {
  it("clamps out-of-range values into 0..1", () => {
    const { audio, host } = setup();

    host.setVolume(2);
    expect(audio.volume).toBe(1);

    host.setVolume(-1);
    expect(audio.volume).toBe(0);

    host.setVolume(Number.NaN);
    expect(audio.volume).toBe(0);
  });

  it("persists the level so the next popup opens at it", async () => {
    const { host } = setup();
    host.setVolume(0.3);
    expect(await volumeItem.getValue()).toBe(0.3);
  });
});

describe("AudioHost.seek", () => {
  it("clamps to the loaded duration", async () => {
    const { audio, host } = setup();
    await host.play(COMMAND);
    audio.loadMetadata(100);

    host.seek(250);
    expect(audio.currentTime).toBe(100);

    host.seek(-5);
    expect(audio.currentTime).toBe(0);
  });

  it("persists the new position immediately", async () => {
    const { audio, host } = setup();
    await host.play(COMMAND);
    audio.loadMetadata(100);

    host.seek(55);
    expect(await playbackPositionItem.getValue()).toBe(55);
  });
});

describe("AudioHost.restart", () => {
  // v1's "restart" only paused, and never told the popup, so the UI kept
  // showing a pause button over stopped audio.
  it("rewinds to zero and plays again", async () => {
    const { audio, host, latest } = setup();
    await host.play(COMMAND);
    audio.loadMetadata(100);
    audio.advanceTo(60);

    await host.restart();

    expect(audio.currentTime).toBe(0);
    expect(audio.playCalls).toBe(2);
    expect(await playbackPositionItem.getValue()).toBe(0);
    expect(latest()?.position).toBe(0);
  });
});

describe("AudioHost state broadcasts", () => {
  it("reports playing, then paused", async () => {
    const { host, states } = setup();
    await host.play(COMMAND);
    expect(states.at(-1)?.status).toBe("playing");

    host.pause();
    expect(states.at(-1)?.status).toBe("paused");
  });

  it("reports ended and resets the position when the surah finishes", async () => {
    const { audio, host, latest } = setup();
    await host.play(COMMAND);
    audio.loadMetadata(100);
    audio.advanceTo(99);

    audio.finish();

    expect(latest()?.status).toBe("ended");
    expect(latest()?.position).toBe(0);
    expect(await playbackPositionItem.getValue()).toBe(0);
  });

  it("reports an error when the source fails to load", async () => {
    const { audio, host, latest } = setup();
    await host.play(COMMAND);
    audio.fail();

    expect(latest()?.status).toBe("error");
  });

  it("never emits a NaN duration before metadata loads", async () => {
    const { host, states } = setup();
    await host.play(COMMAND);

    expect(states.every((s) => Number.isFinite(s.duration))).toBe(true);
  });

  it("throttles position writes but broadcasts every tick", async () => {
    vi.useFakeTimers();
    try {
      const { audio, host, states } = setup();
      await host.play(COMMAND);
      audio.loadMetadata(100);

      const before = states.length;
      audio.advanceTo(1);
      audio.advanceTo(2);
      audio.advanceTo(3);

      expect(states.length - before).toBe(3);
      // Only the first tick inside the throttle window reaches storage.
      expect(await playbackPositionItem.getValue()).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
