// Роли команды (docs/specs/admin.md): admin — админ-панель, staff — значок «Команда Dakuta» в профиле.
// Админ всегда в команде: выдать админку — значит и значок, убрать из команды — значит и админку.
// Кнопки в приложении нет намеренно.
//
//   node scripts/admin/grant-admin.mjs <email>                   админ (и значок команды)
//   node scripts/admin/grant-admin.mjs <email> --staff           только значок команды, без панели
//   node scripts/admin/grant-admin.mjs <email> --revoke          снять админку (значок команды остаётся)
//   node scripts/admin/grant-admin.mjs <email> --revoke --staff  убрать из команды совсем
//   node scripts/admin/grant-admin.mjs --list                    кто в команде
//
// Ключ — тот же, что у серверных функций. Проще всего взять его из переменных Netlify:
//   npx netlify-cli dev:exec node scripts/admin/grant-admin.mjs <email>
// или файлом сервисного аккаунта: GOOGLE_APPLICATION_CREDENTIALS=/путь/key.json node scripts/admin/grant-admin.mjs …
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const PROJECT_ID = "kolo-sets";

function app() {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) return initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? PROJECT_ID });
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const credential = clientEmail && privateKey ? cert({ projectId: PROJECT_ID, clientEmail, privateKey }) : applicationDefault();
  return initializeApp({ credential, projectId: PROJECT_ID });
}

// Как rolesOf в server/core/admin.ts
const rolesOf = (claims) => ({ admin: claims?.admin === true, staff: claims?.admin === true || claims?.staff === true });

const auth = getAuth(app());
const args = process.argv.slice(2);
const revoke = args.includes("--revoke");
const staffOnly = args.includes("--staff");
const list = args.includes("--list");
const email = args.find((a) => !a.startsWith("--"));

if (list) {
  let pageToken;
  let found = 0;
  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) {
      const r = rolesOf(u.customClaims);
      if (r.staff) {
        found++;
        console.log(`${r.admin ? "админ   " : "команда "} ${u.email ?? "(без email)"}  ${u.uid}`);
      }
    }
    pageToken = res.pageToken;
  } while (pageToken);
  if (!found) console.log("В команде никого.");
  process.exit(0);
}

if (!email) {
  console.error("Укажи email: node scripts/admin/grant-admin.mjs <email> [--staff] [--revoke] | --list");
  process.exit(1);
}

const user = await auth.getUserByEmail(email).catch(() => null);
if (!user) {
  console.error(`Аккаунт ${email} не найден.`);
  process.exit(1);
}

const was = rolesOf(user.customClaims);
const next = revoke
  ? staffOnly
    ? { admin: false, staff: false }
    : { admin: false, staff: was.staff }
  : staffOnly
    ? { admin: was.admin, staff: true }
    : { admin: true, staff: true };

// Остальные claims (если появятся) не трогаем
const { admin: _admin, staff: _staff, ...rest } = user.customClaims ?? {};
const claims = { ...rest, ...(next.admin ? { admin: true } : {}), ...(next.staff ? { staff: true } : {}) };
await auth.setCustomUserClaims(user.uid, Object.keys(claims).length ? claims : null);

// Снятая админка должна перестать работать сразу, а не через час: сервер проверяет отзыв (adminHandler)
if (was.admin && !next.admin) await auth.revokeRefreshTokens(user.uid);

const role = next.admin ? "админ и в команде Dakuta" : next.staff ? "в команде Dakuta (без админ-панели)" : "не в команде";
console.log(`Готово: ${email} — ${role}.`);
if (next.admin && !was.admin) console.log("Открой https://kolo.dakuta.dev/admin — страница сама обновит токен.");
else if (next.staff && !was.staff) console.log("Значок появится в профиле в течение часа или после повторного входа.");
if (was.admin && !next.admin) console.log("Сессии на всех устройствах завершены.");
