chrome.runtime.onMessage.addListener((msg) => {
  if (!msg.offscreen) {
    return;
  }
  switch (msg.type) {
    case "play":
      playAudio(msg.play);
      break;

    case "pause":
      pauseAudio();
      break;

    case "restart":
      restartAudio();
      break;

    case "volume":
      volumeChanged(msg.volume);
      break;

    case "timelineDrag":
      changeTimeline(msg.value);
      break;
  }
});

const audio = document.querySelector("audio");

if (audio) {
  audio.addEventListener("timeupdate", () => {
    if (!audio.paused) {
      chrome.runtime.sendMessage({
        type: "currentTime",
        value: audio.currentTime,
      });
    }
  });
}

audio.addEventListener("ended", () => {
  chrome.runtime.sendMessage({
    type: "finished",
  });
});

function playAudio(play) {
  const currSource = audio?.src?.split("/") || [];
  const currentSource = currSource.pop();

  const file = play?.source || audioUrl;

  if (audio.paused && currentSource === file) {
    audio.play();
    audio.currentTime = Number(getFromLocalStorage("pauseAudio"));
  } else {
    audio.src = file;
    audio.volume = play?.volume;

    audio.play();
    audio.currentTime = Number(getFromLocalStorage("pauseAudio"));
  }

  logToLocalStorage("pauseAudio", {
    preStage: 0,
  });
}

function pauseAudio() {
  logToLocalStorage("pauseAudio", {
    preStage: audio.currentTime,
  });

  audio.pause();

  chrome.runtime.sendMessage({
    type: "paused",
    value: audio.currentTime,
  });
}

function restartAudio() {
  logToLocalStorage("pauseAudio", {
    preStage: 0,
  });

  audio.pause();
  audio.currentTime = 0;

  chrome.runtime.sendMessage({
    type: "paused",
    value: 0,
  });
}

function volumeChanged(value) {
  audio.volume = value;
}

function logToLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFromLocalStorage(key) {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value).preStage : 0;
}

function changeTimeline(value) {
  audio.currentTime = value;
}
