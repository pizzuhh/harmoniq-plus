// ---------------------
// Types
// ---------------------

export type Difficulty = "easy" | "medium" | "hard";

export interface Challenge {
    id: number;
    title: string;
    description: string;
    difficulty: Difficulty;
}

export interface Answers {
    mood: string;
    headState: string;
    energy: string;
    screenTime: string;
    phoneFeeling: string[];
    phoneImpulse: string;
    lastNature: string;
    natureConnection: string;
    readiness: string;
    difficultyPreference: string;
    priority: string;
}

export interface GeneratedResult {
    challenges: Challenge[];
}

// ---------------------
// Challenge Pool
// ---------------------

const allChallenges: Challenge[] = [
    {
        id: 1,
        title: "Заземяване „Ресет“",
        description: "3 минути бавно дишане + назови 5 неща, които виждаш около себе си.",
        difficulty: "easy",
    },
    {
        id: 2,
        title: "Емоционален синхрон",
        description: "Напиши 2–3 изречения за това как се чувстваш и защо.",
        difficulty: "easy",
    },
    {
        id: 3,
        title: "Слънчев заряд",
        description: "Излез за 1–2 мин на естествена светлина и направи снимка.",
        difficulty: "easy",
    },
    {
        id: 4,
        title: "Хранене без телефон",
        description: "Изяж едно хранене или изпий напитка без да докосваш телефона.",
        difficulty: "medium",
    },
    {
        id: 5,
        title: "30-мин Дигитален детокс",
        description: "30 минути без телефон. Пусни таймер.",
        difficulty: "medium",
    },
    {
        id: 6,
        title: "Спокойна стъпка",
        description: "2–4 мин mindful разходка + снимка на нещо, което ти направи впечатление.",
        difficulty: "medium",
    },
    {
        id: 7,
        title: "Мини организация",
        description: "Подреди малка зона за 5 мин (бюро, рафт, чанта).",
        difficulty: "medium",
    },
    {
        id: 8,
        title: "Природна контролна точка",
        description: "Кратка разходка навън + снимка на пейзаж/дърво.",
        difficulty: "hard",
    },
    {
        id: 9,
        title: "Балон на фокуса",
        description: "10–15 мин дълбока работа + снимка на резултата.",
        difficulty: "hard",
    },
    {
        id: 10,
        title: "Капка доброта",
        description:
            "Изпрати съобщение: благодарност, извинение или подкрепа към някого.",
        difficulty: "hard",
    },
];

// Helper: filter challenges by difficulty
function byDifficulty(level: Difficulty): Challenge[] {
    return allChallenges.filter((c) => c.difficulty === level);
}

// ---------------------
// Main Generator Logic
// ---------------------

export function generateDailyChallenges(answers: Answers): GeneratedResult {
    const picked: Challenge[] = [];

    // 1. Mood / energy → ако човекът е изтощен → даваме по-леки
    if (
        answers.energy === "Ниска" ||
        answers.energy === "Много ниска" ||
        answers.mood === "Емоционално изтощен"
    ) {
        picked.push(...byDifficulty("easy").slice(0, 2));
    }

    // 2. Висока енергия + готовност → по-трудни
    if (
        answers.energy === "Висока" &&
        answers.readiness === "Напълно мотивиран"
    ) {
        picked.push(...byDifficulty("hard").slice(0, 2));
    }

    // 3. Телефонна зависимост → даваме детокс / фокус
    if (
        answers.screenTime === "5–7 часа" ||
        answers.screenTime === "Над 7"
    ) {
        picked.push(byDifficulty("medium")[1]); // дигитален детокс
    }

    // 4. Природа → ако не е бил навън > седмица
    if (answers.lastNature === "Повече от седмица") {
        picked.push(byDifficulty("medium")[2]); // mindful walk
    }

    // 5. Difficulty preference
    if (answers.difficultyPreference === "Лесен") {
        picked.push(...byDifficulty("easy").slice(0, 1));
    } else if (answers.difficultyPreference === "Среден") {
        picked.push(...byDifficulty("medium").slice(0, 1));
    } else if (answers.difficultyPreference === "Предизвикателен") {
        picked.push(...byDifficulty("hard").slice(0, 1));
    }

    // Remove duplicates
    const unique = Array.from(new Map(picked.map(c => [c.id, c])).values());

    // Limit to 3 daily challenges
    const final = unique.slice(0, 3);

    return { challenges: final };
}
