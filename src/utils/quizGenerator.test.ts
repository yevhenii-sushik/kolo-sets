import { describe, expect, it } from "vitest";
import { Card, TaskType } from "../types";
import { generateQuizQuestions } from "./quizGenerator";

const cards: Card[] = Array.from({ length: 6 }, (_, i) => ({
  id: `c${i}`,
  word: `w${i}`,
  translation: `t${i}`,
  explanation: i < 2 ? `e${i}` : "",
  example: "",
  partOfSpeech: "",
  createdAt: new Date(2026, 10, 1),
  srsData: { easinessFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(2026, 10, 1) },
}));

describe("generateQuizQuestions", () => {
  it("слово без объяснения не выпадает: вопрос по переводу вместо вопроса по объяснению", () => {
    const qs = generateQuizQuestions(cards, { enabledTaskTypes: [TaskType.WORD_BY_EXPLANATION, TaskType.WRITE_WORD_BY_EXPLANATION] });
    expect(qs).toHaveLength(cards.length);
    for (const q of qs) {
      const byExplanation = q.type === TaskType.WORD_BY_EXPLANATION || q.type === TaskType.WRITE_WORD_BY_EXPLANATION;
      expect(byExplanation).toBe(!!q.card.explanation);
    }
  });

  it("по вопросу на каждое слово при всех типах", () => {
    const all = [TaskType.WORD_BY_TRANSLATION, TaskType.TRANSLATION_BY_WORD, TaskType.WORD_BY_EXPLANATION, TaskType.WRITE_WORD_BY_TRANSLATION, TaskType.WRITE_WORD_BY_EXPLANATION];
    for (let i = 0; i < 20; i++) expect(generateQuizQuestions(cards, { enabledTaskTypes: all })).toHaveLength(cards.length);
  });
});
