import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

/**
 * Minimal .env reader. wxt.config.ts is evaluated before WXT wires up Vite's
 * env loading, so the manifest (which needs the API origins to build its CSP
 * and host_permissions) reads the files directly.
 */
function loadEnv(mode: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const file of [".env", `.env.${mode}`, ".env.local", `.env.${mode}.local`]) {
    let raw: string;
    try {
      raw = readFileSync(resolve(__dirname, file), "utf8");
    } catch {
      continue;
    }
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match?.[1] && match[2] !== undefined) {
        out[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  }
  return { ...out, ...process.env } as Record<string, string>;
}

/** `https://host/some/path` -> `https://host/*`, the form CSP and permissions want. */
function originOf(url: string | undefined, fallback: string): string {
  try {
    return new URL(url ?? fallback).origin;
  } catch {
    return new URL(fallback).origin;
  }
}

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: ".",
  // Firefox defaults to MV2 in WXT. Mozilla is retiring MV2, and Firefox MV3
  // background scripts run in an event page that still has a DOM, which is
  // exactly what the in-page audio host needs.
  manifestVersion: 3,
  outDir: ".output",

  vite: () => ({
    plugins: [tailwindcss()],
  }),

  manifest: ({ browser, mode }) => {
    const env = loadEnv(mode ?? "production");
    const apiOrigin = originOf(env.WXT_API_BASE_URL, "https://pro.proggamoyquran.com");
    const audioOrigin = originOf(
      env.WXT_AUDIO_BASE_URL,
      "https://daily-quran-dev.s3.ap-south-1.amazonaws.com",
    );
    const isFirefox = browser === "firefox";

    return {
      name: "__MSG_extName__",
      description: "__MSG_extDescription__",
      default_locale: "bn",
      author: "its-kayes",
      homepage_url: "https://www.kayes.dev/talks/daily-quran",

      // Firefox MV3 uses an event page with DOM access, so it plays audio in
      // the background directly and never needs the offscreen permission.
      permissions: isFirefox ? ["storage"] : ["storage", "offscreen"],

      host_permissions: [`${apiOrigin}/*`, `${audioOrigin}/*`],

      content_security_policy: {
        extension_pages: [
          "default-src 'self'",
          "script-src 'self'",
          "object-src 'self'",
          "style-src 'self'",
          "img-src 'self' data:",
          "font-src 'self'",
          `media-src 'self' ${audioOrigin}`,
          `connect-src 'self' ${apiOrigin} ${audioOrigin}`,
          `form-action 'none'`,
          `frame-ancestors 'none'`,
        ].join("; "),
      },

      commands: {
        _execute_action: {},
      },

      ...(isFirefox
        ? {
            browser_specific_settings: {
              gecko: {
                id: "daily-quran@kayes.dev",
                strict_min_version: "128.0",
              },
            },
          }
        : {}),

      // Not claimed any more: every ayah and every recitation is fetched over
      // the network. The popup caches the last ayah, but audio needs a
      // connection, so `offline_enabled` would be a false promise.
    };
  },

  webExt: {
    startUrls: ["https://www.kayes.dev/talks/daily-quran"],
  },
});
