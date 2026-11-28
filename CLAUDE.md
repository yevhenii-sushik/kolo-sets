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
- `netlify/functions/*.ts`: thin handlers wrapped in `handler()` from `server/http.ts`, which enforces POST, verifies the Firebase ID token and maps errors to JSON. `publicHandler()` is the same without requiring sign-in (uid or null; only `/api/shared-set`). The client calls `/api/<name>`. One scheduled function, `trial-cleanup` (`@daily`, runs only on the published production deploy and cannot be called by URL), deletes trial accounts and new never-confirmed email accounts nobody opened for 30 days (`server/trial.ts`, rule in `server/core/trial.ts`). `handler()` passes the verified token as a third argument; what an account may do (trial, email waiting for confirmation, locked after 7 days, verified, legacy = created before `VERIFY_RULE_FROM` and never restricted) is one rule in `server/core/access.ts`, shared with the client (`useAuth().standing`, `VerifyEmailGate`). It limits support messages per day (`rateLimits/{uid}`), share-link creation and, when locked, `/api/session`.

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
- `adminLog/{id}`: who viewed which user in the admin panel. Server-only; the catch-all rule keeps clients out.
- `sharedSets/{id}`: set-by-link registry `{ ownerUid, collectionId, createdAt }`. Server-only, like `adminLog`.
- `adminStats/{id}`: aggregate counters for the admin panel (`adminStats/trials.deleted`, `adminStats/unverified.deleted`, written by the cleanup). Server-only.
- `rateLimits/{uid}`: per-user daily counters (support messages). Server-only.

### Client

- `src/App.tsx`: provider order `I18nProvider → AuthProvider → DataProvider`. Pages are lazy-loaded. Layouts:
  - `MainLayout`: tabs `/`, `/words`, `/profile`, `/other` (shown as «More»), listed in `src/navigation.ts`. `/rewards` uses the same layout but has no tab: it opens from the profile and from capsule celebrations.
  - `EmptyLayout`: full-screen study modes: `/learn` (Perigee session; `?set=<id>` for one set) and `/collection/:id/{flashcards,quiz,speed}`. `speed` is the Blitz game (`src/blitz/`, `pages/games/BlitzPage.tsx`); the internal name stays `speed` because the server and the offline queue know it. Old `/review`, `survival` and `match` routes only redirect.
  - `NavLayout`: sub-pages with a back bar.
  - `LegalLayout`: public legal pages.
  - `/design`: design-system showcase, available in dev only.
- Courses (docs/specs/01-courses.md): one course per language. `courses: Course[]`, `activeCourseId` and `coursesVersion` live on the profile. The catalog is in `src/courses/languages.ts`. `src/courses/plan.ts` handles migration and self-healing and is tested. The Norwegian course id is `nb`, but the Norwegian UI language code is `no`.
- SRS (Perigee): `src/utils/srs.ts` is pure and tested (`storage.ts` re-exports it). It is a modified SM-2 where each of the four ratings has a distinct outcome. The session engine is `src/perigee/plan.ts`. Every mode writes ratings through `components/session/useSrsWriter.ts`, using the first answer per word per session. The spec is `docs/specs/perigee.md`. Sets live only in Firestore: the old localStorage guest mode was removed in 0.5.0 (`storage.ts` rejects writes without a signed-in user).
- Progression UI: `components/progress/*` (OrbitRing, WeekOrbit, OrbitGoalModal, ProgressMoments) and `components/rewards/*` (ItemArt, AvatarFrame, CapsuleArt, CapsuleOpenModal, Showcase). Item visuals are in `src/progression/looks.ts`, item display names in `locales/*/rewards.json`, and the catalog (kind, rarity, collection) in `server/core/items.ts`. A new item touches all three.
- Onboarding teaches by doing:
  - First run is step by step (`pages/courses/StartPage.tsx` at `/start`, open without an account): language → how many days a week (sets the weekly goal) → "your first lesson" → the lesson itself, on the first ready-made topic (or "create your first set" for a course without ready sets). One path for trial and registered newcomers; a trial account is created only on the last step, with the consent line under its button.
  - The starter capsule and the beta medal come with the first finished session, as one "first rewards" window (`announceFirstSession`); reward pop-ups wait for the results screen during a session (`utils/momentsHold.ts`).
  - `OnboardingModal`: the old 3-step intro; new users skip it (the first run marks it seen).
  - `components/onboarding/FirstSteps.tsx`: a checklist on Home (language → set → 5 words → first session → weekly goal). It is detected from real data and replaces the Home hero while active.
  - Coach hints in the first flashcards session (`RatingBar`/`FlashcardStatsModal` `coach` prop).
  - All "seen" flags live in `src/utils/firstRun.ts` (localStorage); `restartOnboarding()` resets them.
  - The weekly-goal prompt (`MainLayout`) appears only for people without a goal (shared-link trials, old accounts), on a day after their first session.
- Ready-made sets (docs/specs/05-ready-sets.md): one file per set, `src/presets/<course>/<level>/<topic>.json`, each loaded as its own chunk. Levels, topic order and translation languages live in `src/presets/levels.ts`, topic titles in `words.ready.topics` (all 8 languages), icons in `components/presets/topicIcons.ts`, shown as the «Kolo sets» tab on Words (`/words?tab=kolo`) and offered first in the «First steps» set guide. `src/presets/presets.test.ts` checks every file (15–25 cards, every needed translation, no repeats in a level). Adding copies the set into the user's collections with `preset` and `presetCardId` (`presets/build.ts`). Sets ship without proofreading, so `components/presets/ReportMistakeModal.tsx` (in the set preview and on preset cards in the user's own set) sends a mistake report through `/api/support` with a `preset` field (set, version, card, translation language). Medals for words and sets count only started words (`server/core/cards.ts`); the first-set medal counts any set.
- Trial mode (step 16 in docs/specs/06-audit-fixes.md): «Try without signing up» (`components/auth/TrialButton.tsx`, on the landing and for guests on a shared set) is Firebase anonymous sign-in with a consent line under the button (no checkbox) and `trialStartedAt` on the profile. Same uid, rules and server functions as any account. For a course with ready-made sets, `StartPage` adds the first topic and opens a session right away. «Save progress» (`components/auth/SaveProgress.tsx`: global `SaveProgressHost`, `openSaveProgress()`, `TrialBanner` in `MainLayout`, a row in Settings) links Google or email to the same uid; if that account already exists, the trial's sets are copied into it and XP/rewards stay behind. Leaving trial mode deletes the account. `useAuth().isTrial` = `user.isAnonymous`. The **Anonymous** sign-in provider must stay enabled in Firebase Authentication.
- Set by link (docs/specs/07-shared-sets.md): «Share» on the set page (`components/cards/ShareSetModal.tsx`) asks `/api/share-link` for one live link per set; `/s/:id` (`pages/shared/SharedSetPage.tsx`, public, works signed in or out) reads the owner's set through `/api/shared-set` at open time (words only, no SRS, no owner data) and adds a copy with a fresh schedule and `sharedFrom` (`src/sharedSets/build.ts`), adding or activating the set's course. A guest who taps «Learn these words» is sent back to the link after sign-in (`src/sharedSets/pending.ts`, `afterSignInPath()` in `PublicRoute` and the auth pages). Account cleanup deletes the user's links.
- Feature flags for built but hidden UI: `src/config/features.ts` (the daily game and the Home tip of the day are off).
- Admin panel (docs/specs/admin.md): `/admin`, read-only for now. Tabs: overview and «Удержание» (retention by signup week and the newcomer funnel, aggregates only; `server/core/metrics.ts`). Team roles are Firebase Auth custom claims: `admin: true` (the panel) and `staff: true` (the «Dakuta team» badge in the profile header, `components/profile/TeamBadges.tsx`). Every admin counts as staff (`rolesOf` in `server/core/admin.ts`). Roles are granted only by `scripts/admin/grant-admin.mjs` (`npx netlify-cli dev:exec node scripts/admin/grant-admin.mjs <email> [--staff] [--revoke] | --list`). Admin functions use `adminHandler()` from `server/http.ts`, which also checks token revocation. It is an internal tool: Russian only, outside i18n, and it never shows set names or words. The "sessions in 7 days" count needs the collection-group index in `firestore.indexes.json` (`firebase deploy --only firestore:indexes`).
- Sounds: `src/utils/sounds.ts` plays `public/sounds/<id>.mp3` through one shared AudioContext (`playSound(id, { rate, delay })`, `startLoop` for the capsule shake). Ceremony sounds (session end, level, orbit, medals) queue instead of overlapping. The files come from `scripts/sounds/synth.py`, whose README lists the pitch steps; a new sound needs an entry there and its id in `SOUND_IDS`.
- Legal: `src/pages/legal/legalInfo.ts` (`LEGAL.version`). Bump it on material changes to Terms or Privacy: users accept it at sign-up, and `LegalUpdateBanner` shows a one-time notice. Document texts are in `locales/<lang>/legal-docs.json` (all 8 languages, English is the original).

## Internationalization

- Eight UI languages are listed in `src/locales/languages.ts`, sorted alphabetically by their own names; insert a new one in alphabetical order. `app: true` means the whole app is translated and the language is offered in Settings. All eight have it (de, es, fr and pt-BR since 2026-11-27). For de/es/fr/pt-BR, two parts stay in English by decision (user, 2026-11-27): the tip of the day (`home.tips`) and the daily game (`game.json`, no file for es/fr/pt-BR); both are hidden behind flags. Translate them before switching either flag on.
- Start language (`startLanguage` in `src/locales/languages.ts`, saved as `appLanguage` in localStorage): a saved choice wins. A first visit uses `pickLanguage`: a browser set to one of our non-English languages wins; otherwise the language of the country from the device time zone (`src/locales/regionLanguages.ts`, no network or geolocation); otherwise English. The guessed language is saved as soon as the user signs in (`I18nContext`), so it does not change when they travel. People who used Kolo before 0.4.1 without picking a language (a profile cache or finished onboarding on the device, nothing saved) keep the old rule, browser language or English, and it is saved on their first start. The landing header has no language picker; the footer does.
- `src/locales/index.ts` imports every JSON file by hand. `Translations = typeof en`, so **English is the schema**: a key added to `en` must be added to every language that has that file. For de/es/fr/pt-BR, `fillFrom` (`src/locales/fillFrom.ts`) fills anything missing from English **per key**, so a missing string falls back to English instead of breaking. Use it with `const { t } = useI18n(); t.settings.foo`.
- Product rule (user, 2026-11-15): every new or changed UI string ships in **all 8 languages** at the same time. That includes «What's new» entries and the «About Kolo» guide (`auth/guide.json`, loaded per language as a whole file with no English fallback, so it must stay complete). A new language gets `app: true` only when it is complete.
- Tone: product copy talks to the user informally (Russian «ты»), legal documents formally («вы»). Never write «start free»: all learning is free.
- «What's new» lives in `locales/*/other/updates.json` → `versions[0]`, written as release notes (headline, intro, feature paragraphs, a «fixes» list), not as a changelog. User-facing changes are added to the current open version entry. 0.4.0 was released on 2026-11-21, 0.4.1 on 2026-11-27 (de/es/fr/pt-BR in full, ready-made A1 sets for `nb` and `en`, set by link, fix-plan steps 1–6); both are closed. 0.5.0 was released on 2026-11-28 (trial mode with a step-by-step first run, shorter sign-up, limits for trial and unconfirmed accounts, retention metrics) and is closed. **No version is open.** From here, releases are a 0.5.x series of small versions (user, 2026-11-28): each is 1–3 fix-plan steps and goes to production as soon as it is done. The step-to-version table is in `docs/specs/06-audit-fixes.md` («Версии»): open a number from that table without asking; any number outside it needs the user's OK. Internal-only work (the admin panel) gets no version and no What's new entry. Every language holds every entry. `versionsFrom` (`src/locales/index.ts`) still fills an entry missing from de/es/fr/pt-BR with the English one by version number, because `fillFrom` takes arrays whole. After a release, ask the user for the next version number before writing notes, then add that entry in all languages and bump `version` in `package.json` (`npm version <n> --no-git-tag-version`).

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
- Product decisions, stage order and parked work are in `docs/roadmap.md`. Specs per stage are in `docs/specs/` (00 server, 01 courses, 02 progression, 05 ready-made sets, 06 audit fixes: findings and the step-by-step fix plan, perigee: learning modes). Write a spec in `docs/specs/` before starting a new stage.
- Rewards come only from practice; nothing random is ever sold. Social and competitive features are parked (branch `feature/social`).

## Deploy

Netlify site `dakuta-kolo` auto-deploys `main`. Work happens on feature branches, which are fast-forwarded into `main` (`git push origin <branch>:main`) **only when the user asks**. To deploy a branch preview manually: `npm run build && npx netlify-cli deploy --no-build --dir=dist --alias=<branch>`; deploying with build plugins hangs locally. Firestore rules are deployed separately by the user (`firebase deploy --only firestore:rules`). Server functions need the env vars `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` on Netlify (`/api/support` forwards support messages to the team's Telegram chat; secrets never go into client code). On the current Netlify plan, variables cannot be limited to a scope or marked secret; the API answers 403/422, and `env:set` fails silently. Use `npx netlify-cli api createEnvVars` with no `scopes` field. The client needs `VITE_FIREBASE_API_KEY` in `.env.local`.
