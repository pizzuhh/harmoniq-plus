import React, { useState } from "react";
import { generateDailyChallenges } from "../utils/generateDailyChallenges";

type Answers = {
  mood: string;
  headState: string;
  energy: string;
  screenTime: string;
  phoneFeeling: string[]; // множествен избор
  phoneImpulse: string;
  lastNature: string;
  natureConnection: string;
  readiness: string;
  difficultyPreference: string;
  priority: string;
};

type Props = {
  onSubmit?: (payload: { answers: Answers; challenges: unknown }) => void;
};

export default function DailyQuestionnaire({ onSubmit }: Props) {
  const [answers, setAnswers] = useState<Answers>({
    mood: "",
    headState: "",
    energy: "",
    screenTime: "",
    phoneFeeling: [],
    phoneImpulse: "",
    lastNature: "",
    natureConnection: "",
    readiness: "",
    difficultyPreference: "Среден",
    priority: "Подобряване на емоционалното състояние",
  });

  function handleChange<K extends keyof Answers>(k: K, v: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [k]: v } as Answers));
  }

  // function toggleMulti(k: keyof Answers, v: string) {
  //   setAnswers((prev) => {
  //     const current = (prev[k] as unknown as string[]) || [];
  //     const arr = new Set(current);
  //     if (arr.has(v)) arr.delete(v);
  //     else arr.add(v);
  //     return { ...prev, [k]: Array.from(arr) } as Answers;
  //   });
  // }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const challenges = generateDailyChallenges(answers);
    if (onSubmit) onSubmit({ answers, challenges });
    else console.log("challenges", challenges);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Пример само за няколко полета — имплементирайте останалите по аналогия */}
      <label>Как се чувстваш днес?</label>
      <select
        onChange={(e) => handleChange("mood", e.target.value)}
        value={answers.mood}
      >
        <option value="">--</option>
        <option value="Спокоен и уравновесен">Спокоен и уравновесен</option>
        <option value="Леко напрегнат">Леко напрегнат</option>
        <option value="Раздразнен/претоварен">Раздразнен/претоварен</option>
        <option value="Тревожен">Тревожен</option>
        <option value="Емоционално изтощен">Емоционално изтощен</option>
      </select>

      {/* ...всички останали полета... */}

      <button type="submit">Генерирай предизвикателства</button>
    </form>
  );
}