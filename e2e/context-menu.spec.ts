import { expect, test } from "./fixtures";

/**
 * Native context menus cannot be opened from Playwright, but the items are real
 * browser objects: `contextMenus.update` resolves for an id that exists and
 * rejects for one that does not. That is enough to prove the menu was built.
 */
async function itemExists(
  worker: { evaluate: <T>(fn: (id: string) => T, arg: string) => Promise<T> },
  id: string,
): Promise<boolean> {
  return worker.evaluate(async (menuId: string) => {
    const api = (
      globalThis as unknown as {
        chrome: { contextMenus: { update(id: string, p: object): Promise<void> } };
      }
    ).chrome;
    try {
      await api.contextMenus.update(menuId, {});
      return true;
    } catch {
      return false;
    }
  }, id);
}

test.describe("page context menu", () => {
  test("registers the audio controls under one parent entry", async ({ context }) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent("serviceworker");

    // Menu creation happens on install, which may land just after startup.
    await expect
      .poll(async () => itemExists(worker, "dq-root"), { timeout: 15_000 })
      .toBe(true);

    for (const id of [
      "dq-play-pause",
      "dq-restart",
      "dq-next",
      "dq-previous",
      "dq-continuous",
    ]) {
      expect(await itemExists(worker, id), `${id} must exist`).toBe(true);
    }

    expect(await itemExists(worker, "dq-not-a-real-item")).toBe(false);
  });

  test("the extension declares the contextMenus permission", async ({ context }) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent("serviceworker");

    const permissions = await worker.evaluate(() => {
      const api = (
        globalThis as unknown as {
          chrome: { runtime: { getManifest(): { permissions?: string[] } } };
        }
      ).chrome;
      return api.runtime.getManifest().permissions ?? [];
    });
    expect(permissions).toContain("contextMenus");
  });
});
