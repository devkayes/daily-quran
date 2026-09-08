import { toBengaliDigits } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { TranslationLanguage } from "@/lib/storage";
import { SURAHS, type Surah, surahNameIn } from "@/lib/surahs";

interface Props {
  activeSurahNumber: number | null;
  isLoading: boolean;
  language: TranslationLanguage;
  onSelect: (surah: Surah) => void;
}

export function SurahList({ activeSurahNumber, isLoading, language, onSelect }: Props) {
  const isEnglish = language === "en";

  return (
    <div
      className="flex max-w-full overflow-x-auto whitespace-nowrap"
      role="toolbar"
      aria-orientation="horizontal"
      aria-label={t("surahListLabel")}
    >
      {SURAHS.map((surah) => {
        const isActive = surah.number === activeSurahNumber;
        const isLoadingThis = isActive && isLoading;

        return (
          <button
            key={surah.number}
            type="button"
            id={`surah${surah.number}`}
            aria-current={isActive ? "true" : undefined}
            aria-busy={isLoadingThis || undefined}
            onClick={() => onSelect(surah)}
            className={[
              "ml-[3px] cursor-pointer whitespace-nowrap rounded border px-2 py-1",
              "focus-visible:outline-2 focus-visible:outline-olive focus-visible:outline-offset-2",
              isActive ? "border-olive text-olive" : "border-neutral-400 text-ink",
            ].join(" ")}
          >
            {isLoadingThis ? (
              <span
                className="dq-spinner mr-1.5"
                role="status"
                aria-label={t("loadingAudio")}
              />
            ) : null}
            {`${isEnglish ? surah.number : toBengaliDigits(surah.number)}. ${surahNameIn(surah, language)}`}
          </button>
        );
      })}
    </div>
  );
}
