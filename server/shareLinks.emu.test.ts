// Набор по ссылке на эмуляторах Firebase (docs/specs/07-shared-sets.md). Запуск: npm run test:emu
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import shareLinkFn from "../netlify/functions/share-link";
import sharedSetFn from "../netlify/functions/shared-set";
import cleanupFn from "../netlify/functions/account-cleanup";
import { adminAuth, db } from "./admin";

const OWNER = "share-owner";
const FRIEND = "share-friend";
const tokens: Record<string, string> = {};

async function idToken(uid: string): Promise<string> {
  const custom = await adminAuth().createCustomToken(uid);
  const res = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: custom, returnSecureToken: true }) },
  );
  return (await res.json()).idToken;
}

const call = async (fn: (r: Request) => Promise<Response>, body: unknown, auth = "") => {
  const res = await fn(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, body: await res.json() };
};

const link = (action: string, collectionId: string, uid = OWNER) => call(shareLinkFn, { action, collectionId }, tokens[uid]);
const open = (id: string, uid?: string) => call(sharedSetFn, { id }, uid ? tokens[uid] : "");

const SET = {
  name: "Kjøkken",
  language: "nb-NO",
  courseId: "nb",
  folderId: "f1",
  cards: [
    { id: "c1", word: "kniv", translation: "нож", explanation: "", example: "Kniven er skarp.", partOfSpeech: "noun", srsData: { interval: 9 } },
  ],
};

beforeAll(async () => {
  for (const uid of [OWNER, FRIEND]) {
    await adminAuth().createUser({ uid }).catch(() => {});
    tokens[uid] = await idToken(uid);
  }
});

beforeEach(async () => {
  const links = await db().collection("sharedSets").get();
  await Promise.all(links.docs.map((d) => d.ref.delete()));
  for (const uid of [OWNER, FRIEND]) {
    const sets = await db().collection(`users/${uid}/collections`).get();
    await Promise.all(sets.docs.map((d) => d.ref.delete()));
  }
  await db().doc(`users/${OWNER}/collections/set-a`).set(SET);
  await db().doc(`users/${FRIEND}/collections/set-f`).set({ ...SET, name: "Friend's" });
});

describe("POST /api/share-link", () => {
  it("без входа — 401, с мусором — 400", async () => {
    expect((await call(shareLinkFn, { action: "create", collectionId: "set-a" })).status).toBe(401);
    expect((await link("delete", "set-a")).status).toBe(400);
    expect((await link("create", "users/x")).status).toBe(400);
  });

  it("создаёт одну ссылку на набор: повторное «Создать» отдаёт ту же", async () => {
    expect(await link("status", "set-a")).toEqual({ status: 200, body: { id: null } });
    const first = await link("create", "set-a");
    expect(first.status).toBe(200);
    expect(first.body.id).toMatch(/^[A-Za-z0-9]{12}$/);
    expect((await link("create", "set-a")).body.id).toBe(first.body.id);
    expect((await link("status", "set-a")).body.id).toBe(first.body.id);
    const reg = (await db().doc(`sharedSets/${first.body.id}`).get()).data()!;
    expect(reg).toMatchObject({ ownerUid: OWNER, collectionId: "set-a" });
  });

  it("на чужой или несуществующий набор ссылку не создать", async () => {
    expect((await link("create", "set-f")).status).toBe(404);
    expect((await link("create", "nope")).status).toBe(404);
    expect((await db().collection("sharedSets").get()).size).toBe(0);
  });

  it("выключенная ссылка не открывается, новая — с другим адресом", async () => {
    const { id } = (await link("create", "set-a")).body;
    expect(await link("revoke", "set-a")).toEqual({ status: 200, body: { id: null } });
    expect((await open(id)).status).toBe(404);
    const again = (await link("create", "set-a")).body.id;
    expect(again).not.toBe(id);
  });

  it("чужую ссылку не выключить", async () => {
    const { id } = (await link("create", "set-a")).body;
    await link("revoke", "set-a", FRIEND);
    expect((await open(id)).status).toBe(200);
  });
});

describe("POST /api/shared-set", () => {
  it("гость видит слова без расписания и без данных владельца", async () => {
    const { id } = (await link("create", "set-a")).body;
    const res = await open(id);
    expect(res).toEqual({
      status: 200,
      body: {
        set: {
          name: "Kjøkken",
          course: "nb",
          voice: "nb-NO",
          cards: [{ word: "kniv", translation: "нож", explanation: "", example: "Kniven er skarp.", partOfSpeech: "noun" }],
        },
      },
    });
  });

  it("ссылка живая: новые слова видны сразу", async () => {
    const { id } = (await link("create", "set-a")).body;
    await db().doc(`users/${OWNER}/collections/set-a`).update({
      cards: [...SET.cards, { id: "c2", word: "gaffel", translation: "вилка" }],
    });
    expect((await open(id)).body.set.cards.map((c: { word: string }) => c.word)).toEqual(["kniv", "gaffel"]);
  });

  it("владельцу — id его набора, другу — нет", async () => {
    const { id } = (await link("create", "set-a")).body;
    expect((await open(id, OWNER)).body.own).toBe("set-a");
    expect((await open(id, FRIEND)).body.own).toBeUndefined();
    // Недействительный токен — просто гость
    expect((await call(sharedSetFn, { id }, "broken")).status).toBe(200);
  });

  it("удалённый набор: 404 и запись реестра убрана", async () => {
    const { id } = (await link("create", "set-a")).body;
    await db().doc(`users/${OWNER}/collections/set-a`).delete();
    expect((await open(id)).status).toBe(404);
    expect((await db().doc(`sharedSets/${id}`).get()).exists).toBe(false);
  });

  it("неизвестный и кривой id — 404", async () => {
    expect((await open("AAAAAAAAAAAA")).status).toBe(404);
    expect((await open("../users")).status).toBe(404);
  });
});

describe("удаление аккаунта", () => {
  it("ссылки человека перестают работать, чужие остаются", async () => {
    const mine = (await link("create", "set-a")).body.id;
    const friends = (await link("create", "set-f", FRIEND)).body.id;
    expect((await call(cleanupFn, {}, tokens[OWNER])).status).toBe(200);
    expect((await open(mine)).status).toBe(404);
    expect((await open(friends)).status).toBe(200);
  });
});
