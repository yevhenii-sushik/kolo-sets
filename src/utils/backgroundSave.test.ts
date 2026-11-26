import { afterEach, describe, expect, it, vi } from "vitest";
import { onSaveEvent, saveInBackground, type SaveEvent } from "./backgroundSave";

describe("запись в фоне", () => {
  const events: SaveEvent[] = [];
  const off = onSaveEvent((e) => events.push(e));
  afterEach(() => {
    events.length = 0;
    vi.restoreAllMocks();
  });
  const quiet = () => vi.spyOn(console, "error").mockImplementation(() => {});

  it("удачная запись — true и событие «сохранено» с ключом", async () => {
    await expect(saveInBackground(() => Promise.resolve(), { key: "set:1" })).resolves.toBe(true);
    expect(events).toEqual([{ key: "set:1", failed: false }]);
  });

  it("отказ — false и событие с повтором; повтор вызывает запись заново", async () => {
    quiet();
    const write = vi.fn().mockRejectedValueOnce(new Error("permission-denied")).mockResolvedValueOnce(undefined);
    await expect(saveInBackground(write, { key: "folders" })).resolves.toBe(false);
    const failure = events[0];
    expect(failure).toMatchObject({ key: "folders", failed: true });
    if (!failure.failed || !failure.retry) throw new Error("нет повтора");
    failure.retry();
    await vi.waitFor(() => expect(events[events.length - 1]).toEqual({ key: "folders", failed: false }));
    expect(write).toHaveBeenCalledTimes(2);
  });

  it("с откатом — откат вызван, повтора нет", async () => {
    quiet();
    const onFail = vi.fn();
    await saveInBackground(() => Promise.reject(new Error("x")), { onFail });
    expect(onFail).toHaveBeenCalledOnce();
    expect(events[0]).toMatchObject({ failed: true, retry: undefined });
  });

  it("синхронное исключение — тоже отказ, а не падение экрана", async () => {
    quiet();
    const write = () => {
      throw new Error("sync");
    };
    await expect(saveInBackground(write)).resolves.toBe(false);
    expect(events[0]).toMatchObject({ failed: true });
  });

  it("запись начинается сразу, без ожидания", () => {
    const write = vi.fn(() => new Promise<void>(() => {})); // без сети промис Firestore висит
    void saveInBackground(write);
    expect(write).toHaveBeenCalledOnce();
  });

  it("отписка", () => {
    off();
    return saveInBackground(() => Promise.resolve()).then(() => expect(events).toEqual([]));
  });
});
