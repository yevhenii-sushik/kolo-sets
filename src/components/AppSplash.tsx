import { useEffect, useState } from "react";
import { useI18n } from "../contexts/I18nContext";
import { LogoMark } from "../ui";
import { BOOT_MS, BootNote } from "../config/boot";

// Заставка, пока ждём Firebase или ленивую страницу. Это копия статичной заставки из index.html:
// та же разметка, те же классы (стили — там же, в <head>) и те же тайминги, поэтому React
// подменяет её без скачка — спутник летит дальше, подпись не мигает.
// Знак крутится, а если ждать дольше обычного, под ним появляется подпись: грузим, сеть медленная
// или её нет. Без неё на 3G или без сети было непонятно, идёт ли загрузка вообще
export default function AppSplash() {
  const { t } = useI18n();
  const [since] = useState(splashStart);
  useEffect(splashMounted, []);
  // Задержки считаются один раз: пересчёт при перерисовке сдвинул бы уже идущую анимацию
  const [elapsed] = useState(() => performance.now() - since);
  const note = useBootNote(since);

  return (
    <div className="boot-splash" role="status" style={{ animationDelay: `${BOOT_MS.show - elapsed}ms` }}>
      <div className="boot-body">
        <span className="boot-mark" style={{ animationDelay: `${-elapsed}ms` }}>
          <LogoMark size={56} />
        </span>
        <p className="boot-note" style={{ animationDelay: `${note === "offline" ? 0 : BOOT_MS.note - elapsed}ms` }}>
          {t.boot[note]}
        </p>
      </div>
    </div>
  );
}

function useBootNote(since: number): BootNote {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [slow, setSlow] = useState(() => performance.now() - since >= BOOT_MS.slow);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const left = BOOT_MS.slow - (performance.now() - since);
    const timer = left > 0 ? window.setTimeout(() => setSlow(true), left) : undefined;
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.clearTimeout(timer);
    };
  }, [since]);
  return !online ? "offline" : slow ? "slow" : "loading";
}

// Начало текущего показа заставки. Первый показ продолжает статичную заставку из index.html
// и считается с открытия страницы (0). Если одна заставка сразу сменяет другую (ждали вход —
// теперь грузится экран), отсчёт идёт дальше, иначе подпись пропала бы и появилась снова.
// Пауза дольше пары кадров — это уже новое ожидание, отсчёт с начала
let since: number | null = null;
let shown = 0;
let endTimer: number | undefined;

function splashStart(): number {
  // Статичная заставка ещё на экране только при первом кадре React: она — начало этого же ожидания
  if (since === null) since = document.getElementById("boot-splash") ? 0 : performance.now();
  return since;
}

function splashMounted() {
  shown++;
  window.clearTimeout(endTimer);
  return () => {
    shown--;
    if (shown === 0) endTimer = window.setTimeout(() => (since = null), 100);
  };
}
