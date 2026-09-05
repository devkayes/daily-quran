import { env } from "@/lib/env";
import { t } from "@/lib/i18n";

const linkClass = "text-violet underline underline-offset-2";

/**
 * Attribution for the two things this extension does not own: the ayah text
 * with its Bengali translation, and the recitations.
 */
export function Credits() {
  return (
    <footer className="mt-2 flex flex-col items-center gap-0.5 text-center text-[11px] leading-relaxed text-muted">
      <p className="m-0">
        <span className="font-medium">{t("creditsAyah")}:</span>{" "}
        <a
          href={env.ayahSourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={linkClass}
        >
          {env.ayahSourceName}
        </a>
        {" · "}
        <span className="font-medium">{t("creditsAudio")}:</span> {env.audioReciterName}
        {" — "}
        <a
          href={env.audioSourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={linkClass}
        >
          {env.audioSourceName}
        </a>
      </p>
      <a
        href={env.aboutUrl}
        target="_blank"
        rel="noreferrer noopener"
        className={linkClass}
      >
        {t("footerLink")}
      </a>
    </footer>
  );
}
