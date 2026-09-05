import { surahDetailsUrl } from "@/lib/api";
import { toBengaliDigits } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { CachedAyah } from "@/lib/storage";

interface Props {
  ayah: CachedAyah | undefined;
  isFetching: boolean;
  isError: boolean;
  onReload: () => void;
}

export function AyahCard({ ayah, isFetching, isError, onReload }: Props) {
  return (
    <section>
      <div className="flex items-baseline justify-between pt-[5px] font-light">
        <div>
          <span>{ayah?.surahName ?? " "}</span>
          {ayah ? (
            <>
              , <span>{`${t("ayatLabel")} ${toBengaliDigits(ayah.ayatNumber)}`}</span>
            </>
          ) : null}
        </div>

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

      {/*
        `textContent` semantics by construction: React escapes this, so ayah
        text from the API can never be interpreted as markup.
      */}
      <p dir="rtl" className="font-arabic my-4 text-[25px] text-olive">
        {ayah?.fullAyat ?? ""}
      </p>

      <p className="m-0">
        {ayah?.ayatMean ?? (isError ? t("ayahLoadError") : t("loadingAyah"))}
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
