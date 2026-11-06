import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cx } from "../../ui";

// idle — можно выбрать; chosenRight/chosenWrong — выбор игрока; reveal — правильный ответ после ошибки; dim — остальные
export type ChoiceState = "idle" | "chosenRight" | "chosenWrong" | "reveal" | "dim";

const STATES: Record<ChoiceState, string> = {
  idle: "border-line bg-surface text-fg hover:border-accent/50 hover:bg-accent-soft",
  chosenRight: "border-success bg-success-soft text-success",
  chosenWrong: "border-danger bg-danger-soft text-danger",
  reveal: "border-success bg-surface text-success",
  dim: "border-line bg-surface text-faint",
};

// Вариант ответа с номером клавиши (1–4 или A–D) — в тесте и играх
export default function ChoiceButton({
  label,
  hint,
  state,
  onClick,
}: {
  label: string;
  hint: string;
  state: ChoiceState;
  onClick: () => void;
}) {
  const locked = state !== "idle";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={locked}
      whileTap={locked ? undefined : { scale: 0.98 }}
      className={cx(
        "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-base font-semibold transition-colors disabled:cursor-default",
        STATES[state],
      )}
    >
      <span
        className={cx(
          "grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-semibold",
          state === "idle" || state === "dim" ? "bg-inset text-faint" : "bg-surface/60",
        )}
      >
        {hint}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      {(state === "chosenRight" || state === "reveal") && <Check size={18} className="shrink-0" />}
      {state === "chosenWrong" && <X size={18} className="shrink-0" />}
    </motion.button>
  );
}

// Состояние варианта по выбору игрока: chosen — что выбрали (или null), correct — правильный ответ
export const choiceState = (option: string, chosen: string | null, correct: string): ChoiceState => {
  if (chosen === null) return "idle";
  if (option === chosen) return option === correct ? "chosenRight" : "chosenWrong";
  if (option === correct) return "reveal";
  return "dim";
};
