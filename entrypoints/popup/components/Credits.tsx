import { env } from "@/lib/env";
import { t } from "@/lib/i18n";
import type { TranslationLanguage } from "@/lib/storage";

const linkClass = "text-violet underline underline-offset-2";

interface Props {
  language: TranslationLanguage;
}

function SourceLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={linkClass}>
      {children}
    </a>
  );
}

/**
 * Attribution for the things this extension does not own, naming whichever
 * translation is actually on screen alongside the recitation.
 */
export function Credits({ language }: Props) {
  const isEnglish = language === "en";

  return (
    <footer className="mt-2 flex flex-col items-center gap-0.5 text-center text-[11px] leading-relaxed text-muted">
      <p className="m-0">
        {isEnglish ? (
          <>
            <span className="font-medium">{t("creditsTranslation")}:</span>{" "}
            {env.englishEditionName}
            {" — "}
            <SourceLink href={env.englishSourceUrl}>{env.englishSourceName}</SourceLink>
          </>
        ) : (
          <>
            <span className="font-medium">{t("creditsAyah")}:</span>{" "}
            <SourceLink href={env.ayahSourceUrl}>{env.ayahSourceName}</SourceLink>
          </>
        )}
        {" · "}
        <span className="font-medium">{t("creditsAudio")}:</span> {env.audioReciterName}
        {" — "}
        <SourceLink href={env.audioSourceUrl}>{env.audioSourceName}</SourceLink>
      </p>

      <SourceLink href={env.aboutUrl}>{t("footerLink")}</SourceLink>
    </footer>
  );
}
