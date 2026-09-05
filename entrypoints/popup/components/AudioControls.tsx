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

/*
 * v1 sized these icons 15x15 *with* 6px padding under the browser default
 * `content-box`, so the glyph was a full 15px and the button came out ~27px.
 * Tailwind's preflight sets `border-box`, which made that same padding eat the
 * icon down to a 13x3 sliver -- visible as empty circles. The control is sized
 * explicitly now and the icon carries no padding, so neither box model changes
 * the result.
 */
const CONTROL = "h-[27px] w-[27px] shrink-0";
const iconClass = "block h-[15px] w-[15px]";
const controlClass = `${CONTROL} flex items-center justify-center rounded-full border border-black bg-transparent`;
const buttonClass = `${controlClass} cursor-pointer focus-visible:outline-2 focus-visible:outline-olive focus-visible:outline-offset-2`;

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
  const isLoading = playback.status === "loading";
  const duration = playback.duration > 0 ? playback.duration : 0;

  return (
    <div className="my-[10px] flex h-10 items-center justify-evenly">
      {isLoading ? (
        <span
          className={`${controlClass} cursor-default`}
          role="status"
          aria-label={t("loadingAudio")}
          title={t("loadingAudio")}
        >
          <span className="dq-spinner text-[15px]" />
        </span>
      ) : isPlaying ? (
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
