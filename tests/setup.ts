import { beforeEach, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

/**
 * fakeBrowser ships no i18n implementation and throws if it is called. Echoing
 * the key back mirrors what `t()` itself falls back to, and keeps assertions
 * readable without pulling the real locale files into unit tests.
 */
beforeEach(() => {
  vi.spyOn(fakeBrowser.i18n, "getMessage").mockImplementation((key) => String(key));
});
