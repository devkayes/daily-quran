import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type BrowserContext, test as base, chromium, expect } from "@playwright/test";

const EXTENSION_PATH = join(process.cwd(), ".output", "chrome-mv3");

/**
 * The browser UI language decides which `_locales` bundle the extension serves.
 * Pinning it keeps assertions stable wherever the suite runs, and reading the
 * expected strings from the same messages.json the extension ships means a
 * renamed label fails in one place rather than two.
 */
const TEST_LOCALE = "en";

type Messages = Record<string, { message: string }>;

const messages: Messages = JSON.parse(
  readFileSync(
    join(process.cwd(), "public", "_locales", TEST_LOCALE, "messages.json"),
    "utf8",
  ),
);

export function label(key: keyof Messages & string): string {
  const message = messages[key]?.message;
  if (!message) throw new Error(`No "${key}" in ${TEST_LOCALE} messages.json`);
  return message;
}

/**
 * Loads the real built extension into a persistent Chromium profile — the only
 * way to exercise the manifest, the service worker, the offscreen document and
 * the popup together.
 */
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture signature.
  context: async ({}, use) => {
    const userDataDir = mkdtempSync(join(tmpdir(), "daily-quran-e2e-"));
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: "chromium",
      locale: `${TEST_LOCALE}-US`,
      args: [
        `--lang=${TEST_LOCALE}-US`,
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });

    await use(context);

    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  },

  extensionId: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent("serviceworker");

    await use(new URL(worker.url()).host);
  },
});

export { expect };
