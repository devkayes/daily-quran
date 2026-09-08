import { useMemo } from "react";
import { orderByFavorites } from "@/lib/favorites";
import { toBengaliDigits } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { TranslationLanguage } from "@/lib/storage";
import { SURAHS, type Surah, surahNameIn } from "@/lib/surahs";

interface Props {
  activeSurahNumber: number | null;
  isLoading: boolean;
  language: TranslationLanguage;
  favorites: ReadonlySet<number>;
  onToggleFavorite: (surahNumber: number) => void;
  onSelect: (surah: Surah) => void;
}

export function SurahList({
  activeSurahNumber,
  isLoading,
  language,
  favorites,
  onToggleFavorite,
  onSelect,
}: Props) {
  const isEnglish = language === "en";

  // One list, reordered — starred surahs are not a separate section, and they
  // keep their mushaf numbers rather than being renumbered 1, 2, 3.
  const ordered = useMemo(() => orderByFavorites(SURAHS, favorites), [favorites]);

  function toggleFavorite(surahNumber: number): void {
    onToggleFavorite(surahNumber);

    // Starring jumps a surah to the front, which would otherwise scroll it out
    // from under the reader. Follow it after the reorder has been painted.
    requestAnimationFrame(() => {
      document
        .getElementById(`surah${surahNumber}`)
        ?.scrollIntoView({ inline: "nearest", block: "nearest" });
    });
  }

  return (
    <div
      className="flex max-w-full overflow-x-auto whitespace-nowrap"
      role="toolbar"
      aria-orientation="horizontal"
      aria-label={t("surahListLabel")}
    >
      {ordered.map((surah) => {
        const isActive = surah.number === activeSurahNumber;
        const isLoadingThis = isActive && isLoading;
        const isFavorite = favorites.has(surah.number);
        const name = surahNameIn(surah, language);

        return (
          <div key={surah.number} className="relative ml-[3px] shrink-0">
            <button
              type="button"
              id={`surah${surah.number}`}
              aria-current={isActive ? "true" : undefined}
              aria-busy={isLoadingThis || undefined}
              onClick={() => onSelect(surah)}
              className={[
                "w-full cursor-pointer whitespace-nowrap rounded border py-1 pr-6 pl-2",
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
              {`${isEnglish ? surah.number : toBengaliDigits(surah.number)}. ${name}`}
            </button>

            <button
              type="button"
              id={`favorite${surah.number}`}
              aria-pressed={isFavorite}
              aria-label={t(isFavorite ? "removeFavorite" : "addFavorite", name)}
              title={t(isFavorite ? "removeFavorite" : "addFavorite", name)}
              onClick={() => toggleFavorite(surah.number)}
              className={[
                "absolute top-0 right-0 cursor-pointer rounded-full p-[1px] leading-none",
                "text-sm transition-transform hover:scale-110",
                "focus-visible:outline-2 focus-visible:outline-olive",
                isFavorite ? "text-olive" : "text-muted/70 hover:text-olive",
              ].join(" ")}
            >
              {isFavorite ? "★" : "☆"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
