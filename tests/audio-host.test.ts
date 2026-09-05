import { describe, expect, it } from "vitest";
import { AudioHost } from "@/lib/audio-host";
import type { PlaybackState, PlayCommand } from "@/lib/messaging";
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

describe("AudioHost.play", () => {
  it("points the element at the requested recitation and starts it", async () => {
    const { audio, host } = setup();
    await host.play(COMMAND);

    expect(audio.src).toBe(COMMAND.url);
    expect(audio.loadCalls).toBe(1);
    expect(audio.playCalls).toBe(1);
  });

  // Chrome offscreen documents cannot reach chrome.storage. A storage call here
  // used to throw before `audio.play()` was reached, so nothing ever played.
  it("touches no extension API, only the audio element", async () => {
    const { audio, host, latest } = setup();
    await host.play(COMMAND);

    expect(audio.playCalls).toBe(1);
    expect(latest()?.surahNumber).toBe(1);
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

  it("reports the duration once metadata arrives", async () => {
    const { audio, host, latest } = setup();
    await host.play(COMMAND);
    audio.loadMetadata(213.5);

    expect(latest()?.duration).toBe(213.5);
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

  it("applies the level to the element", () => {
    const { audio, host } = setup();
    host.setVolume(0.3);
    expect(audio.volume).toBe(0.3);
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

  it("reports the new position immediately", async () => {
    const { audio, host, latest } = setup();
    await host.play(COMMAND);
    audio.loadMetadata(100);

    host.seek(55);
    expect(latest()?.position).toBe(55);
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

  it("emits on every playback tick", async () => {
    const { audio, host, states } = setup();
    await host.play(COMMAND);
    audio.loadMetadata(100);

    const before = states.length;
    audio.advanceTo(1);
    audio.advanceTo(2);
    audio.advanceTo(3);

    expect(states.length - before).toBe(3);
    expect(states.at(-1)?.position).toBe(3);
  });
});

describe("AudioHost loading state", () => {
  it("reports loading before the recitation has started", async () => {
    const { audio, host, states } = setup();
    audio.playRejection = null;

    const pending = host.play(COMMAND);
    // Emitted before play() resolves, so the popup can show a spinner while a
    // 100 MB surah downloads.
    expect(states.some((s) => s.status === "loading")).toBe(true);
    await pending;
  });

  it("clears loading once playback actually begins", async () => {
    const { host, latest } = setup();
    await host.play(COMMAND);
    expect(latest()?.status).toBe("playing");
  });

  // load() fires a `pause` event. Treating that as a user pause would flash the
  // play button in the middle of fetching.
  it("does not let the load() pause event cancel the loading state", async () => {
    const { audio, host, states } = setup();
    audio.playRejection = new Error("still buffering");

    await host.play(COMMAND);

    const afterLoad = states.map((s) => s.status);
    expect(afterLoad).not.toContain("paused");
  });

  it("returns to loading when the stream stalls mid-playback", async () => {
    const { audio, host, latest } = setup();
    await host.play(COMMAND);
    expect(latest()?.status).toBe("playing");

    audio.stall();
    expect(latest()?.status).toBe("loading");
  });

  it("ignores a stall that arrives when nothing is playing", () => {
    const { audio, host, latest } = setup();
    audio.stall();
    expect(latest()).toBeUndefined();
    expect(host.state.status).toBe("idle");
  });

  it("an explicit pause still wins over loading", async () => {
    const { host, latest } = setup();
    await host.play(COMMAND);
    host.pause();
    expect(latest()?.status).toBe("paused");
  });
});
