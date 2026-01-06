import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: 20 } as React.CSSProperties,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as React.CSSProperties,
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 } as React.CSSProperties,
  menuToggle: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 } as React.CSSProperties,
  mobileMenu: { backgroundColor: '#213a51ff', display: 'flex', flexDirection: 'column', padding: 10, gap: 6, marginBottom: 10 } as React.CSSProperties,
  desktopNav: { display: 'flex', gap: 8, marginBottom: 12 } as React.CSSProperties,
  navLink: { backgroundColor: 'transparent', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', textAlign: 'left' } as React.CSSProperties,
  navLinkDesktop: { backgroundColor: 'transparent', border: '1px solid #e6e6e6', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' } as React.CSSProperties,
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




    const isFormComplete = React.useMemo(() => {
  return Object.values(answers).every((value) => {
    if (Array.isArray(value)) {
      return value.length > 0; // за multi-select
    }
    return value !== ""; // за string полета
  });
}, [answers]);

  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const handleNavigation = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

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
    // Request popup: set session flag and navigate with state (fallbacks handled in Dashboard)
    try {
      console.debug('DailyQuestionnaire: submitting, answers=', answers)
      sessionStorage.setItem('showChallengePopup', '1')
      console.debug('DailyQuestionnaire: sessionStorage set showChallengePopup')
    } catch (e) {
      console.warn('DailyQuestionnaire: sessionStorage set failed', e)
    }
    console.debug('DailyQuestionnaire: navigating to /dashboard with state')
    navigate('/dashboard', { state: { showChallengePopup: true } });
  }

  


  return (
    <div style={styles.container}>
      <header style={{ ...styles.header, position: 'sticky', top: 0, zIndex: 1000, flexDirection: 'column', alignItems: 'flex-start', gap: 12, padding: '16px', backgroundColor: '#ffffff', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.08)', marginBottom: 24 }}>
        <div style={styles.headerLeft}>
          <h2>Въпросник</h2>
         {/* <button style={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>☰ Menu</button> */}
        </div>

        {/* Desktop navigation visually separated above the questionnaire */}
        <div style={{ ...styles.desktopNav, width: '100%', display: 'flex', justifyContent: 'flex-start', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e6eef2', gap: 12 }}>
          <button onClick={() => handleNavigation('/dashboard')} style={styles.navLinkDesktop}>Начална страница</button>
          <button onClick={() => handleNavigation('/challenges')} style={styles.navLinkDesktop}>Колело на предизвикателствата</button>
          <button onClick={() => handleNavigation('/health-check')} style={styles.navLinkDesktop}>Въпросник</button>
          <button onClick={() => handleNavigation('/your-goals')} style={styles.navLinkDesktop}>Лични цели</button>
        </div>
      </header>

      {menuOpen && (
        <nav style={styles.mobileMenu}>
          <button onClick={() => handleNavigation('/dashboard')} style={styles.navLink}>Начална страница</button>
          <button onClick={() => handleNavigation('/challenges')} style={styles.navLink}>Колело на предизвикателствата</button>
          <button onClick={() => handleNavigation('/health-check')} style={styles.navLink}>Въпросник</button>
          <button onClick={() => handleNavigation('/your-goals')} style={styles.navLink}>Лични цели</button>
        </nav>
      )}

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

       <button
  type="submit"
  disabled={!isFormComplete}
  style={{
    marginTop: 20,
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: isFormComplete ? '#2563eb' : '#cbd5e1',
    color: 'white',
    fontWeight: 600,
    cursor: isFormComplete ? 'pointer' : 'not-allowed',
    opacity: isFormComplete ? 1 : 0.6,
    }}
    >
    Получи моите предизвикателства
</button>

  {!isFormComplete && (
  <p style={{ marginTop: 8, color: '#64748b' }}>
    Моля, отговори на всички въпроси
  </p>
  )}

      </form>
    </div>
  );
}