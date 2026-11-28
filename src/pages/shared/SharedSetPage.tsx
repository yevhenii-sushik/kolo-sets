import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, CloudOff, Link2Off, Plus, RotateCw } from "lucide-react";
import { Alert, Badge, Button, ButtonLink, Card, Eyebrow, Heading, Loading, Logo, Skeleton, Text } from "../../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { courseName, defaultVoice } from "../../courses/languages";
import { plural } from "../../utils/plural";
import { addCollection } from "../../utils/storage";
import { fetchSharedSet, type SharedSetReply } from "../../api/shareLinks";
import { buildSharedCollection, sharedSetCourse, sharedSetVoice } from "../../sharedSets/build";
import { clearPendingShare, rememberPendingShare } from "../../sharedSets/pending";
import { APP_TITLE } from "../../utils/pageMeta";
import { finishOnboarding } from "../../utils/firstRun";
import TrialButton from "../../components/auth/TrialButton";

type PageState = { kind: "loading" } | { kind: "gone" } | { kind: "failed" } | { kind: "ready"; reply: SharedSetReply };

// Набор по ссылке (docs/specs/07-shared-sets.md): слова набора и копия себе. Открывается и без входа —
// гость видит слова и начинает их учить без аккаунта (пробный вход, шаг 16 в docs/specs/06-audit-fixes.md)
// или входит в свой аккаунт и возвращается сюда же (sharedSets/pending.ts)
export default function SharedSetPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const s = t.words.sharedSet;
  const locale = getLanguageInfo(language).htmlLang;
  const { user, loading: authLoading, expectUser } = useAuth();
  const { allCollections, courses, activeCourse, coursesReady, addCourse, setCollections, checkAchievements } = useData();

  // Адрес ссылки — не для поиска: SPA отвечает 200 на любой адрес, а набор — личный
  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  // Новый гость не ждёт Firebase; на устройстве, где уже входили, ждём — с токеном сервер узнает владельца
  const authReady = !authLoading || !expectUser;
  const signedIn = Boolean(user) || (authLoading && expectUser);
  const uid = user?.uid ?? null;

  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!authReady) return;
    let alive = true;
    // Вошёл или вышел, пока страница открыта, — слова на экране остаются, ответ обновится молча
    setState((prev) => (prev.kind === "ready" ? prev : { kind: "loading" }));
    fetchSharedSet(id).then(
      (reply) => alive && setState(reply ? { kind: "ready", reply } : { kind: "gone" }),
      () => alive && setState({ kind: "failed" }),
    );
    return () => {
      alive = false;
    };
  }, [id, authReady, uid, attempt]);

  // Вернулся сюда после входа — ссылка больше не ждёт. Чистим при уходе со страницы, а не сразу: страница входа
  // ещё может отправить сюда же после своих дел (afterSignInPath), и раннее удаление увело бы на главную
  const userRef = useRef(user);
  userRef.current = user;
  useEffect(
    () => () => {
      if (userRef.current) clearPendingShare();
    },
    [],
  );

  const reply = state.kind === "ready" ? state.reply : null;
  const set = reply?.set;
  const course = set ? (sharedSetCourse(set) ?? activeCourse?.id ?? "nb") : null;
  const copy = useMemo(() => allCollections.find((c) => c.sharedFrom === id), [allCollections, id]);
  const hasCourse = course ? courses.some((c) => c.id === course) : false;

  useEffect(() => {
    if (!set?.name) return;
    document.title = `${set.name} · Kolo`;
    return () => {
      document.title = APP_TITLE;
    };
  }, [set?.name]);

  const [busy, setBusy] = useState(false);
  const [addFailed, setAddFailed] = useState(false);
  const add = async (): Promise<string | null> => {
    if (!set || !course || busy) return null;
    setBusy(true);
    setAddFailed(false);
    try {
      const existing = courses.find((c) => c.id === course);
      // Нет курса — добавляем его (новичку не нужно выбирать язык на /start); есть, но не активный — делаем
      // активным: человек сейчас откроет этот набор, и главная со «Словами» должны показывать его курс
      if (!existing || activeCourse?.id !== course) await addCourse(course, existing ? undefined : sharedSetVoice(set, course));
      const voice = existing?.voice ?? sharedSetVoice(set, course) ?? defaultVoice(course);
      const col = buildSharedCollection(set, { shareId: id, courseId: course, voice, now: new Date() });
      await addCollection(col);
      setCollections((prev) => [col, ...prev]);
      clearPendingShare();
      checkAchievements();
      return col.id;
    } catch {
      setAddFailed(true);
      return null;
    } finally {
      setBusy(false);
    }
  };

  // Гость нажал «Учить эти слова»: пробный вход, и как только аккаунт и его курсы загрузились — набор себе
  // и сразу тренировка по нему. Вступление на главной не нужно: человек уже учится
  const [learnAfterTrial, setLearnAfterTrial] = useState(false);
  useEffect(() => {
    if (!learnAfterTrial || !user || !coursesReady || !set || busy) return;
    setLearnAfterTrial(false);
    void add().then((colId) => {
      if (!colId) return;
      finishOnboarding();
      navigate(`/learn?set=${colId}`);
    });
  }, [learnAfterTrial, user, coursesReady, set]); // eslint-disable-line react-hooks/exhaustive-deps

  const toAuth = (path: "/register" | "/login") => {
    rememberPendingShare(id);
    navigate(path);
  };

  const words = (n: number) => plural(locale, n, t.words.collectionCard.words);
  const courseLabel = course ? courseName(course, locale) : "";

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to={signedIn ? "/" : "/welcome"} className="group shrink-0">
            <Logo />
          </Link>
          {signedIn ? (
            <ButtonLink to="/" size="sm" variant="secondary">
              {s.openApp}
            </ButtonLink>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => toAuth("/login")}>
              {s.signIn}
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-8 px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        {state.kind === "loading" && (
          <Loading label={t.loading} className="grid gap-8">
            <div className="grid gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-12 w-2/3 rounded-xl" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton tone="surface" className="h-36 rounded-3xl" />
            <Skeleton tone="surface" className="h-64 rounded-3xl" />
          </Loading>
        )}

        {state.kind === "gone" && (
          <Card tone="inset" padding="lg" className="grid justify-items-center gap-4 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-surface text-muted">
              <Link2Off size={26} />
            </span>
            <div className="grid max-w-sm gap-1">
              <Heading size={3} as="h1">
                {s.goneTitle}
              </Heading>
              <Text tone="muted">{s.goneText}</Text>
            </div>
            <ButtonLink to={signedIn ? "/" : "/welcome"}>{s.goHome}</ButtonLink>
          </Card>
        )}

        {state.kind === "failed" && (
          <Card tone="inset" padding="lg" className="grid justify-items-center gap-4 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-surface text-muted">
              <CloudOff size={26} />
            </span>
            <div className="grid max-w-sm gap-1">
              <Heading size={3} as="h1">
                {t.error.title}
              </Heading>
              <Text tone="muted">{t.error.text}</Text>
            </div>
            <Button iconLeft={<RotateCw size={18} />} onClick={() => setAttempt((n) => n + 1)}>
              {t.error.retry}
            </Button>
          </Card>
        )}

        {set && course && (
          <>
            <header className="grid gap-2">
              <Eyebrow>{s.eyebrow.replace("{language}", courseLabel)}</Eyebrow>
              <Heading size="display">{set.name}</Heading>
              <Text tone="muted">{words(set.cards.length)}</Text>
            </header>

            {set.cards.length > 0 && (
              <Card padding="lg" className="grid gap-4">
                {!signedIn || learnAfterTrial ? (
                  <>
                    <Text tone="muted">{s.guestPitch}</Text>
                    <TrialButton
                      label={s.guestCta}
                      size="md"
                      align="start"
                      onStarted={() => setLearnAfterTrial(true)}
                    />
                    <div>
                      <Button variant="ghost" size="sm" onClick={() => toAuth("/login")}>
                        {s.guestSignIn}
                      </Button>
                    </div>
                  </>
                ) : reply?.own ? (
                  <>
                    <div className="grid justify-items-start gap-2">
                      <Badge tone="accent">{s.own}</Badge>
                      <Text tone="muted">{s.ownText}</Text>
                    </div>
                    <div>
                      <ButtonLink to={`/collection/${reply.own}/edit`} variant="secondary">
                        {t.words.ready.openSet}
                      </ButtonLink>
                    </div>
                  </>
                ) : copy ? (
                  <>
                    <div className="grid justify-items-start gap-2">
                      <Badge tone="success">
                        <Check size={12} aria-hidden />
                        {s.added}
                      </Badge>
                      <Text tone="muted">{s.addedText}</Text>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ButtonLink to={`/learn?set=${copy.id}`}>{t.words.ready.learn}</ButtonLink>
                      <ButtonLink to={`/collection/${copy.id}/edit`} variant="secondary">
                        {t.words.ready.openSet}
                      </ButtonLink>
                    </div>
                  </>
                ) : (
                  <>
                    <Text tone="muted">{(hasCourse ? s.toCourse : s.toNewCourse).replace("{language}", courseLabel)}</Text>
                    <div>
                      <Button iconLeft={<Plus size={18} />} loading={busy || !coursesReady} onClick={add}>
                        {s.add}
                      </Button>
                    </div>
                    {addFailed && <Alert>{s.addError}</Alert>}
                  </>
                )}
              </Card>
            )}

            {set.cards.length === 0 ? (
              <Card tone="inset" padding="lg" className="py-10 text-center">
                <Text tone="muted">{s.empty}</Text>
              </Card>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
                {set.cards.map((card, i) => (
                  <li key={i} className="grid gap-1 px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                      <span lang={set.voice || undefined} className="font-semibold text-fg">
                        {card.word}
                      </span>
                      <span className="text-sm text-muted">{card.translation}</span>
                    </div>
                    {card.example && (
                      <p lang={set.voice || undefined} className="text-sm text-faint">
                        {card.example}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
