import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// Temporarily remove framer-motion to avoid hook issues
// We'll use plain SVG + CSS transform for rotation


const API_BASE = "http://localhost:5174";

type Challenge = {
  title: string;
  description?: string;
  tags?: string[];
};

type Prize = Challenge | null;

type HistoryItem = {
  time: string;
  challenge: Challenge;
};

const styles = {
  wheelFrame: {
    width: "360px",
  height: "360px",
  aspectRatio: "1 / 1",
  borderRadius: "50%",
  background: "#fff",
  boxShadow: "0 0 20px rgba(0,0,0,0.1)",
  overflow: "hidden",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",             // ← keeps pointer clean
  } as React.CSSProperties,
  appRoot: {
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#06301a",
    background: "#fafbfa",
    minHeight: "100vh",
  } as React.CSSProperties,
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "20px",
  } as React.CSSProperties,
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
  } as React.CSSProperties,
  subtitle: {
    margin: "4px 0 0",
    color: "#4d6b56",
    fontSize: "14px",
  } as React.CSSProperties,
  headerControls: {
    display: "flex",
    gap: "8px",
  } as React.CSSProperties,
  ghostBtn: {
    background: "transparent",
    border: "1px solid rgba(6,48,24,0.06)",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "inherit",
    color: "inherit",
    fontSize: "14px",
  } as React.CSSProperties,
  mainGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 420px",
  gap: "40px",
  alignItems: "start",
},

  wheelCard: {
  background: "transparent",
  padding: 0,
  borderRadius: 0,
  boxShadow: "none",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
},
  wheelStage: {
     display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "20px",
  } as React.CSSProperties,
  pointer: {
    position: "absolute",
    left: "50%",
    top: "8px",
    transform: "translateX(-50%)",
    pointerEvents: "none",
  } as React.CSSProperties,
  wheelActions: {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  alignItems: "center",
},
  primaryBtn: {
    padding: "12px 18px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(180deg, #0b5f30, #2a8a52)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  } as React.CSSProperties,
  legend: {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  alignItems: "center",
},
  legendItem: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    fontSize: "13px",
  } as React.CSSProperties,
  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "linear-gradient(180deg, #dff2e2, #bfe8cc)",
  } as React.CSSProperties,
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  } as React.CSSProperties,
  panelBlock: {
    background: "#fff",
    padding: "12px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  } as React.CSSProperties,
  card: {
    padding: "10px",
    borderRadius: "8px",
    background: "linear-gradient(180deg, #fbfff8, #f0fff1)",
    marginTop: "8px",
  } as React.CSSProperties,
  cardActions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  } as React.CSSProperties,
  tertiary: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
  } as React.CSSProperties,
  menuToggle: {
    display: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '10px',
  } as React.CSSProperties,

  desktopNav: {
  display: 'flex',
  gap: '10px',
  padding: '12px 16px',
  marginBottom: '24px',
  background: 'transparent',
  borderRadius: '12px',
  alignItems: 'center',
} as React.CSSProperties,
  navLinkDesktop: {
  backgroundColor: '#ffffff',
  color: '#1f2937',
  border: '1px solid #e5e7eb',
  padding: '8px 14px',
  cursor: 'pointer',
  fontSize: '14px',
  borderRadius: '999px',
  transition: 'all 0.2s ease',
} as React.CSSProperties,
  mobileMenu: {
    backgroundColor: '#2a8a52',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    gap: '5px',
    marginBottom: '10px',
  } as React.CSSProperties,
  navLink: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: 'none',
    padding: '10px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
    textAlign: 'left',
  } as React.CSSProperties,
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "16px 0",
    borderTop: "1px solid rgba(6,48,24,0.06)",
    color: "#6b7b6b",
    fontSize: "13px",
  } as React.CSSProperties,
};



export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [prize, setPrize] = useState<Prize>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  useEffect(() => {
    fetch(`${API_BASE}/challenges`)
    .then((r) => r.json())
    .then((data: Challenge[]) => setChallenges(data))
    .catch(() => setChallenges(localFallback));
  }, []);

  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

  const spin = async () => {
    if (isSpinning || challenges.length === 0) return;
    setIsSpinning(true);

    let index = Math.floor(Math.random() * challenges.length);

    try {
      const resp = await fetch(`${API_BASE}/spin`, { method: "POST" });
      const data = (await resp.json()) as { index?: number };
      if (typeof data?.index === "number") index = data.index % challenges.length;
    } catch {}

    const sector = 360 / challenges.length;
    const chosenSectorCenter = index * sector + sector / 2;
    const rounds = 4 + Math.floor(Math.random() * 3);
    const target =
    rounds * 360 +
    (360 - chosenSectorCenter) +
    (Math.random() * (sector / 4) - sector / 8);

    const start = performance.now();
    const startAngle = angle;
    const delta = target - startAngle;
    const duration = 5200 + Math.random() * 1800;

    const frame = (t: number) => {
      const elapsed = t - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      setAngle(startAngle + delta * eased);
      if (progress < 1) requestAnimationFrame(frame);
      else {
        setIsSpinning(false);
        setPrize(challenges[index]);
        setHistory((h) => [
          { time: new Date().toISOString(), challenge: challenges[index] },
                   ...h,
        ]);
      }
    };

    requestAnimationFrame(frame);
  };

  const markDone = async (c: Challenge) => {
    setCompleted((prev) => (prev.includes(c.title) ? prev : [...prev, c.title]));
    try {
      await fetch(`${API_BASE}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: c.title }),
      });
    } catch {}
  };

  const resetCompleted = () => setCompleted([]);

  const renderSegments = (items: Challenge[]) => {
    const n = items.length;
    if (n === 0) return null;
    const sector = (2 * Math.PI) / n;
    const radius = 180;
    return items.map((item, i) => {
      const startAngle = i * sector;
      const endAngle = startAngle + sector;
      const large = sector > Math.PI ? 1 : 0;
      const x1 = 100 + radius * Math.cos(startAngle);
      const y1 = 100 + radius * Math.sin(startAngle);
      const x2 = 100 + radius * Math.cos(endAngle);
      const y2 = 100 + radius * Math.sin(endAngle);
      const color = segmentColor(i, n);
      const d = `M100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
      const midAngle = startAngle + sector / 2;
      const labelX = 100 + (radius - 55) * Math.cos(midAngle);
      const labelY = 100 + (radius - 55) * Math.sin(midAngle);
      const rotate = (midAngle * 180) / Math.PI;
      const textRotate = rotate > 90 && rotate < 270 ? rotate + 180 : rotate;
      const textAnchor = rotate > 90 && rotate < 270 ? "end" : "start";

      return (
        <g key={i}>
        <path d={d} fill={color} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <g transform={`translate(${labelX},${labelY}) rotate(${textRotate})`}>
        <text
        x="0"
        y="0"
        fontSize="9"
        fill="#083218"
        textAnchor={textAnchor}
        style={{ fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}
        >
        {shorten(item.title, 30)}
        </text>
        </g>
        </g>
      );
    });
  };

  const renderedSegments = renderSegments(
    challenges.length ? challenges : localFallback
  );

  return (
    <div style={styles.appRoot}>
    <div style={styles.container}>

    {menuOpen && (
    <nav style={styles.mobileMenu}>
      <button onClick={() => handleNavigation('/dashboard')} style={styles.navLink}>Начална страница</button>
      <button onClick={() => handleNavigation('/challenges')} style={styles.navLink}>Колело на предизвикателствата</button>
     
      <button onClick={() => handleNavigation('/health-check')} style={styles.navLink}>Въпросници</button>
      <button onClick={() => handleNavigation('/your-goals')} style={styles.navLink}>Лични цели</button>
    </nav>
    )}

    <div style={styles.desktopNav}>
      <button onClick={() => handleNavigation('/dashboard')} style={styles.navLinkDesktop}>Начална страница</button>
      <button onClick={() => handleNavigation('/challenges')} style={styles.navLinkDesktop}>Колело на предизвикателствата</button>
      <button onClick={() => handleNavigation('/health-check')} style={styles.navLinkDesktop}>Въпросници</button>
      <button onClick={() => handleNavigation('/your-goals')} style={styles.navLinkDesktop}>Лични цели</button>
    </div>

    <header style={styles.header}>
    <div>
    <h1 style={styles.title}>Колелото на предизвикателствата</h1>
    <p style={styles.subtitle}>
    Завърти колелото и поеми ново предизвикателство за устойчив начин на живот!
    </p>
    </div>
    <div style={styles.headerControls}>
    <button style={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>☰ Menu</button>
    <button
    style={styles.ghostBtn}
    onClick={() => {
      setHistory([]);
      setPrize(null);
    }}
    >
    Рестартирай историята
    </button>
    <button style={styles.ghostBtn} onClick={resetCompleted}>
    Изтрий завършените
    </button>
    </div>
    </header>

    <main style={styles.mainGrid}>
    <section style={styles.wheelCard}>
    <div style={styles.wheelStage}>
    <div style={{ ...styles.wheelFrame, position: "relative" }} ref={wheelRef}>
     <svg
  viewBox="0 0 200 200"
  preserveAspectRatio="xMidYMid meet"
  style={{
    width: "100%",
    height: "100%",
    display: "block",
    transform: `rotate(${angle}deg)`,
  }}
    >
    <defs>
    <radialGradient id="rim" cx="50%" cy="50%" r="80%">
    <stop offset="0%" stopColor="#f7fff8" stopOpacity="0.2" />
    <stop offset="100%" stopColor="#cfe9d7" stopOpacity="0.06" />
    </radialGradient>

    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow
    dx="0"
    dy="6"
    stdDeviation="12"
    floodColor="#04260f"
    floodOpacity="0.06"
    />
    </filter>

    <pattern id="leafPattern" width="40" height="40" patternUnits="userSpaceOnUse">
    <rect width="40" height="40" fill="transparent" />
    <path d="M8 24c6-6 16-6 22 0" stroke="rgba(0,0,0,0.04)" strokeWidth="1" fill="none" />
    <path
    d="M24 8c-6 6-6 16 0 22"
    stroke="rgba(0,0,0,0.04)"
    strokeWidth="1"
    fill="none"
    transform="rotate(180 20 20)"
    />
    </pattern>
    </defs>

    <circle cx="100" cy="100" r="98" fill="url(#rim)" stroke="#0f3b22" strokeWidth="2" />

    <circle cx="100" cy="100" r="85" fill="url(#leafPattern)" opacity="0.14" />

    {renderedSegments}

    <g>
    <circle
    cx="100"
    cy="100"
    r="40"
    fill="#f7fff8"
    stroke="#08200f"
    strokeWidth="1.5"
    filter="url(#soft)"
    />
    <text x="100" y="102" fontSize="12" textAnchor="middle" fill="#083218" style={{ fontWeight: 700 }}>
    ЗАВЪРТИ 
    </text>
    </g>
    </svg>

    <div style={styles.pointer}>
    <svg width="44" height="44" viewBox="0 0 24 24">
    <defs>
    <linearGradient id="ptr" x1="0" x2="1">
    <stop offset="0%" stopColor="#d9f7e0" />
    <stop offset="100%" stopColor="#0b5f30" />
    </linearGradient>
    </defs>
    <path
    d="M12 2 L18 14 L12 11 L6 14 Z"
    fill="url(#ptr)"
    stroke="#063214"
    strokeWidth="0.6"
    />
    </svg>
    </div>
    </div>
    </div>

    <div style={styles.wheelActions}>
    <button
    style={styles.primaryBtn}
    onClick={spin}
    disabled={isSpinning || challenges.length === 0}
    >
    {isSpinning ? "Въртене..." : "Завърти колелото"}
    </button>

    <div style={styles.legend}>
    <div style={styles.legendItem}>
    <div style={styles.dot} /> <span>Екологични</span>
    </div>
    <div style={styles.legendItem}>
    <div
    style={{
      ...styles.dot,
      background: "linear-gradient(180deg, #efe6dd, #d9cbb7)",
    }}
    />{" "}
    <span>Дигитален детокс</span>
    </div>
    <div style={styles.legendItem}>
    <div
    style={{
      ...styles.dot,
      background: "linear-gradient(180deg, #dff7f0, #bfeee1)",
    }}
    />{" "}
    <span>Социални</span>
    </div>
    </div>
    </div>
    

    <div style={styles.panel}>
    <div style={styles.panelBlock}>
    <h3 style={{ margin: 0, marginBottom: 8 }}>Твоето предизвикателство</h3>
    {prize ? (
      <div style={{ ...styles.card, transition: 'opacity 200ms, transform 200ms', opacity: 1, transform: 'translateY(0px)'}}>
        <h4 style={{ margin: 0, marginBottom: 4 }}>{prize.title}</h4>
        <p style={{ margin: 0, marginBottom: 8, color: "#4d6b56", fontSize: 13 }}>
          {prize.description}
        </p>
        <div style={styles.cardActions}>
          <button style={styles.tertiary} onClick={() => markDone(prize)}>
            Маркирай като завършено
          </button>
          <button
            style={{
              ...styles.tertiary,
              background: "transparent",
              border: "1px solid rgba(6,48,24,0.06)",
              color: "inherit",
            }}
            onClick={() => setPrize(null)}
          >
            Скрий
          </button>
        </div>
      </div>
    ) : (
      <div style={{ marginTop: 8, color: "#6b7b6b" }}>Завърти колелото!</div>
    )}
    </div>

    <div style={styles.panelBlock}>
    <h3 style={{ margin: 0, marginBottom: 8 }}>Изпълнени ({completed.length})</h3>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {completed.length === 0 ? (
      <div style={{ color: "#6b7b6b" }}>Няма предишни предизвикателства - опитай колелото!</div>
    ) : (
      completed.map((t, i) => (
        <div key={i} style={{ background: "#e6f6ea", padding: "6px 10px", borderRadius: 999, fontSize: 12 }}>
        {t}
        </div>
      ))
    )}
    </div>
    </div>

    <div style={styles.panelBlock}>
    <h3 style={{ margin: 0, marginBottom: 8 }}>История</h3>
    <div>
    {history.length === 0 ? (
      <div style={{ color: "#6b7b6b" }}>Няма история - завърти колелото, за да започнеш.</div>
    ) : (
      history.map((h, i) => (
        <div
        key={i}
        style={{
          padding: 8,
          borderBottom:
          i === history.length - 1 ? "none" : "1px solid rgba(6,48,24,0.04)",
        }}
        >
        <strong style={{ fontSize: 13 }}>{h.challenge.title}</strong>
        <div style={{ color: "#6b7b6b", fontSize: 11, marginTop: 2 }}>
        {new Date(h.time).toLocaleString()}
        </div>
        </div>
      ))
    )}
    </div>
    </div>

    <div style={{ fontSize: 12, color: "#6b7b6b" }}>
   Съвет: адаптирайте всяко предизвикателство към вашия комфорт и местните правила.
    </div>
    </div>
    </section>
    </main>
    </div>
    </div>
  );
}

function shorten(text: string, n = 28): string {
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}

function segmentColor(i: number, n: number): string {
  const palette = [
    "#E6F6EA",
    "#DFF2E2",
    "#CFE9D7",
    "#BDE1C9",
    "#9FCFAD",
    "#7FB892",
    "#6BA474",
    "#5B8B5E",
    "#4A6E48",
    "#3B5838",
  ];
  return palette[i % palette.length];
}

const localFallback: Challenge[] = [
  { title: "24-часов дигитален залез", description: "Без екрани от залез до изгрев; напиши кратка рефлексия." },
{ title: "Одит на отпадъците + замяна", description: "Категоризирай домашните отпадъци за 48 ч. и замени един еднократен предмет." },
{ title: "Разходка и слушане", description: "90-минутна разходка без навигация от телефона; отбележи 10 растения/животни." },
{ title: "Ден без оплаквания", description: "Преформулирай оплакванията в конструктивни действия за един ден." },
{ title: "Проект за ремонт", description: "Поправи счупен предмет или го рециклирай отговорно." },
{ title: "Дай 1 час на зелена група", description: "Доброволствай един час в местна екологична група." },
{ title: "Пост от социални мрежи", description: "Направи 72 ч. пауза от една социална платформа и напиши писмо на ръка до приятел." },
{ title: "Научи на умение", description: "Научи някого на практическо зелено умение (компостиране, ремонт)." },
{ title: "Готвене с една съставка", description: "Сготви ястие само с местни сезонни продукти." },
{ title: "Дълбок разговор", description: "30-минутен разговор без разсейване с човек, на който държиш." },
{ title: "24 часа без пластмаса", description: "Избягвай еднократните пластмаси за един пълен ден." },
{ title: "Осъзнати сутрини", description: "10 минути осъзнатост всяка сутрин за 7 дни." },
{ title: "Режим за по-добър сън", description: "Създай си режим за сън за 7 нощи; без екрани 1 час преди лягане." },
{ title: "Общностна размяна", description: "Организирай или се включи в размяна на дрехи/инструменти/книги." },
{ title: "Обяд без отпадък x3", description: "Приготви обяди без отпадък за три дни." },
{ title: "Разговор с непознат", description: "Води уважителен 10–15 минутен разговор с нов човек." },
{ title: "30-дневна нишка на благодарност", description: "Пиши по една бележка на благодарност всеки ден за 30 дни." },
{ title: "Засади малко местообитание", description: "Създай сандъче за опрашители и наблюдавай една седмица." },
{ title: "Енергиен одит", description: "Оцени големите енергоразходи и приложи 3 намаления." },
{ title: "Пресъздаване на остатъци", description: "Превърни остатъците от храна в ново креативно ястие." },
{ title: "Труден разговор", description: "Планирай и проведи спокоен разговор, който отлагаш." },
{ title: "Обещание за обществен транспорт", description: "Ползвай транспорт/колело/ходене два последователни дни." },
{ title: "Ден на локалната икономика", description: "Купувай само местно произведени стоки за един ден." },
{ title: "Микропроект за природата", description: "Засей местни семена или направи хотел за пчели." },
{ title: "Блокирано приложение за една седмица", description: "Блокирай пристрастяващо приложение за една седмица." },
{ title: "Кратък разказ от парка", description: "90 минути навън, после напиши 500-думов разказ." },
{ title: "Предизвикателство за ъпсайклинг", description: "Превърни стар предмет в нещо ново за подарък." },
{ title: "Нощ на осъзнатото слушане", description: "Проведи 1-часова сесия за осъзнато слушане с приятел." },
{ title: "Ремонтно кафене", description: "Посети или организирай събитие за ремонт." },
{ title: "Минималист за един ден", description: "Живей само с 20 предмета за един ден." },
{ title: "Творчески спринт без екрани", description: "2 часа творчество без никакви екрани." },
{ title: "Еко-адвокационно писмо", description: "Изпрати кратко писмо с аргументи до местен представител." },
{ title: "Одит на приятелството", description: "Избери едно приятелство, в което да инвестираш този месец." },

];