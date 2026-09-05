import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
  createContextMenu,
  MENU_IDS,
  type MenuActions,
  registerMenuHandlers,
  syncContinuousChecked,
  syncPlayPauseLabel,
} from "@/lib/context-menu";
import { IDLE_PLAYBACK_STATE, type PlaybackState } from "@/lib/messaging";

const menus = fakeBrowser.contextMenus;

function stubActions(): MenuActions & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    togglePlayPause: async () => void calls.push("togglePlayPause"),
    restart: async () => void calls.push("restart"),
    step: async (delta) => void calls.push(`step:${delta}`),
    setContinuous: async (on) => void calls.push(`continuous:${on}`),
  };
}

interface CreatedItem {
  id?: string;
  parentId?: string;
  contexts?: string[];
  type?: string;
  checked?: boolean;
}

/** Menu items passed to contextMenus.create during the current test. */
function createdItems(): CreatedItem[] {
  return create.mock.calls.map((call: unknown[]) => call[0] as CreatedItem);
}

function state(overrides: Partial<PlaybackState>): PlaybackState {
  return { ...IDLE_PLAYBACK_STATE, ...overrides };
}

// fakeBrowser stubs these but throws "not implemented", so give them
// in-memory behaviour and assert against the spies.
type ClickInfo = { menuItemId: string; checked?: boolean };
let clickListener: ((info: ClickInfo) => void) | undefined;

/** Fires the handler the module registered, since fakeBrowser has no event bus. */
function click(info: ClickInfo): void {
  if (!clickListener) throw new Error("registerMenuHandlers was never called");
  clickListener(info);
}

let create: ReturnType<typeof vi.spyOn>;
let removeAll: ReturnType<typeof vi.spyOn>;
let update: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fakeBrowser.reset();
  create = vi.spyOn(menus, "create").mockImplementation(() => 0 as never);
  removeAll = vi.spyOn(menus, "removeAll").mockResolvedValue(undefined as never);
  update = vi.spyOn(menus, "update").mockResolvedValue(undefined as never);

  clickListener = undefined;
  vi.spyOn(menus.onClicked, "addListener").mockImplementation((cb) => {
    clickListener = cb as unknown as (info: ClickInfo) => void;
  });
});

describe("createContextMenu", () => {
  it("builds a submenu under one parent entry", async () => {
    await createContextMenu(false);

    const ids = createdItems().map((item) => item.id);
    expect(ids).toContain(MENU_IDS.root);
    expect(ids).toEqual(
      expect.arrayContaining([
        MENU_IDS.playPause,
        MENU_IDS.restart,
        MENU_IDS.previous,
        MENU_IDS.next,
        MENU_IDS.continuous,
      ]),
    );

    // Everything except the root hangs off it, so the page menu gains one item.
    for (const props of createdItems()) {
      if (props.id === MENU_IDS.root) continue;
      expect(props.parentId, `${String(props.id)} must be nested`).toBe(MENU_IDS.root);
    }
  });

  it("shows on the page, not just on links or selections", async () => {
    await createContextMenu(false);

    for (const props of createdItems()) {
      expect(props.contexts).toEqual(["all"]);
    }
  });

  it("renders continuous as a checkbox reflecting the stored setting", async () => {
    await createContextMenu(true);

    const item = createdItems().find((i) => i.id === MENU_IDS.continuous);
    expect(item).toMatchObject({ type: "checkbox", checked: true });
  });

  // Menu items live in the browser and outlive the service worker. Creating
  // without clearing first would throw on duplicate ids after a restart.
  it("clears existing items before rebuilding", async () => {
    await createContextMenu(false);
    expect(removeAll).toHaveBeenCalled();
  });
});

describe("registerMenuHandlers", () => {
  it.each([
    [MENU_IDS.playPause, "togglePlayPause"],
    [MENU_IDS.restart, "restart"],
    [MENU_IDS.next, "step:1"],
    [MENU_IDS.previous, "step:-1"],
  ])("%s runs %s", async (menuItemId, expected) => {
    const actions = stubActions();
    registerMenuHandlers(actions);

    click({ menuItemId });
    await vi.waitFor(() => expect(actions.calls).toEqual([expected]));
  });

  it("passes the checkbox's new state through", async () => {
    const actions = stubActions();
    registerMenuHandlers(actions);

    click({ menuItemId: MENU_IDS.continuous, checked: true });
    await vi.waitFor(() => expect(actions.calls).toEqual(["continuous:true"]));
  });

  it("ignores clicks on items belonging to other extensions", async () => {
    const actions = stubActions();
    registerMenuHandlers(actions);

    click({ menuItemId: "someone-elses-item" });
    await Promise.resolve();
    expect(actions.calls).toEqual([]);
  });
});

describe("syncPlayPauseLabel", () => {
  it("switches the label when playback starts and stops", async () => {
    await createContextMenu(false);

    syncPlayPauseLabel(state({ status: "playing" }));
    expect(update).toHaveBeenCalledWith(MENU_IDS.playPause, { title: "pause" });

    syncPlayPauseLabel(state({ status: "paused" }));
    expect(update).toHaveBeenCalledWith(MENU_IDS.playPause, { title: "play" });
  });

  // State arrives ~4x/second while playing; each update is an IPC round trip.
  it("does not rewrite an unchanged label", async () => {
    await createContextMenu(false);

    syncPlayPauseLabel(state({ status: "playing", position: 1 }));
    syncPlayPauseLabel(state({ status: "playing", position: 2 }));
    syncPlayPauseLabel(state({ status: "playing", position: 3 }));

    expect(update).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when a freshly built menu already reads 'play'", async () => {
    await createContextMenu(false);

    syncPlayPauseLabel(state({ status: "paused" }));

    expect(update).not.toHaveBeenCalled();
  });
});

describe("syncContinuousChecked", () => {
  it("ticks the checkbox", () => {
    syncContinuousChecked(true);
    expect(update).toHaveBeenCalledWith(MENU_IDS.continuous, { checked: true });
  });

  // Some browsers throw synchronously for a missing item instead of rejecting,
  // which a bare .catch() would not contain.
  it("survives the menu item not existing", () => {
    update.mockImplementation(() => {
      throw new Error("No item with id");
    });
    expect(() => syncContinuousChecked(true)).not.toThrow();
  });
});
