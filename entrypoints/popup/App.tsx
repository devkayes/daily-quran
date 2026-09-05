import { audioUrlFor } from "@/lib/audio-url";
import { env } from "@/lib/env";
import { t } from "@/lib/i18n";
import { sendMessage } from "@/lib/messaging";
import { nowPlayingItem, playbackPositionItem } from "@/lib/storage";
import { hasAudio, type Surah } from "@/lib/surahs";
import { AudioControls } from "./components/AudioControls";
import { AyahCard } from "./components/AyahCard";
import { SurahList } from "./components/SurahList";
import { useDailyAyah, usePlaybackState, useVolume } from "./hooks";

export function App() {
  const ayahQuery = useDailyAyah();
  const playback = usePlaybackState();
  const [volume, setVolume] = useVolume();

  async function play(surah?: Surah) {
    const target = surah ?? (await nowPlayingItem.getValue());

    if (target && "audioPath" in target && hasAudio(target)) {
      // A surah picked from the list: always start it from the beginning.
      await playbackPositionItem.setValue(0);
      await sendMessage("play", {
        url: audioUrlFor(target),
        surahNumber: target.number,
        name: target.name,
        volume,
        startAt: 0,
      });
      return;
    }

    if (target && "url" in target) {
      // Resuming whatever was loaded last.
      await sendMessage("play", {
        url: target.url,
        surahNumber: target.surahNumber,
        name: target.name,
        volume,
        startAt: await playbackPositionItem.getValue(),
      });
    }
  }

  return (
    <main className="px-2 pb-2">
      <AyahCard
        ayah={ayahQuery.data}
        isFetching={ayahQuery.isFetching}
        isError={ayahQuery.isError}
        onReload={() => void ayahQuery.refetch()}
      />

      <AudioControls
        playback={playback}
        volume={volume}
        onPlay={() => void play()}
        onPause={() => void sendMessage("pause", undefined).catch(() => {})}
        onRestart={() => void sendMessage("restart", undefined).catch(() => {})}
        onSeek={(seconds) => void sendMessage("seek", seconds).catch(() => {})}
        onVolumeChange={setVolume}
      />

      {playback.status === "error" ? (
        <p role="alert" className="my-1 text-sm text-violet">
          {playback.message ?? t("audioLoadError")}
        </p>
      ) : null}

      <SurahList
        activeSurahNumber={playback.surahNumber}
        onSelect={(surah) => void play(surah)}
      />

      <a
        href={env.aboutUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-2 flex justify-center text-xs underline"
      >
        {t("footerLink")}
      </a>
    </main>
  );
}
