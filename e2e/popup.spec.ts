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

  test("surahs without a recitation are disabled", async ({ context, extensionId }) => {
    const page = await context.newPage();
    await context.route(AYAH_ROUTE, (route) => route.fulfill({ json: AYAH_FIXTURE }));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const surahList = page.getByRole("toolbar", { name: label("surahListLabel") });
    const disabled = surahList.getByRole("button", { disabled: true });

    await expect(disabled.first()).toHaveAttribute("title", label("comingSoon"));
    // 114 surahs, 33 with audio.
    await expect(disabled).toHaveCount(81);
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
});
