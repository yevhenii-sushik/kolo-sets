import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Timer, Zap } from "lucide-react";
import { Collection } from "../../types";
import { isDueCard, isNewCard } from "../../utils/storage";
import { useI18n } from "../../contexts/I18nContext";
import { Modal, PerigeeMark } from "../../ui";
import PerigeeTag from "../session/PerigeeTag";

// Выбор режима для набора — одно окно и на карточке набора в «Словах», и в редакторе набора.
// Раньше «Учить» в редакторе сразу открывало флэшкарты, а на карточке набора «Учить» — сессию Perigee:
// одно слово, два разных режима (docs/specs/perigee.md, «Флэшкарты»)
export default function StudyModeModal({ collection, open, onClose }: { collection: Collection; open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const m = t.words.collectionCard.modal;

  const tooFewQuiz = collection.cards.length < 4;
  const dueToday = collection.cards.filter(isDueCard).length;
  // Сессии Perigee по набору есть что предложить: слова на сегодня или новые
  const canLearn = dueToday > 0 || collection.cards.some(isNewCard);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };
  const start = (path: string) => go(`/collection/${collection.id}/${path}`);

  return (
    <Modal open={open} onClose={onClose} title={collection.name} size="sm">
      <p className="-mt-2 mb-4 text-sm text-muted">{m.chooseMode}</p>
      <div className="grid gap-2">
        {/* Четыре режима, у каждого своя задача (docs/specs/perigee.md, «Режимы после чистки»):
            учить по расписанию, прогнать весь набор, проверить себя, поиграть */}
        <ModeButton
          icon={<PerigeeMark size={18} tone="mono" />}
          label={dueToday > 0 ? `${m.learn} · ${dueToday}` : m.learn}
          desc={canLearn ? m.learnDesc : m.learnDone}
          disabled={!canLearn}
          onClick={() => go(`/learn?set=${collection.id}`)}
          perigee
        />
        <ModeButton icon={<Zap size={18} />} label={m.flashcards} desc={m.flashcardsDesc} onClick={() => start("flashcards")} perigee />
        <ModeButton
          icon={<BookOpen size={18} />}
          label={m.quiz}
          desc={tooFewQuiz ? m.quizNeedsMore : m.quizDesc}
          disabled={tooFewQuiz}
          onClick={() => start("quiz")}
          perigee
        />

        <p className="mt-3 px-1 text-sm font-semibold text-fg">{m.games}</p>
        <ModeButton
          icon={<Timer size={18} />}
          label={m.speed}
          desc={tooFewQuiz ? m.needMore : m.speedDesc}
          disabled={tooFewQuiz}
          onClick={() => start("speed")}
          perigee
        />
      </div>
      {/* Что значит знак у режимов — одна строка внизу */}
      <p className="mt-4 flex items-center gap-2 px-1 text-xs text-muted">
        <PerigeeTag compact />
        {t.words.perigee.legend}
      </p>
    </Modal>
  );
}

function ModeButton({ icon, label, desc, onClick, disabled, perigee = false }: { icon: ReactNode; label: string; desc: string; onClick: () => void; disabled?: boolean; perigee?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-inset p-3 text-left transition-colors hover:border-accent/40 disabled:pointer-events-none disabled:opacity-45"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-accent-ink">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">{label}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
      {perigee && <PerigeeTag compact />}
    </button>
  );
}
