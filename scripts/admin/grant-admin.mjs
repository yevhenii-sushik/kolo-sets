// Выдать или снять права админа (docs/specs/admin.md). Кнопки в приложении нет намеренно.
//
//   node scripts/admin/grant-admin.mjs <email>            выдать
//   node scripts/admin/grant-admin.mjs <email> --revoke   снять (и выйти на всех устройствах)
//   node scripts/admin/grant-admin.mjs --list             кто админ
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

const auth = getAuth(app());
const args = process.argv.slice(2);
const revoke = args.includes("--revoke");
const list = args.includes("--list");
const email = args.find((a) => !a.startsWith("--"));

if (list) {
  let pageToken;
  let found = 0;
  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) {
      if (u.customClaims?.admin === true) {
        found++;
        console.log(`${u.email ?? "(без email)"}  ${u.uid}`);
      }
    }
    pageToken = res.pageToken;
  } while (pageToken);
  if (!found) console.log("Админов нет.");
  process.exit(0);
}

if (!email) {
  console.error("Укажи email: node scripts/admin/grant-admin.mjs <email> [--revoke] | --list");
  process.exit(1);
}

const user = await auth.getUserByEmail(email).catch(() => null);
if (!user) {
  console.error(`Аккаунт ${email} не найден.`);
  process.exit(1);
}

// Остальные claims (если появятся) не трогаем
const { admin: _was, ...rest } = user.customClaims ?? {};
if (revoke) {
  await auth.setCustomUserClaims(user.uid, Object.keys(rest).length ? rest : null);
  // Иначе старый токен с claim работал бы ещё до часа; сервер проверяет отзыв (adminHandler)
  await auth.revokeRefreshTokens(user.uid);
  console.log(`Права админа сняты: ${email}. Сессии на всех устройствах завершены.`);
} else {
  await auth.setCustomUserClaims(user.uid, { ...rest, admin: true });
  console.log(`Готово: ${email} — админ. Открой https://kolo.dakuta.dev/admin (страница сама обновит токен).`);
}
