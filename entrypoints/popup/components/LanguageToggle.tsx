import { t } from "@/lib/i18n";
import type { TranslationLanguage } from "@/lib/storage";

interface Props {
  language: TranslationLanguage;
  onChange: (next: TranslationLanguage) => void;
}

const OPTIONS: readonly TranslationLanguage[] = ["bn", "en"];
const LABELS: Record<TranslationLanguage, string> = { bn: "BN", en: "EN" };

/**
 * Segmented BN/EN control built from real radio inputs, so arrow keys move
 * between the options and screen readers announce one choice of two. The inputs
 * are visually hidden and their labels carry the styling.
 */
export function LanguageToggle({ language, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label={t("translationLanguage")}
      className="inline-flex overflow-hidden rounded border border-neutral-400"
    >
      {OPTIONS.map((option) => {
        const selected = option === language;
        return (
          <label
            key={option}
            className={[
              "cursor-pointer select-none px-2 py-[1px] text-[11px] font-medium",
              "tracking-wide transition-colors",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-olive",
              "has-[:focus-visible]:-outline-offset-2",
              selected
                ? "bg-olive text-parchment"
                : "bg-transparent text-ink/60 hover:text-ink",
            ].join(" ")}
          >
            <input
              type="radio"
              name="translation-language"
              value={option}
              checked={selected}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {LABELS[option]}
          </label>
        );
      })}
    </div>
  );
}
