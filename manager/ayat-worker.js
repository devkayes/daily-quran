const ayatReloadButton = document.getElementById("ayatReload");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const volumeTimeline = document.getElementById("volumeTimeline");
const audioTimeline = document.getElementById("audioTimeline");
const audioDuration = document.getElementById("audioDuration");
const arabicAyat = document.getElementById("arabicAyat");
const ayatMean = document.getElementById("ayatMean");
const readMore = document.getElementById("readMore");
const surahName = document.getElementById("surahName");
const ayatNumber = document.getElementById("ayatNumber");
const currentTime = document.getElementById("currentTime");

//* <--------------- On Initial ----------------->

volumeTimeline.value = lastVolume() * 10;

//* <--------------- On Initial ----------------->

//* <-------------- For Fetch Ayat -------------->
// ayatFetch();
ayatReloadButton.onclick = ayatFetch;

//*<---------------- Surah Audio Manager! ---------------->

playButton.addEventListener("click", () => {
  playAudio();
});

pauseButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "pause" });
});

restartButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "restart" });
});

audioTimeline.addEventListener("input", () => {
  chrome.runtime.sendMessage({
    type: "timelineDrag",
    value: +audioTimeline.value,
  });
});

volumeTimeline.addEventListener("input", () => {
  const volume = volumeTimeline.value;
  const realVolume = +volume / 10;

  localStorage.setItem("lastVolume", realVolume);

  chrome.runtime.sendMessage({ type: "volume", volume: realVolume });
});

readMore.addEventListener("click", () => {
  const surahNumber = readMore.getAttribute("surahNumber");
  handleReadMore(Number(surahNumber));
});

chrome.storage.local.get(["currentAudioDuration"], (result) => {
  const duration = result?.currentAudioDuration || 0;
  audioTimeline.max = duration;

  audioTimeline.value = 0;

  audioDuration.innerText = convertToBanglaNumber(
    formatSeconds(Number(duration).toFixed(1))
  );

  const clientLastAudio = localStorage.getItem("nowPlaying");
  if (!clientLastAudio) return;

  const lastAudio = JSON.parse(clientLastAudio);
  const elementId = `surah${lastAudio.number}`;
  const element = document.getElementById(elementId);

  if (!element) return;

  element.style.border = "1px solid #565100";
  element.style.color = "#565100";
});

chrome.runtime.onMessage.addListener(async (msg) => {
  switch (msg.type) {
    case "currentTime":
      playButton.style.display = "none";
      pauseButton.style.display = "block";

      audioTimeline.value = msg.value;

      currentTime.innerText = convertToBanglaNumber(
        formatSeconds(Number(msg.value).toFixed(1))
      );
      break;

    case "paused":
      playButton.style.display = "block";
      pauseButton.style.display = "none";
      break;

    case "finished":
      audioTimeline.value = 0;
      playButton.style.display = "block";
      pauseButton.style.display = "none";
      currentTime.innerText = "০০";
      break;
  }
});

//* <--------------- From here all the functions here ---------------->

function convertToBanglaNumber(number) {
  const englishToBanglaMap = {
    0: "০",
    1: "১",
    2: "২",
    3: "৩",
    4: "৪",
    5: "৫",
    6: "৬",
    7: "৭",
    8: "৮",
    9: "৯",
  };

  const englishDigits = number.toString().split("");
  const banglaDigits = englishDigits.map((digit) => {
    return englishToBanglaMap[digit] || digit;
  });

  return banglaDigits.join("");
}

function ayatFetch() {
  fetch(PAIQ_API.RANDOM_AYAT)
    .then((data) => data.json())
    .then((ayatData) => {
      const ayat = ayatData && ayatData.data;
      if (!ayat) return;

      arabicAyat.textContent = ayat.fullAyat;
      ayatMean.textContent = ayat.ayatMean;
      surahName.textContent = ayat.surahName;
      ayatNumber.textContent = `আয়াত ${convertToBanglaNumber(ayat.ayatNumber)}`;
      readMore.setAttribute("surahNumber", ayat.surahNumber);
    })
    .catch(() => {});
}

function getAudioInfo() {
  try {
    const clientLastAudio = localStorage.getItem("nowPlaying");
    const lastAudio = JSON.parse(clientLastAudio);

    if (lastAudio) {
      return lastAudio;
    } else {
      const staticInfo = surahList[0];
      return staticInfo;
    }
  } catch (error) {
    const staticInfo = surahList[0];

    return staticInfo;
  }
}

function getAudioDuration(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);

    audio.addEventListener("loadedmetadata", () => {
      const duration = audio.duration;

      resolve(duration);
    });

    audio.addEventListener("error", (e) => {
      reject("Error loading audio file.");
    });
  });
}

function playAudio() {
  const audioInfo = getAudioInfo();

  getAudioDuration(audioInfo.url)
    .then((duration) => {
      audioDuration.innerText = convertToBanglaNumber(
        formatSeconds(Number(duration).toFixed(1))
      );

      chrome.storage.local.set({ currentAudioDuration: duration }, () => {
        audioTimeline.max = duration;
      });
    })
    .catch((err) => {});

  chrome.runtime.sendMessage({
    type: "play",
    play: { source: audioInfo.url, volume: lastVolume() },
  });
}

function lastVolume() {
  const volume = Number(localStorage.getItem("lastVolume")) || 0.5;

  return volume;
}

function formatSeconds(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60); // Integer seconds only

  // Format each time unit with leading zeros
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(secs).padStart(2, "0");

  // Return based on presence of hours
  return hours > 0
    ? `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
    : `${formattedMinutes}:${formattedSeconds}`;
}

function handleReadMore(surahNumber) {
  window.open(`${PAIQ_API.FULL_SURAH}/${surahNumber}`, "_blank");
}
