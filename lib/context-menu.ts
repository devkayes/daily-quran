import { browser } from "#imports";
import { t } from "@/lib/i18n";
import type { PlaybackState } from "@/lib/messaging";

/**
 * Audio controls in the page's right-click menu. Menu items live in the browser,
 * not this worker: they survive worker restarts and must not be created twice,
 * which is why setup clears before it builds.
 */

/**
 * Last play/pause label written. State arrives several times a second and each
 * `update` is an IPC round trip, so only a genuine change is written.
 */
let lastLabel: string | null = null;

export const MENU_IDS = {
  root: "dq-root",
  playPause: "dq-play-pause",
  restart: "dq-restart",
  next: "dq-next",
  previous: "dq-previous",
  continuous: "dq-continuous",
} as const;

export interface MenuActions {
  togglePlayPause(): Promise<void>;
  restart(): Promise<void>;
  /** +1 for the next surah, -1 for the previous one. */
  step(delta: number): Promise<void>;
  setContinuous(enabled: boolean): Promise<void>;
}

export async function createContextMenu(continuous: boolean): Promise<void> {
  await browser.contextMenus.removeAll();
  // Must match the label built below, or the first state change looks like a no-op.
  lastLabel = t("play");

  browser.contextMenus.create({
    id: MENU_IDS.root,
    title: t("extName"),
    contexts: ["all"],
  });

  const child = (id: string, title: string) =>
    browser.contextMenus.create({
      id,
      parentId: MENU_IDS.root,
      title,
      contexts: ["all"],
    });

  child(MENU_IDS.playPause, t("play"));
  child(MENU_IDS.restart, t("restart"));

  browser.contextMenus.create({
    id: "dq-sep",
    parentId: MENU_IDS.root,
    type: "separator",
    contexts: ["all"],
  });

  child(MENU_IDS.previous, t("previousSurah"));
  child(MENU_IDS.next, t("nextSurah"));

  browser.contextMenus.create({
    id: MENU_IDS.continuous,
    parentId: MENU_IDS.root,
    type: "checkbox",
    checked: continuous,
    title: t("continuous"),
    contexts: ["all"],
  });
}

export function syncPlayPauseLabel(state: PlaybackState): void {
  const label = state.status === "playing" ? t("pause") : t("play");
  if (label === lastLabel) return;
  lastLabel = label;

  // The menu may not exist on a cold start, and some browsers throw rather than
  // reject, so both paths are swallowed.
  updateQuietly(MENU_IDS.playPause, { title: label });
}

export function syncContinuousChecked(checked: boolean): void {
  updateQuietly(MENU_IDS.continuous, { checked });
}

function updateQuietly(id: string, props: { title?: string; checked?: boolean }): void {
  try {
    void browser.contextMenus.update(id, props).catch(() => {});
  } catch {
    // Menu item is gone; there is nothing left to keep in sync.
  }
}

export function registerMenuHandlers(actions: MenuActions): void {
  browser.contextMenus.onClicked.addListener((info) => {
    switch (info.menuItemId) {
      case MENU_IDS.playPause:
        void actions.togglePlayPause();
        break;
      case MENU_IDS.restart:
        void actions.restart();
        break;
      case MENU_IDS.next:
        void actions.step(1);
        break;
      case MENU_IDS.previous:
        void actions.step(-1);
        break;
      case MENU_IDS.continuous:
        void actions.setContinuous(info.checked ?? false);
        break;
      default:
        break;
    }
  });
}
