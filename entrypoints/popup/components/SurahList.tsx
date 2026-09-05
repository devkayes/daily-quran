import { toBengaliDigits } from "@/lib/format";
import { t } from "@/lib/i18n";
import { hasAudio, SURAHS_AUDIO_FIRST, type Surah } from "@/lib/surahs";

interface Props {
  activeSurahNumber: number | null;
  onSelect: (surah: Surah) => void;
}

export function SurahList({ activeSurahNumber, onSelect }: Props) {
  return (
    <div
      className="flex max-w-full overflow-x-auto whitespace-nowrap"
      role="toolbar"
      aria-orientation="horizontal"
      aria-label={t("surahListLabel")}
    >
      {SURAHS_AUDIO_FIRST.map((surah) => {
        const playable = hasAudio(surah);
        const isActive = playable && surah.number === activeSurahNumber;

        return (
          <button
            key={surah.number}
            type="button"
            id={`surah${surah.number}`}
            disabled={!playable}
            aria-current={isActive ? "true" : undefined}
            title={playable ? undefined : t("comingSoon")}
            onClick={() => onSelect(surah)}
            className={[
              "ml-[3px] cursor-pointer whitespace-nowrap rounded border px-2 py-1",
              "focus-visible:outline-2 focus-visible:outline-olive focus-visible:outline-offset-2",
              playable
                ? isActive
                  ? "border-olive text-olive"
                  : "border-neutral-400 text-ink"
                : "cursor-not-allowed border-disabled text-disabled",
            ].join(" ")}
          >
            {`${toBengaliDigits(surah.number)}. ${surah.name}`}
          </button>
        );
      })}
    </div>
  );
}
