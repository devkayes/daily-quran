const POPUP_COMMANDS = new Set([
  "play",
  "pause",
  "restart",
  "volume",
  "timelineDrag",
]);

async function ensureOffscreen() {
  const isHasDocument = await chrome.offscreen.hasDocument();
  if (!isHasDocument) {
    await chrome.offscreen.createDocument({
      url: "./offscreen/offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification:
        "Necessary for playing Quranic audio in the background when the extension is active.",
    });
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  // Messages already addressed to the offscreen document, and the status
  // broadcasts coming back from it, are not ours to relay. Filtering here keeps
  // the worker from waking on every `timeupdate` tick during playback.
  if (!msg || msg.offscreen || !POPUP_COMMANDS.has(msg.type)) return;

  relay(msg);
});

async function relay(msg) {
  await ensureOffscreen();

  switch (msg.type) {
    case "play":
      await chrome.runtime.sendMessage({
        type: "play",
        play: msg.play,
        offscreen: true,
      });
      break;
    case "pause":
      await chrome.runtime.sendMessage({ type: "pause", offscreen: true });
      break;
    case "restart":
      await chrome.runtime.sendMessage({ type: "restart", offscreen: true });
      break;
    case "volume":
      await chrome.runtime.sendMessage({
        type: "volume",
        offscreen: true,
        volume: msg.volume,
      });
      break;
    case "timelineDrag":
      await chrome.runtime.sendMessage({
        type: "timelineDrag",
        offscreen: true,
        value: msg.value,
      });
      break;
  }
}
