import { formatDuration } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { PlaybackState } from "@/lib/messaging";

interface Props {
  playback: PlaybackState;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
}

const iconClass = "h-[15px] w-[15px] px-px py-1.5";
const buttonClass =
  "flex items-center justify-center rounded-full border border-black bg-transparent cursor-pointer focus-visible:outline-2 focus-visible:outline-olive focus-visible:outline-offset-2";

export function AudioControls({
  playback,
  volume,
  onPlay,
  onPause,
  onRestart,
  onSeek,
  onVolumeChange,
}: Props) {
  const isPlaying = playback.status === "playing";
  const duration = playback.duration > 0 ? playback.duration : 0;

  return (
    <div className="my-[10px] flex h-10 items-center justify-evenly">
      {isPlaying ? (
        <button
          type="button"
          onClick={onPause}
          aria-label={t("pause")}
          className={buttonClass}
        >
          <img src="/icon/pause-icon.svg" alt="" className={iconClass} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onPlay}
          aria-label={t("play")}
          className={buttonClass}
        >
          <img src="/icon/play-icon.svg" alt="" className={iconClass} />
        </button>
      )}

      <div className="flex w-[60%] flex-row items-center justify-evenly">
        <input
          type="range"
          className="dq-range mb-[5px] w-[95%]"
          aria-label={t("progress")}
          min={0}
          max={duration || 1}
          step={0.1}
          value={Math.min(playback.position, duration || 1)}
          onChange={(event) => onSeek(Number(event.target.value))}
          disabled={duration === 0}
        />
        <div className="ml-[5px] flex gap-[5px] text-sm tabular-nums">
          <span>{formatDuration(playback.position)}</span>
          <span>/</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <div className="flex w-[15%] items-center justify-center">
        <img src="/icon/speaker.svg" alt="" className={iconClass} />
        <input
          type="range"
          className="dq-range w-[95%]"
          aria-label={t("volume")}
          min={0}
          max={10}
          step={1}
          value={Math.round(volume * 10)}
          onChange={(event) => onVolumeChange(Number(event.target.value) / 10)}
        />
      </div>

      <button
        type="button"
        onClick={onRestart}
        aria-label={t("restart")}
        className={buttonClass}
      >
        <img src="/icon/restart-icon.svg" alt="" className={iconClass} />
      </button>
    </div>
  );
}
