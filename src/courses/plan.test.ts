import { describe, expect, it } from "vitest";
import { planCourses } from "./plan";
import type { Collection } from "../types";

const now = new Date("2026-11-06T12:00:00Z");
const folder = (id: string): { id: string; courseId?: string } => ({ id });
const col = (id: string, language: string | undefined, extra: Partial<Collection> & { n?: number } = {}) =>
  ({ id, name: id, language, cards: Array(extra.n ?? 3).fill({}), createdAt: now, ...extra }) as unknown as Collection;

describe("миграция на курсы", () => {
  it("старый пользователь: всё норвежское, папка с наборами", () => {
    const p = planCourses({ folders: [folder("f1")] }, [col("a", "nb-NO", { folderId: "f1" }), col("b", "nb-NO"), col("c", undefined)], now);
    expect(p.courses).toEqual([{ id: "nb", voice: "nb-NO", addedAt: now }]);
    expect(p.activeCourseId).toBe("nb");
    expect(p.folders[0].courseId).toBe("nb");
    expect(p.collectionUpdates).toEqual([
      { id: "a", courseId: "nb", clearFolder: false },
      { id: "b", courseId: "nb", clearFolder: false },
      { id: "c", courseId: "nb", clearFolder: false },
    ]);
    expect(p.profileChanged).toBe(true);
  });

  it("повторный запуск на результате ничего не меняет", () => {
    const first = planCourses({ folders: [folder("f1")] }, [col("a", "nb-NO", { folderId: "f1" })], now);
    const again = planCourses(
      { courses: first.courses, activeCourseId: "nb", folders: first.folders, coursesVersion: 1 },
      [col("a", "nb-NO", { folderId: "f1", courseId: "nb" })],
      now,
    );
    expect(again.profileChanged).toBe(false);
    expect(again.collectionUpdates).toEqual([]);
  });

  it("смешанная папка уходит в курс большинства, чужой набор — в корень своего курса", () => {
    const p = planCourses(
      { folders: [folder("f1")] },
      [col("a", "nb-NO", { folderId: "f1" }), col("b", "nb-NO", { folderId: "f1" }), col("c", "en-US", { folderId: "f1" })],
      now,
    );
    expect(p.courses.map((c) => c.id).sort()).toEqual(["en", "nb"]);
    expect(p.courses.find((c) => c.id === "en")?.voice).toBe("en-US");
    expect(p.folders[0].courseId).toBe("nb");
    expect(p.collectionUpdates.find((u) => u.id === "c")?.clearFolder).toBe(true);
  });

  it("активный — курс последнего изученного набора", () => {
    const p = planCourses({}, [col("a", "nb-NO", { lastStudied: new Date("2026-10-01") }), col("b", "it-IT", { lastStudied: new Date("2026-11-01") })], now);
    expect(p.activeCourseId).toBe("it");
  });

  it("новый пользователь без наборов: курсов нет, писать нечего", () => {
    const p = planCourses({}, [], now);
    expect(p).toMatchObject({ courses: [], activeCourseId: null, profileChanged: false });
  });

  it("набор от старой версии приложения получает курс, профиль не трогается", () => {
    const base = { courses: [{ id: "nb", voice: "nb-NO", addedAt: now }], activeCourseId: "nb", folders: [], coursesVersion: 1 };
    const p = planCourses(base, [col("a", "nb-NO", { courseId: "nb" }), col("new", "nb-NO")], now);
    expect(p.collectionUpdates).toEqual([{ id: "new", courseId: "nb", clearFolder: false }]);
    expect(p.profileChanged).toBe(false);
  });

  it("ссылка на удалённую папку очищается, удалённый активный курс перевыбирается", () => {
    const base = { courses: [{ id: "it", voice: "it-IT", addedAt: now }], activeCourseId: "de", folders: [], coursesVersion: 1 };
    const p = planCourses(base, [col("x", "it-IT", { courseId: "it", folderId: "gone" })], now);
    expect(p.collectionUpdates[0].clearFolder).toBe(true);
    expect(p.activeCourseId).toBe("it");
    expect(p.profileChanged).toBe(true);
  });
});
