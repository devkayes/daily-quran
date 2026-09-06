import type { EnglishAyah } from "@/lib/api";
import { surahDetailsUrl } from "@/lib/api";
import { toBengaliDigits } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { CachedAyah, TranslationLanguage } from "@/lib/storage";
import { LanguageToggle } from "./LanguageToggle";

interface Props {
  ayah: CachedAyah | undefined;
  isFetching: boolean;
  isError: boolean;
  onReload: () => void;
  language: TranslationLanguage;
  onLanguageChange: (next: TranslationLanguage) => void;
  english: EnglishAyah | undefined;
  englishLoading: boolean;
  englishError: boolean;
}

export function AyahCard({
  ayah,
  isFetching,
  isError,
  onReload,
  language,
  onLanguageChange,
  english,
  englishLoading,
  englishError,
}: Props) {
  const isEnglish = language === "en";

  // In English, fall back to the Bengali surah name until the lookup lands, so
  // the header never blanks out mid-switch.
  const surahName = isEnglish
    ? (english?.surahName ?? ayah?.surahName)
    : ayah?.surahName;

  const ayatNumber = ayah
    ? isEnglish
      ? String(ayah.ayatNumber)
      : toBengaliDigits(ayah.ayatNumber)
    : "";

  const translation = isEnglish ? english?.text : ayah?.ayatMean;

  function body() {
    if (translation) return translation;
    if (isEnglish && englishError) return t("translationUnavailable");
    if (isError && !ayah) return t("ayahLoadError");
    return t("loadingAyah");
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-2 pt-[5px] font-light">
        <div className="min-w-0 truncate">
          <span>{surahName ?? " "}</span>
          {ayah ? (
            <>
              , <span>{`${t("ayatLabel")} ${ayatNumber}`}</span>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle language={language} onChange={onLanguageChange} />
          <button
            type="button"
            onClick={onReload}
            disabled={isFetching}
            title={t("reloadAyah")}
            aria-label={t("reloadAyah")}
            className="cursor-pointer bg-transparent text-lg leading-none disabled:cursor-progress disabled:opacity-50"
          >
            ↻
          </button>
        </div>
      </div>

      {/*
        React escapes this, so ayah text from either API can never be
        interpreted as markup.
      */}
      <p dir="rtl" className="font-arabic my-4 text-[25px] text-olive">
        {ayah?.fullAyat ?? ""}
      </p>

      <p className="m-0" aria-busy={englishLoading || undefined}>
        {body()}
      </p>

      {isError && !ayah ? (
        <button
          type="button"
          onClick={onReload}
          className="mt-2 cursor-pointer text-sm text-violet underline"
        >
          {t("retry")}
        </button>
      ) : null}

      {ayah ? (
        <p className="m-0 text-end">
          <a
            href={surahDetailsUrl(ayah.surahNumber)}
            target="_blank"
            rel="noreferrer noopener"
            className="cursor-pointer text-sm text-violet underline"
          >
            {t("readMore")}
          </a>
        </p>
      ) : null}
    </section>
  );
}
