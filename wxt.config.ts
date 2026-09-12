import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

/**
 * Minimal .env reader. This file is evaluated before WXT wires up Vite's env
 * loading, so the manifest reads the files directly to build its CSP.
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

/** `https://host/some/path` -> `https://host`, the form CSP wants. */
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
  // WXT defaults Firefox to MV2. Firefox MV3 runs the background in an event page
  // that still has a DOM, which is what the in-page audio host needs.
  manifestVersion: 3,
  outDir: ".output",

  vite: ({ command }) => ({
    plugins: [tailwindcss()],
    build: {
      sourcemap: command === "serve" ? "inline" : false,
    },
  }),

  manifest: ({ browser, mode, command }) => {
    const env = loadEnv(mode ?? "production");
    const apiOrigin = originOf(env.WXT_API_BASE_URL, "https://pro.proggamoyquran.com");
    const audioOrigin = originOf(
      env.WXT_AUDIO_BASE_URL,
      "https://cdn.islamic.network/quran/audio-surah",
    );
    const englishOrigin = originOf(
      env.WXT_EN_API_BASE_URL,
      "https://api.alquran.cloud/v1",
    );

    const isFirefox = browser === "firefox";

    // This config sets an explicit connect-src, and WXT does not add the dev
    // server there — without these the HMR socket is blocked and hot reload
    // silently stops working. Dev also injects CSS from JS, hence 'unsafe-inline'.
    const isDev = command === "serve";
    const devConnectSrc = isDev ? " http://localhost:* ws://localhost:*" : "";
    const devStyleSrc = isDev ? " 'unsafe-inline' http://localhost:*" : "";
    const devFontSrc = isDev ? " http://localhost:*" : "";

    return {
      name: "__MSG_extName__",
      description: "__MSG_extDescription__",
      default_locale: "bn",
      author: "its-kayes",
      homepage_url: "https://www.kayes.dev/talks/daily-quran",

      // Firefox plays audio in its DOM-capable event page, so no offscreen.
      permissions: isFirefox
        ? ["storage", "contextMenus"]
        : ["storage", "offscreen", "contextMenus"],

      // No host_permissions on purpose: both APIs return an
      // `access-control-allow-origin` matching the caller, so plain CORS covers
      // the fetches. Adding one costs an install warning and an in-depth review.

      content_security_policy: {
        extension_pages: [
          "default-src 'self'",
          "script-src 'self'",
          "object-src 'self'",
          `style-src 'self'${devStyleSrc}`,
          "img-src 'self' data:",
          `font-src 'self'${devFontSrc}`,
          `media-src 'self' ${audioOrigin}`,
          `connect-src 'self' ${apiOrigin} ${englishOrigin} ${audioOrigin}${devConnectSrc}`,
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
    };
  },

  webExt: {
    startUrls: ["https://www.kayes.dev/talks/daily-quran"],
  },
});
