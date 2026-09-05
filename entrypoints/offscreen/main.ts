import { AudioHost } from "@/lib/audio-host";
import { onMessage, sendMessage } from "@/lib/messaging";

/**
 * Chrome/Edge only. The service worker has no DOM, so this document holds the
 * audio element and stays alive for as long as it is playing.
 *
 * It persists nothing: offscreen documents cannot reach `chrome.storage`. Every
 * state change is reported to the background, which owns persistence and
 * forwards the state on to the popup.
 */
const audio = document.querySelector<HTMLAudioElement>("#player");
if (!audio) throw new Error("Offscreen document is missing its audio element.");

const host = new AudioHost(audio, (state) => {
  void sendMessage("hostStateChanged", state).catch(() => {});
});

onMessage("hostPlay", ({ data }) => host.play(data));
onMessage("hostPause", () => host.pause());
onMessage("hostRestart", () => host.restart());
onMessage("hostSetVolume", ({ data }) => host.setVolume(data));
onMessage("hostSeek", ({ data }) => host.seek(data));
onMessage("hostGetState", () => host.state);
