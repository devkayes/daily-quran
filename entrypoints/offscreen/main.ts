import { AudioHost } from "@/lib/audio-host";
import { onMessage, sendMessage } from "@/lib/messaging";

/**
 * Chrome/Edge only. The service worker has no DOM, so this document holds the
 * audio element. It persists nothing — offscreen documents cannot reach
 * `chrome.storage` — and reports every state change to the background instead.
 */
const audio = document.querySelector<HTMLAudioElement>("#player");
if (!audio) throw new Error("Offscreen document is missing its audio element.");

const host = new AudioHost(audio, (state) => {
  void sendMessage("hostStateChanged", state).catch(() => {});
});

/*
 * `play` and `restart` are acknowledged immediately, never awaited. Returning
 * their promise holds the message channel open until playback begins, and on a
 * slow connection Chrome closes it first — the sender then treats a perfectly
 * good play as a failure. State broadcasts carry the progress instead.
 */
onMessage("hostPlay", ({ data }) => {
  void host.play(data);
});
onMessage("hostPause", () => host.pause());
onMessage("hostRestart", () => {
  void host.restart();
});
onMessage("hostSetVolume", ({ data }) => host.setVolume(data));
onMessage("hostSeek", ({ data }) => host.seek(data));
onMessage("hostGetState", () => host.state);
