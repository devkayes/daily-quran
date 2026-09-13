import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MESSAGE_KEYS } from "@/lib/i18n";

const LOCALES_DIR = join(process.cwd(), "public", "_locales");
const locales = readdirSync(LOCALES_DIR);

function messagesFor(locale: string): Record<string, { message: string }> {
  return JSON.parse(readFileSync(join(LOCALES_DIR, locale, "messages.json"), "utf8"));
}

describe("_locales", () => {
  it("ships at least the Bengali default and English", () => {
    expect(locales).toEqual(expect.arrayContaining(["bn", "en"]));
  });

  it.each(locales)("%s defines every key the code asks for", (locale) => {
    const messages = messagesFor(locale);
    const missing = MESSAGE_KEYS.filter((key) => !messages[key]?.message?.trim());
    expect(missing).toEqual([]);
  });

  it.each(locales)("%s has no keys the code never uses", (locale) => {
    const keys = Object.keys(messagesFor(locale));
    const unused = keys.filter(
      (key) => !(MESSAGE_KEYS as readonly string[]).includes(key),
    );
    expect(unused).toEqual([]);
  });
});
