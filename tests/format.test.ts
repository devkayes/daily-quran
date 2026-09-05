import { describe, expect, it } from "vitest";
import { formatDuration, formatSeconds, toBengaliDigits } from "@/lib/format";

describe("toBengaliDigits", () => {
  it("maps every Western digit to its Bengali numeral", () => {
    expect(toBengaliDigits("0123456789")).toBe("০১২৩৪৫৬৭৮৯");
  });

  it("accepts numbers as well as strings", () => {
    expect(toBengaliDigits(25)).toBe("২৫");
  });

  it("leaves non-digit characters untouched", () => {
    expect(toBengaliDigits("01:30")).toBe("০১:৩০");
  });

  it("returns an empty string unchanged", () => {
    expect(toBengaliDigits("")).toBe("");
  });
});

describe("formatSeconds", () => {
  it("pads minutes and seconds to two digits", () => {
    expect(formatSeconds(0)).toBe("00:00");
    expect(formatSeconds(5)).toBe("00:05");
    expect(formatSeconds(65)).toBe("01:05");
  });

  it("adds an hours field only once the duration passes an hour", () => {
    expect(formatSeconds(3599)).toBe("59:59");
    expect(formatSeconds(3600)).toBe("01:00:00");
    expect(formatSeconds(3661)).toBe("01:01:01");
  });

  it("truncates fractional seconds rather than rounding up", () => {
    expect(formatSeconds(59.9)).toBe("00:59");
  });

  // v1 rendered "NaN:NaN" whenever duration was read before metadata loaded.
  it("clamps NaN, Infinity and negatives to zero", () => {
    expect(formatSeconds(Number.NaN)).toBe("00:00");
    expect(formatSeconds(Number.POSITIVE_INFINITY)).toBe("00:00");
    expect(formatSeconds(-10)).toBe("00:00");
  });
});

describe("formatDuration", () => {
  it("formats and localises in one step", () => {
    expect(formatDuration(90)).toBe("০১:৩০");
  });
});
