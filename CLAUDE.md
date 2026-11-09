# CLAUDE.md

Kolo Sets: a PWA for learning words in any language with spaced repetition (SM-2, marketed as **Perigee**), plus a game layer of weekly orbits, XP, capsules and collectible items. It runs live at https://kolo.dakuta.dev (team Dakuta).

`README.md` is **out of date**: it describes an early version with `src/utils/i18n.ts`, no PWA and 3 languages. Trust this file, `docs/` and the code instead.

## Commands

```bash
npm run dev           # Vite on :5173; /api is proxied to production (kolo.dakuta.dev)
KOLO_API_TARGET=https://<branch>--dakuta-kolo.netlify.app npm run dev   # proxy /api to a branch preview
npm test              # vitest: unit tests (*.test.ts) only
npx vitest run server/core/loot.test.ts   # a single file
npm run test:emu      # *.emu.test.ts against Firebase Auth + Firestore emulators (needs Java)
npm run check:design  # design-system lint (also runs first in build)
npm run build         # check-design → tsc -b (app) → tsc -p tsconfig.server.json → vite build
npx tsc -b            # app type-check only
```

There is no working lint step: `eslint.config.js` exists, but ESLint is not installed. `npm run build` is the full gate.

Netlify functions do not run locally, so in `npm run dev` every `/api` call goes to the deployed functions. Previews and production both use the **production** Firebase project (`kolo-sets`).

## Stack

React 18, TypeScript 5.9 (strict with `noUnusedLocals` and `noUnusedParameters`; the app is type-checked through the root `tsconfig.json`, so `tsconfig.app.json` and `tsconfig.node.json` are unused Vite-template leftovers; the server uses `tsconfig.server.json`), Vite 5, Tailwind v4 via `@tailwindcss/postcss`, React Router 6, framer-motion, lucide-react, @dnd-kit. Firebase v10 (Auth, Firestore, Storage) on the client; `firebase-admin` in Netlify Functions. `vite-plugin-pwa` with a manually registered service worker (`src/utils/registerServiceWorker.ts`). Fonts: Nunito (headings) and Onest (body), self-hosted through @fontsource.

## Architecture

### Server-authoritative progress (docs/specs/00-server.md)

The browser owns **cards, SRS intervals, collections, folders and courses**. Everything that counts as a reward or a score is computed on the server: stats, streaks, XP, level, orbit, achievements, capsules, dust, inventory, equipped items, medals, `joinedAt`. The client reports a finished session and gets the result back.

Three layers:

- `server/core/`: **pure** functions with no I/O, covered by vitest. `session.ts` (parse and validate a session, plausibility check, apply), `xp.ts` (level step `100 + 50·(L−1)`, daily cap), `orbit.ts` (weekly goal of 3–7 days, shields, repair), `progression.ts` (prepare/settle/sync/goal/buyShield), `loot.ts` (capsule odds, pity, craft, equip, showcase, beta grant), `items.ts` (item catalog), `time.ts` (day keys in the user's timezone).
- `server/progress.ts`: Firestore transactions via Admin SDK (`server/admin.ts`). It reads the profile, runs the core functions and writes a patch. `writeProfile` uses `mergeFields`, so a nested map is **replaced whole**, never deep-merged.
- `netlify/functions/*.ts`: thin handlers wrapped in `handler()` from `server/http.ts`, which enforces POST, verifies the Firebase ID token and maps errors to JSON. The client calls `/api/<name>`.

**`/api/*` routing lives in `public/_redirects`, not `netlify.toml`.** Netlify applies `_redirects` first, and a toml rule once got swallowed by the SPA fallback in production. Keep the `/api/*` line above `/*`. The same file proxies `/__/auth/*` to `kolo-sets.firebaseapp.com`: Firebase `authDomain` is `kolo.dakuta.dev`, so the Google sign-in popup shows the Kolo domain. `https://kolo.dakuta.dev/__/auth/handler` must stay in the OAuth client's authorized redirect URIs (Google Cloud Console). The service worker skips `/__/*`.

Code shared between client and server:

- `server/core/*` imports `src/types.ts` and `src/utils/achievements.ts`. Those two files must stay free of browser and Firebase-client imports.
- The client imports types (and some constants) from `server/core` (`src/api/progress.ts`, rewards and progress components).

Client side: `src/api/progress.ts` posts with a Bearer token. If the network or server fails (429 or 5xx), finished sessions wait in a localStorage queue (`kolo_pending_sessions_<uid>`) and are flushed on the next start. `DataContext` holds the profile, collections (active course and all courses), courses, progression and loot. It syncs on start and when the day changes. Progress celebrations are fired through `announceProgress` / `announceMedals` (`components/progress/ProgressMoments.tsx`).

### Firestore

- `users/{uid}`: profile. The client may edit only its own non-server fields (name, photo, courses, folders, settings…). The list of server-owned fields is in `firestore.rules` (`serverOwnedFields`, `progressionFields`). **When you add a server-computed field, add it there too** and extend `firestore.rules.emu.test.ts`.
- `users/{uid}/collections/{id}`: sets with cards and SRS data, owner read/write.
- `users/{uid}/sessions/{id}`: training log, written only by the server. The owner can read and delete.
- `usernames/{name}`: uniqueness registry, claimed in a transaction (`claimUsername`).
- `dailyGame/{date}/scores/{uid}`: daily game leaderboard. The feature is hidden behind a flag.

### Client

- `src/App.tsx`: provider order `I18nProvider → AuthProvider → DataProvider`. Pages are lazy-loaded. Layouts:
  - `MainLayout`: tabs `/`, `/words`, `/profile`, `/rewards`, `/other` (shown as «More»).
  - `EmptyLayout`: full-screen study and game modes under `/collection/:id/*` and `/review`.
  - `NavLayout`: sub-pages with a back bar.
  - `LegalLayout`: public legal pages.
  - `/design`: design-system showcase, available in dev only.
- Courses (docs/specs/01-courses.md): one course per language. `courses: Course[]`, `activeCourseId` and `coursesVersion` live on the profile. The catalog is in `src/courses/languages.ts`. `src/courses/plan.ts` handles migration and self-healing and is tested. The Norwegian course id is `nb`, but the Norwegian UI language code is `no`.
- SRS: `updateSRSData` and `isDueCard` in `src/utils/storage.ts`, a simplified SM-2. `storage.ts` falls back to localStorage when nobody is signed in.
- Progression UI: `components/progress/*` (OrbitRing, WeekOrbit, OrbitGoalModal, ProgressMoments) and `components/rewards/*` (ItemArt, AvatarFrame, CapsuleArt, CapsuleOpenModal, Showcase). Item visuals are in `src/progression/looks.ts`, item display names in `locales/*/rewards.json`, and the catalog (kind, rarity, collection) in `server/core/items.ts`. A new item touches all three.
- Feature flags for built but hidden UI: `src/config/features.ts`.
- Legal: `src/pages/legal/legalInfo.ts` (`LEGAL.version`). Bump it on material changes to Terms or Privacy: users accept it at sign-up, and `LegalUpdateBanner` shows a one-time notice. Document texts are in `locales/<lang>/legal-docs.json` (all 8 languages, English is the original).

## Internationalization

- Eight UI languages are listed in `src/locales/languages.ts`, sorted alphabetically by their own names; insert a new one in alphabetical order. `app: true` means the whole app is translated. Currently that is en, ru, uk and no. de, es, fr and pt-BR have only landing, auth, legal, error and explore; `src/locales/index.ts` fills every other namespace from English.
- `src/locales/index.ts` imports every JSON file by hand. `Translations = typeof en`, so **English is the schema**: a key added to `en` must be added to every language that has that file. Use it with `const { t } = useI18n(); t.settings.foo`.
- Product rule: every UI string ships in en, ru, uk and no at the same time. A partially translated language stays unwired (German is in progress: `de/common.json`, `de/game.json` and `de/other/other.json` exist but are not imported yet). Flip `app: true` only when that language is complete.
- Tone: product copy talks to the user informally (Russian «ты»), legal documents formally («вы»). Never write «start free»: all learning is free.
- «What's new» lives in `locales/*/other/updates.json` → `versions[0]`, written as release notes (headline, intro, feature paragraphs, a «fixes» list), not as a changelog. User-facing changes are added to the current open version entry; do not create a new version number unless asked.

## Design system («Orbita»), enforced at build time

Read `src/design/README.md` before UI work. Core rules (checked by `scripts/check-design.mjs`):

- Colors come only from semantic tokens in `src/design/tokens.css` (`bg`, `surface`, `fg`, `muted`, `accent`, `accent-ink`, `danger`…). Do not use hex values in classes, Tailwind palette classes (`text-red-500`), or `dark:` color variants: tokens switch themselves under `.dark`.
- Text sizes and border radii come only from the scale; arbitrary `text-[13px]` and `rounded-[…]` are not allowed. `font-black` and `font-serif` are not allowed.
- Use the kit in `src/ui` (`Button`, `Card`, `Heading`, `Text`, `Field`, `Modal`, `Ring`, `Badge`, `Alert`…) via `import { … } from "../ui"`. `src/components/other/SettingsList.tsx` provides grouped settings rows.
- Item artwork colors (`src/progression/looks.ts`) are the exception: they are illustrations, not UI colors. Third-party brand hex values go in `BRAND_HEX` in the checker.
- A new token needs three changes: an `@theme` value and a `.dark` value in `tokens.css`, contrast of at least 4.5:1, and an entry in `COLOR_GROUPS` in `src/pages/design/DesignPage.tsx`.

## Conventions

- Code comments are written in **Russian** and explain *why*, often pointing to a spec (`docs/specs/…`). Match that.
- Commit messages are in English and describe the user-visible outcome (for example «Settings as a grouped list: rows, values and pickers instead of a stack of cards»), with a bullet body when needed.
- Product decisions, stage order and parked work are in `docs/roadmap.md`. Specs per stage are in `docs/specs/` (00 server, 01 courses, 02 progression). Write a spec in `docs/specs/` before starting a new stage.
- Rewards come only from practice; nothing random is ever sold. Social and competitive features are parked (branch `feature/social`).

## Deploy

Netlify site `dakuta-kolo` auto-deploys `main`. Work happens on feature branches, which are fast-forwarded into `main` (`git push origin <branch>:main`) **only when the user asks**. To deploy a branch preview manually: `npm run build && npx netlify-cli deploy --no-build --dir=dist --alias=<branch>`; deploying with build plugins hangs locally. Firestore rules are deployed separately by the user (`firebase deploy --only firestore:rules`). Server functions need the env vars `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` on Netlify (`/api/support` forwards support messages to the team's Telegram chat; secrets never go into client code). On the current Netlify plan, variables cannot be limited to a scope or marked secret; the API answers 403/422, and `env:set` fails silently. Use `npx netlify-cli api createEnvVars` with no `scopes` field. The client needs `VITE_FIREBASE_API_KEY` in `.env.local`.
