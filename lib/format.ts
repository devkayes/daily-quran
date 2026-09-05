const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

/**
 * Renders Western digits in a string as Bengali numerals, leaving every other
 * character (separators, colons) untouched.
 */
export function toBengaliDigits(value: string | number): string {
  return String(value).replace(
    /[0-9]/g,
    (digit) => BENGALI_DIGITS[Number(digit)] ?? digit,
  );
}

/**
 * Seconds to `mm:ss`, or `hh:mm:ss` once the duration passes an hour.
 * Negative, NaN and infinite inputs clamp to zero rather than rendering "NaN".
 */
export function formatSeconds(totalSeconds: number): string {
  const safe =
    Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return hours > 0 ? `${String(hours).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Duration formatted for display, in Bengali numerals. */
export function formatDuration(totalSeconds: number): string {
  return toBengaliDigits(formatSeconds(totalSeconds));
}
