import type { Page } from "@playwright/test";
import { expect, label, test } from "./fixtures";

const AYAH_FIXTURE = {
  success: true,
  statusCode: 200,
  message: "Get Daily Ayats",
  data: {
    indexAyat: 518,
    surahNumber: 4,
    surahName: "সূরা আন নিসা",
    ayatNumber: 25,
    fullAyat: "وَمَنۡ لَّمۡ یَسۡتَطِعۡ مِنۡکُمۡ طَوۡلًا",
    ayatMean: "আর যে তোমাদের মধ্য থেকে স্বাধীন মুমিন নারীকে বিয়ে করতে",
  },
};

const AYAH_ROUTE = "**/api/v1/filter/daily-ayat*";
const EN_ROUTE = "**/api.alquran.cloud/v1/ayah/**";

/** Recitations come over a CDN whose throughput varies; budget generously. */
const AUDIO_TIMEOUT = 90_000;
const AUDIO_TEST_TIMEOUT = 240_000;

const EN_FIXTURE = {
  code: 200,
  status: "OK",
  data: {
    number: 493,
    text: "And whoever among you cannot afford to marry free, believing women...",
    numberInSurah: 25,
    surah: { number: 4, englishName: "An-Nisaa", name: "سُورَةُ النِّسَاءِ" },
  },
};

/**
 * Reads one key from the extension's storage from inside the page. `chrome` is
 * not declared in the Node-side test types, so the probe is typed at the point
 * of use rather than with a global declaration.
 */
async function readStorage(page: Page, key: string): Promise<unknown> {
  return page.evaluate(async (k) => {
    const api = (
      globalThis as unknown as {
        chrome: {
          storage: {
            local: { get(keys: string): Promise<Record<string, unknown>> };
          };
        };
      }
    ).chrome;
    return (await api.storage.local.get(k))[k];
  }, key);
}

test.describe("popup", () => {
  test("renders the ayah, the controls and all 114 surahs", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await expect(
      page.getByText(AYAH_FIXTURE.data.surahName, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(AYAH_FIXTURE.data.ayatMean)).toBeVisible();
    await expect(page.getByText(AYAH_FIXTURE.data.fullAyat)).toBeVisible();

    // Ayah number is localised to Bengali numerals regardless of UI language.
    await expect(page.getByText(`${label("ayatLabel")} ২৫`)).toBeVisible();

    await expect(page.getByRole("button", { name: label("play") })).toBeVisible();
    await expect(page.getByRole("button", { name: label("restart") })).toBeVisible();
    await expect(page.getByRole("slider", { name: label("progress") })).toBeVisible();
    await expect(page.getByRole("slider", { name: label("volume") })).toBeVisible();

    const surahList = page.getByRole("toolbar", { name: label("surahListLabel") });
    await expect(surahList.getByRole("button")).toHaveCount(114);
  });

  test("read-more links to the ayah's surah, not its ayah number", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // surahNumber is 4, ayatNumber is 25. v1 linked to /25.
    await expect(page.getByRole("link", { name: label("readMore") })).toHaveAttribute(
      "href",
      /\/surahDetails\/4$/,
    );
  });

  // Audio moved to the Islamic Network CDN, which carries all 114 surahs, so
  // the "coming soon" disabled state is gone entirely.
  test("every surah is selectable", async ({ context, extensionId }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const surahList = page.getByRole("toolbar", { name: label("surahListLabel") });
    await expect(surahList.getByRole("button")).toHaveCount(114);
    await expect(surahList.getByRole("button", { disabled: true })).toHaveCount(0);
  });

  test("shows an error state and recovers on retry", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();

    let failing = true;
    await context.route(AYAH_ROUTE, (route) =>
      failing
        ? route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
        : route.fulfill({ json: AYAH_FIXTURE }),
    );

    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const retry = page.getByRole("button", { name: label("retry") });
    await expect(retry).toBeVisible();
    await expect(page.getByText(label("ayahLoadError"))).toBeVisible();

    failing = false;
    await retry.click();

    await expect(
      page.getByText(AYAH_FIXTURE.data.surahName, { exact: true }),
    ).toBeVisible();
  });

  test("selecting a surah marks it active and the choice survives a reopen", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const alFatiha = page.getByRole("button", { name: /সূরা আল ফাতিহা/ }).first();
    await alFatiha.click();

    // Proves the popup -> background -> offscreen round trip completed and the
    // audio host reported its state back.
    await expect(alFatiha).toHaveAttribute("aria-current", "true");

    // Reopening shows the same surah active. This only works because playback
    // state lives in chrome.storage and the offscreen host, not in the popup's
    // own localStorage the way v1 kept it.
    await page.reload();
    await expect(
      page.getByRole("button", { name: /সূরা আল ফাতিহা/ }).first(),
    ).toHaveAttribute("aria-current", "true");
  });

  test("the popup serves cached content when the API is unreachable", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();

    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(
      page.getByText(AYAH_FIXTURE.data.surahName, { exact: true }),
    ).toBeVisible();

    // Now the network is gone. The cached ayah must still paint.
    await context.unroute(AYAH_ROUTE);
    await context.route(AYAH_ROUTE, (route) => route.abort("failed"));

    await page.reload();
    await expect(
      page.getByText(AYAH_FIXTURE.data.surahName, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(AYAH_FIXTURE.data.ayatMean)).toBeVisible();
  });
  // The popup once rendered completely unstyled because the CSP blocked the
  // stylesheet: every icon filled the popup width. Assert the stylesheet is
  // actually in force, not merely that elements exist.
  test("the stylesheet loads and applies", async ({ context, extensionId }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const icon = page.locator("img").first();
    await expect(icon).toBeVisible();

    const iconBox = await icon.boundingBox();
    expect(iconBox?.width).toBeLessThan(30);
    expect(iconBox?.height).toBeLessThan(30);

    // body max-width from the stylesheet; unstyled it would grow past this.
    expect(await page.evaluate(() => document.body.clientWidth)).toBeLessThanOrEqual(
      500,
    );
  });

  /**
   * The transport icons once rendered as empty circles: they were 15x15 with
   * 6px padding, which under Tailwind's `border-box` preflight left a 13x3
   * content area. The bounding box was still 15x15, so measuring that alone
   * missed it -- this measures the area the glyph is actually painted into.
   */
  test("control icons are drawn at a visible size", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const contentBoxes = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLImageElement>('img[src^="/icon/"]')].map(
        (img) => {
          const cs = getComputedStyle(img);
          const pad = (v: string) => Number.parseFloat(v) || 0;
          return {
            src: img.getAttribute("src") ?? "",
            loaded: img.complete && img.naturalWidth > 0,
            width: img.clientWidth - pad(cs.paddingLeft) - pad(cs.paddingRight),
            height: img.clientHeight - pad(cs.paddingTop) - pad(cs.paddingBottom),
          };
        },
      ),
    );

    expect(contentBoxes.length).toBeGreaterThanOrEqual(3);
    for (const box of contentBoxes) {
      expect(box, `${box.src} must be loaded`).toMatchObject({ loaded: true });
      expect(box.width, `${box.src} width`).toBeGreaterThanOrEqual(12);
      expect(box.height, `${box.src} height`).toBeGreaterThanOrEqual(12);
    }
  });

  /**
   * The audio tests below stream real recitations, so their budgets are sized
   * for a slow CDN rather than a fast one: an under-budgeted wait here fails
   * as "playback never started", which reads exactly like a real bug.
   */
  /**
   * The regression that mattered most: selecting a surah highlighted the button
   * but never produced sound, because the audio host tried to write to
   * chrome.storage -- unavailable in a Chrome offscreen document -- and threw
   * before `audio.play()` was reached. Asserting the highlight was not enough;
   * this asserts playback actually runs.
   *
   * Hits the real recitation bucket, so it also catches the audio host URL
   * breaking.
   */
  test("playing a surah actually starts audio and advances", async ({
    context,
    extensionId,
  }) => {
    test.setTimeout(AUDIO_TEST_TIMEOUT);
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await page
      .getByRole("button", { name: /সূরা আল ফাতিহা/ })
      .first()
      .click();

    // Play swapping to Pause is the popup's proof the host reached "playing".
    await expect(page.getByRole("button", { name: label("pause") })).toBeVisible({
      timeout: AUDIO_TIMEOUT,
    });

    // The background must have persisted what is playing -- the write the
    // offscreen document could not do itself.
    await expect
      .poll(
        async () =>
          (await readStorage(page, "nowPlaying")) as { surahNumber?: number } | null,
        { timeout: AUDIO_TIMEOUT },
      )
      .toMatchObject({ surahNumber: 1 });

    // And the position must actually move.
    await expect
      .poll(async () => Number(await readStorage(page, "playbackPosition")) || 0, {
        timeout: AUDIO_TIMEOUT,
      })
      .toBeGreaterThan(0);
  });

  test("the play button falls back to the first surah with a recitation", async ({
    context,
    extensionId,
  }) => {
    test.setTimeout(AUDIO_TEST_TIMEOUT);
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Nothing selected yet: pressing play used to do nothing at all.
    await page.getByRole("button", { name: label("play") }).click();

    await expect(page.getByRole("button", { name: label("pause") })).toBeVisible({
      timeout: AUDIO_TIMEOUT,
    });
  });
  test("shows a loading indicator while a recitation is fetched", async ({
    context,
    extensionId,
  }) => {
    test.setTimeout(AUDIO_TEST_TIMEOUT);
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await page
      .getByRole("button", { name: /সূরা আল ফাতিহা/ })
      .first()
      .click();

    // The spinner is announced to assistive tech, so find it by its role.
    const spinner = page.getByRole("status", { name: label("loadingAudio") });
    await expect(spinner.first()).toBeVisible({ timeout: AUDIO_TIMEOUT });

    // ...and it must go away once playback actually starts.
    await expect(page.getByRole("button", { name: label("pause") })).toBeVisible({
      timeout: AUDIO_TIMEOUT,
    });
    await expect(spinner).toHaveCount(0);
  });
  const continuousButton = (page: Page) =>
    page.getByRole("button", { name: label("continuous") });

  test("the continuous setting persists across popup reopens", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await expect(continuousButton(page)).toHaveAttribute("aria-pressed", "false");

    await continuousButton(page).click();
    await expect(continuousButton(page)).toHaveAttribute("aria-pressed", "true");

    await expect.poll(async () => readStorage(page, "continuousPlayback")).toBe(true);

    await page.reload();
    await expect(continuousButton(page)).toHaveAttribute("aria-pressed", "true");
  });

  /**
   * Plays to a genuine `ended` event rather than seeking exactly to the
   * duration: those are different code paths, and only this one matches what a
   * listener actually experiences.
   */
  test("with continuous on, finishing a surah starts the next one", async ({
    context,
    extensionId,
  }) => {
    test.setTimeout(AUDIO_TEST_TIMEOUT);
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await continuousButton(page).click();
    await expect(continuousButton(page)).toHaveAttribute("aria-pressed", "true");

    // Al-Falaq (113); its successor An-Nas (114) is unambiguous.
    await page.getByRole("button", { name: /১১৩\. সূরা আল ফালাক/ }).click();

    const nowPlayingNumber = async () =>
      ((await readStorage(page, "nowPlaying")) as { surahNumber?: number } | null)
        ?.surahNumber;
    const duration = async () => Number(await readStorage(page, "audioDuration")) || 0;

    await expect.poll(nowPlayingNumber, { timeout: AUDIO_TIMEOUT }).toBe(113);
    await expect.poll(duration, { timeout: AUDIO_TIMEOUT }).toBeGreaterThan(0);

    // Skip to just before the end and let playback finish on its own.
    await page.evaluate(
      (target) => {
        const slider = document.querySelector<HTMLInputElement>('input[type="range"]');
        if (!slider) return;
        slider.value = String(target);
        slider.dispatchEvent(new Event("input", { bubbles: true }));
      },
      Math.max(0, (await duration()) - 2),
    );

    // The background must queue An-Nas on its own...
    await expect.poll(nowPlayingNumber, { timeout: AUDIO_TIMEOUT }).toBe(114);

    // ...and actually play it. Asserting only that `nowPlaying` moved would
    // pass even if the next surah were queued but silent.
    await expect(page.getByRole("button", { name: label("pause") })).toBeVisible({
      timeout: AUDIO_TIMEOUT,
    });
    await expect
      .poll(async () => Number(await readStorage(page, "playbackPosition")) || 0, {
        timeout: AUDIO_TIMEOUT,
      })
      .toBeGreaterThan(0.5);
  });

  test("with continuous off, playback stops at the end", async ({
    context,
    extensionId,
  }) => {
    test.setTimeout(AUDIO_TEST_TIMEOUT);
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await expect(continuousButton(page)).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: /১১৩\. সূরা আল ফালাক/ }).click();

    const nowPlayingNumber = async () =>
      ((await readStorage(page, "nowPlaying")) as { surahNumber?: number } | null)
        ?.surahNumber;
    const duration = async () => Number(await readStorage(page, "audioDuration")) || 0;

    await expect.poll(nowPlayingNumber, { timeout: AUDIO_TIMEOUT }).toBe(113);
    await expect.poll(duration, { timeout: AUDIO_TIMEOUT }).toBeGreaterThan(0);

    await page.evaluate(
      (target) => {
        const slider = document.querySelector<HTMLInputElement>('input[type="range"]');
        if (!slider) return;
        slider.value = String(target);
        slider.dispatchEvent(new Event("input", { bubbles: true }));
      },
      Math.max(0, (await duration()) - 2),
    );

    // It must reach the end and stay put.
    await expect(page.getByRole("button", { name: label("play") })).toBeVisible({
      timeout: AUDIO_TIMEOUT,
    });
    expect(await nowPlayingNumber()).toBe(113);
  });

  test("credits name both the ayah and recitation sources", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const footer = page.locator("footer");
    await expect(footer).toContainText(label("creditsAyah"));
    await expect(footer).toContainText(label("creditsAudio"));
    await expect(footer).toContainText("Mishary Rashid Alafasy");

    await expect(footer.getByRole("link", { name: "Proggamoy Quran" })).toHaveAttribute(
      "href",
      /proggamoyquran\.com/,
    );
    await expect(footer.getByRole("link", { name: "Islamic Network" })).toHaveAttribute(
      "href",
      /islamic\.network/,
    );
  });

  test("defaults to Bengali and switches to English on demand", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await context.route(EN_ROUTE, (route) => route.fulfill({ json: EN_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const bn = page.getByRole("radio", { name: "BN" });
    const en = page.getByRole("radio", { name: "EN" });
    const enLabel = page.locator("label").filter({ hasText: /^EN$/ });
    const bnLabel = page.locator("label").filter({ hasText: /^BN$/ });

    // Bengali by default, showing the original source's translation.
    await expect(bn).toBeChecked();
    await expect(page.getByText(AYAH_FIXTURE.data.ayatMean)).toBeVisible();

    await enLabel.click();

    await expect(en).toBeChecked();
    await expect(page.getByText(EN_FIXTURE.data.text)).toBeVisible();
    // The English surah name and Western digits replace the Bengali ones.
    await expect(page.getByText("An-Nisaa", { exact: true })).toBeVisible();
    await expect(page.getByText("Ayah 25")).toBeVisible();

    // The verse itself must not change -- only the translation.
    await expect(page.getByText(AYAH_FIXTURE.data.fullAyat)).toBeVisible();

    await bnLabel.click();
    await expect(page.getByText(AYAH_FIXTURE.data.ayatMean)).toBeVisible();
  });

  test("the chosen language survives a popup reopen", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await context.route(EN_ROUTE, (route) => route.fulfill({ json: EN_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await page.locator("label").filter({ hasText: /^EN$/ }).click();
    await expect.poll(async () => readStorage(page, "translationLanguage")).toBe("en");

    await page.reload();
    await expect(page.getByRole("radio", { name: "EN" })).toBeChecked();
    await expect(page.getByText(EN_FIXTURE.data.text)).toBeVisible();
  });

  test("English falls back to a message when the translation service fails", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await context.route(EN_ROUTE, (route) => route.abort("failed"));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await page.locator("label").filter({ hasText: /^EN$/ }).click();

    await expect(page.getByText(label("translationUnavailable"))).toBeVisible({
      timeout: 15_000,
    });
    // The Arabic and the reload control stay usable.
    await expect(page.getByText(AYAH_FIXTURE.data.fullAyat)).toBeVisible();
  });

  test("English is cached, so a reopen renders it without refetching", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));

    let enRequests = 0;
    await context.route(EN_ROUTE, (route) => {
      enRequests += 1;
      return route.fulfill({ json: EN_FIXTURE });
    });
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await page.locator("label").filter({ hasText: /^EN$/ }).click();
    await expect(page.getByText(EN_FIXTURE.data.text)).toBeVisible();
    expect(enRequests).toBe(1);

    // Now the service is gone; the cached translation must still render.
    await context.unroute(EN_ROUTE);
    await context.route(EN_ROUTE, (route) => route.abort("failed"));

    await page.reload();
    await expect(page.getByText(EN_FIXTURE.data.text)).toBeVisible();
  });
});
