import { describe, expect, it } from "vitest";
import { wordForSpeech } from "./tts";

describe("wordForSpeech", () => {
  it("слово с вариантами читаем по первому варианту и без скобок", () => {
    expect(wordForSpeech("glad / lykkelig")).toBe("glad");
    expect(wordForSpeech("hus; heim")).toBe("hus");
    expect(wordForSpeech("(to) run")).toBe("to run");
    expect(wordForSpeech("å gå")).toBe("å gå");
    expect(wordForSpeech(" / ")).toBe("/");
  });
});
