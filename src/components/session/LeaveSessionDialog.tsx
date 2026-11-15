import { Flag } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { Button, Modal } from "../../ui";

// «Начал — закончи»: брошенная тренировка не засчитывается (ни опыта, ни дня в орбиту недели), поэтому
// перед выходом с середины спрашиваем. Мягкий толчок, без обмана: полоса показывает, как близко конец
// (чем ближе цель, тем охотнее доходят), и честно сказано, что теряется. Главная кнопка — «Продолжить»,
// клик мимо окна и Esc тоже оставляют в тренировке: выйти можно только явно
export default function LeaveSessionDialog({
  open,
  done,
  total,
  onStay,
  onLeave,
}: {
  open: boolean;
  done: number; // слов уже пройдено
  total: number;
  onStay: () => void;
  onLeave: () => void;
}) {
  const { t, language } = useI18n();
  const l = t.words.session.leave;
  const left = Math.max(0, total - done);
  const near = total > 0 && done * 2 >= total;

  return (
    <Modal
      open={open}
      onClose={onStay}
      size="sm"
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onLeave}>
            {l.leave}
          </Button>
          <Button fullWidth onClick={onStay} autoFocus>
            {l.stay}
          </Button>
        </>
      }
    >
      <div className="grid justify-items-center gap-3 pt-2 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
          <Flag size={26} />
        </span>
        <h2 className="font-display text-2xl font-extrabold text-fg">{near ? l.titleNear : l.title}</h2>
        <div className="grid w-full gap-1.5">
          <div className="h-2.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-accent" style={{ width: `${total > 0 ? Math.round((done / total) * 100) : 0}%` }} />
          </div>
          <p className="text-sm font-semibold text-fg">{plural(getLanguageInfo(language).htmlLang, left, l.left)}</p>
        </div>
        <p className="text-sm text-muted">{l.reward}</p>
        <p className="text-xs text-faint">{l.loss}</p>
      </div>
    </Modal>
  );
}
