import { audioUrlFor } from "@/lib/audio-url";
import { t } from "@/lib/i18n";
import { sendMessage } from "@/lib/messaging";
import { nowPlayingItem, playbackPositionItem } from "@/lib/storage";
import { FIRST_SURAH, type Surah } from "@/lib/surahs";
import { AudioControls } from "./components/AudioControls";
import { AyahCard } from "./components/AyahCard";
import { Credits } from "./components/Credits";
import { SurahList } from "./components/SurahList";
import {
  useContinuousPlayback,
  useDailyAyah,
  useEnglishAyah,
  usePlaybackState,
  useTranslationLanguage,
  useVolume,
} from "./hooks";

export function App() {
  const ayahQuery = useDailyAyah();
  const playback = usePlaybackState();
  const [volume, setVolume] = useVolume();
  const [continuous, setContinuous] = useContinuousPlayback();
  const [language, setLanguage] = useTranslationLanguage();
  const englishQuery = useEnglishAyah(ayahQuery.data, language === "en");

  async function play(surah?: Surah): Promise<void> {
    // A surah picked from the list always starts from the beginning.
    if (surah) {
      await sendMessage("play", {
        url: audioUrlFor(surah),
        surahNumber: surah.number,
        name: surah.name,
        volume,
        startAt: 0,
      });
      return;
    }

    // The play button resumes whatever was loaded last. The URL is rebuilt
    // from the surah number rather than replayed from storage, so changing
    // reciter, bitrate or CDN cannot strand anyone on a dead address.
    const resuming = await nowPlayingItem.getValue();
    if (resuming) {
      await sendMessage("play", {
        url: audioUrlFor({ number: resuming.surahNumber, name: resuming.name }),
        surahNumber: resuming.surahNumber,
        name: resuming.name,
        volume,
        startAt: await playbackPositionItem.getValue(),
      });
      return;
    }

    // Nothing has ever played. v1 fell back to the first surah here; without
    // this the play button silently did nothing.
    await sendMessage("play", {
      url: audioUrlFor(FIRST_SURAH),
      surahNumber: FIRST_SURAH.number,
      name: FIRST_SURAH.name,
      volume,
      startAt: 0,
    });
  }

  return (
    <main className="px-2 pb-2">
      <AyahCard
        ayah={ayahQuery.data}
        isFetching={ayahQuery.isFetching}
        isError={ayahQuery.isError}
        onReload={() => void ayahQuery.refetch()}
        language={language}
        onLanguageChange={setLanguage}
        english={englishQuery.data}
        englishLoading={englishQuery.isFetching}
        englishError={englishQuery.isError}
      />

      <AudioControls
        playback={playback}
        volume={volume}
        onPlay={() => void play().catch(() => {})}
        onPause={() => void sendMessage("pause", undefined).catch(() => {})}
        onRestart={() => void sendMessage("restart", undefined).catch(() => {})}
        onSeek={(seconds) => void sendMessage("seek", seconds).catch(() => {})}
        onVolumeChange={setVolume}
        continuous={continuous}
        onToggleContinuous={setContinuous}
      />

      {playback.status === "error" ? (
        <p role="alert" className="my-1 text-sm text-violet">
          {playback.message ?? t("audioLoadError")}
        </p>
      ) : null}

      <SurahList
        activeSurahNumber={playback.surahNumber}
        isLoading={playback.status === "loading"}
        onSelect={(surah) => void play(surah)}
      />

      <Credits />
    </main>
  );
}
