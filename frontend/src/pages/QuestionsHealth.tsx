import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

type Badge = {
  id: number
  name: string
  xpRequired: number
  imagePath: string
  unlocked: boolean
}

const getScreenTimePoints = (hours: number) => {
  if (hours <= 1) return 10
  if (hours <= 3) return 8
  if (hours <= 5) return 5
  if (hours <= 7) return 2
  return 0
}

export default function QuestionsHealth() {
  const [responses, setResponses] = useState<Record<number, string>>({})
  const [screenTime, setScreenTime] = useState<number>(0)
  const [submitted, setSubmitted] = useState(false)
  const [badges, setBadges] = useState<Badge[]>([])
  const [userXp, setUserXp] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const handleNavigation = (path: string) => { navigate(path); setMenuOpen(false) }

  // Load user XP and initialize badges on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || ''
        const userId = localStorage.getItem('authToken') || ''

        const res = await fetch(`${apiBase}/api/me`, {
          headers: { user_id: userId },
        })

        if (res.ok) {
          const user = await res.json()
          const currentXp = user.points || 0
          setUserXp(currentXp)

          // Badge images from assets folder
          const badgeImages = [
            '/src/assets/1.jpg',
            '/src/assets/2.jpg',
            '/src/assets/3.jpg',
            '/src/assets/4.jpg',
            '/src/assets/5.png',
            '/src/assets/6.png',
            '/src/assets/7.jpg',
            '/src/assets/8.jpg',
            '/src/assets/9.jpg',
            '/src/assets/10.png',
            '/src/assets/11.jpg',
            '/src/assets/12.png',
            '/src/assets/thirteen.png',
            '/src/assets/14.png',
            '/src/assets/15.png',
            '/src/assets/16.png',
            '/src/assets/17.png',
            '/src/assets/18.png',
          ]

                  
          const totalBadges = Math.ceil(currentXp / 50) + 3 
          const badgeList: Badge[] = Array.from({ length: totalBadges }, (_, i) => ({
            id: i,
            name: `Badge ${i + 1}`,
            xpRequired: (i + 1) * 50,
            imagePath: badgeImages[i % badgeImages.length], 
            unlocked: currentXp >= (i + 1) * 50,
          }))

          setBadges(badgeList)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])

  const questions = [
    {
      id: 1,
      question: '1. Как би описал вътрешното си състояние тази сутрин?',
      options: ['Спокоен и уравновесен', 'Леко напрегнат', 'Раздразнен/претоварен', 'Тревожен', 'Емоционално изтощен'],
    },
    {
      id: 2,
      question: '2. Мислиш ли спокойно или се чувстваш претоварен с мисли?',
      options: ['Ясно и фокусирано', 'Малко хаотично', 'Много хаотично', 'Усещам „ментален шум"'],
    },
    {
      id: 3,
      question: '3. Как би оценил енергията си?',
      options: ['Висока', 'Средна', 'Ниска', 'Много ниска'],
    },
    {
      id: 4,
      question: '4. Колко време реално прекара на телефона вчера?',
      options: ['Под 1 час', '1–3 часа', '3–5 часа', '5–7 часа', 'Над 7 часа'],
    },
    {
      id: 5,
      question: '5. Какво усещане ти носеше използването на телефона вчера?',
      options: ['Удоволствие', 'Бягство от стрес', 'Автоматичен навик', 'Отегчение', 'Негативни емоции'],
    },
    {
      id: 6,
      question: '6. Има ли сегашна ситуация или емоция, която те кара да посягаш към телефона по-често днес?',
      options: ['Да, стрес', 'Да, скука', 'Да, липса на мотивация', 'Да, тревожност', 'Не, днес се чувствам стабилен'],
    },
    {
      id: 7,
      question: '7. Кога последно прекара време навън в природата?',
      options: ['Днес', 'Вчера', 'Няколко дни', 'Повече от седмица'],
    },
    {
      id: 8,
      question: '8. Как оценяваш връзката си с природата днес?',
      options: ['Силна — чувствам се свързан', 'Средна', 'Слаба', 'Почти никаква'],
    },
    {
      id: 9,
      question: '9. До каква степен си готов да отделиш време за себе си днес?',
      options: ['Напълно мотивиран', 'Умерено мотивиран', 'Почти нямам сили', 'Искам да опитам, но съм изтощен'],
    },
    {
      id: 10,
      question: '10. Кое би ти донесло най-много полза в момента?',
      options: ['Намаляване на телефона', 'Подобряване на емоционалното състояние', 'Работа върху фокус и продуктивност', 'Контакт с природата', 'Малки навици за спокойствие'],
    },
    
  {
    "id": 11,
    "question": "Как се чувстваш емоционално в този момент?",
    "options": ["Спокоен", "Леко напрегнат", "Раздразнен", "Претоварен"]
  },
  {
    "id": 12,
    "question": "Имаш ли усещане за вътрешен баланс днес?",
    "options": ["Да, напълно", "По-скоро да", "По-скоро не", "Изобщо не"]
  },
  {
    "id": 13,
    "question": "Как реагира тялото ти на стрес днес?",
    "options": ["Отпуснато", "Леко напрегнато", "Силно напрегнато", "Изтощено"]
  },
  {
    "id": 14,
    "question": "Колко силен е вътрешният ти натиск днес?",
    "options": ["Няма", "Слаб", "Умерен", "Силен"]
  },
  {
    "id": 15,
    "question": "Колко често изпитваш тревожни мисли днес?",
    "options": ["Никога", "Понякога", "Често", "Почти постоянно"]
  },
  {
    "id": 16,
    "question": "Как се чувства тялото ти в момента?",
    "options": ["Свежо", "Нормално", "Уморено", "Много уморено"]
  },
  {
    "id": 17,
    "question": "Имаш ли желание за движение днес?",
    "options": ["Да, силно", "Да, малко", "По-скоро не", "Не"]
  },
  {
    "id": 18,
    "question": "Как би оценил съня си последната нощ?",
    "options": ["Много добър", "Добър", "Лош", "Много лош"]
  },
  {
    "id": 19,
    "question": "Усещаш ли тежест в тялото си?",
    "options": ["Не", "Лека", "Умерена", "Силна"]
  },
  {
    "id": 20,
    "question": "Каква е общата ти енергия днес?",
    "options": ["Висока", "Средна", "Ниска", "Много ниска"]
  },
  {
    "id": 21,
    "question": "Колко автоматично посягаш към телефона днес?",
    "options": ["Почти не", "Понякога", "Често", "Постоянно"]
  },
  {
    "id": 22,
    "question": "Как се чувстваш след използване на телефона?",
    "options": ["Спокоен", "Неутрален", "Изтощен", "Раздразнен"]
  },
  {
    "id": 23,
    "question": "Какво най-често търсиш в телефона си?",
    "options": ["Информация", "Разсейване", "Успокоение", "Навик"]
  },
  {
    "id": 24,
    "question": "Колко контрол имаш върху времето си онлайн?",
    "options": ["Пълен", "Частичен", "Малък", "Никакъв"]
  },
  {
    "id": 25,
    "question": "Усещаш ли вина след дълго скролване?",
    "options": ["Не", "Понякога", "Често", "Почти винаги"]
  },
  {
    "id": 26,
    "question": "Колко лесно се концентрираш днес?",
    "options": ["Много лесно", "Донякъде", "Трудно", "Почти невъзможно"]
  },
  {
    "id": 27,
    "question": "Какво е състоянието на мислите ти?",
    "options": ["Ясни", "Малко разпръснати", "Хаотични", "Претоварващи"]
  },
  {
    "id": 28,
    "question": "Колко често се разсейваш?",
    "options": ["Рядко", "Понякога", "Често", "Постоянно"]
  },
  {
    "id": 29,
    "question": "Чувстваш ли се продуктивен днес?",
    "options": ["Да", "Донякъде", "По-скоро не", "Не"]
  },
  {
    "id": 30,
    "question": "Усещаш ли ментална умора?",
    "options": ["Не", "Лека", "Средна", "Силна"]
  },
  {
    "id": 31,
    "question": "Имаш ли нужда от контакт с природата днес?",
    "options": ["Да, много", "Да", "Малко", "Не"]
  },
  {
    "id": 32,
    "question": "Как ти влияе времето навън?",
    "options": ["Много положително", "Положително", "Слабо", "Никак"]
  },
  {
    "id": 33,
    "question": "Чувстваш ли се заземен днес?",
    "options": ["Да", "Частично", "Малко", "Не"]
  },
  {
    "id": 34,
    "question": "Колко време мина от последния ти престой навън?",
    "options": ["Днес", "Вчера", "Преди няколко дни", "Повече от седмица"]
  },
  {
    "id": 35,
    "question": "Отдели ли време за себе си днес?",
    "options": ["Да", "Малко", "Почти не", "Не"]
  },
  {
    "id": 36,
    "question": "Колко си мотивиран да се погрижиш за себе си?",
    "options": ["Много", "Умерено", "Слабо", "Изобщо не"]
  },
  {
    "id": 37,
    "question": "Какво ти липсва най-много в момента?",
    "options": ["Почивка", "Яснота", "Подкрепа", "Спокойствие"]
  },
  {
    "id": 38,
    "question": "Колко свързан се чувстваш със себе си?",
    "options": ["Много", "Средно", "Малко", "Изобщо не"]
  },
  {
    "id": 39,
    "question": "Имаш ли нужда от пауза сега?",
    "options": ["Да, спешно", "Да", "Малко", "Не"]
  },
  {
    "id": 40,
    "question": "Колко осъзнато минава денят ти?",
    "options": ["Много", "Средно", "Малко", "Автоматично"]
  },
  {
    "id": 41,
    "question": "Имаш ли усещане, че си „на автопилот“?",
    "options": ["Не", "Понякога", "Често", "Почти постоянно"]
  },
  {
    "id": 42,
    "question": "Как реагираш на вътрешен дискомфорт?",
    "options": ["Осъзнавам го", "Разсейвам се", "Игнорирам го", "Потискам го"]
  },
  {
    "id": 43,
    "question": "Колко често правиш паузи през деня?",
    "options": ["Често", "Понякога", "Рядко", "Никога"]
  },
  {
    "id": 44,
    "question": "Имаш ли ритуал за успокояване?",
    "options": ["Да", "Понякога", "Не", "Искам да имам"]
  },
  {
    "id": 45,
    "question": "Каква е мотивацията ти днес?",
    "options": ["Висока", "Средна", "Ниска", "Изчерпана"]
  },
  {
    "id": 46,
    "question": "Имаш ли ясно намерение за деня?",
    "options": ["Да", "Частично", "Не", "Още не"]
  },
  {
    "id": 47,
    "question": "Как се отнасяш към себе си днес?",
    "options": ["С грижа", "Неутрално", "Критично", "Пренебрегващо"]
  },
  {
    "id": 48,
    "question": "Чувстваш ли вътрешна стабилност?",
    "options": ["Да", "Донякъде", "Малко", "Не"]
  },
  {
    "id": 49,
    "question": "Какво би подобрило деня ти най-много?",
    "options": ["Почивка", "Движение", "Тишина", "Яснота"]
  },
  {
    "id": 50,
    "question": "Как се чувстваш като цяло в този момент?",
    "options": ["Добре", "Относително добре", "Зле", "Много зле"]
  }
]

  
  const QUESTIONS_PER_DAY = 10
  const getDailyQuestions = () => {
    const days = Math.floor(Date.now() / 86400000)
    const start = (days * QUESTIONS_PER_DAY) % questions.length
    if (start + QUESTIONS_PER_DAY <= questions.length) {
      return questions.slice(start, start + QUESTIONS_PER_DAY)
    }
    const first = questions.slice(start)
    const remaining = QUESTIONS_PER_DAY - first.length
    return [...first, ...questions.slice(0, remaining)]
  }

  const dailyQuestions = getDailyQuestions()

  const handleResponseChange = (questionId: number, option: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

   const allQuestionsAnswered = useMemo(() => {
    return dailyQuestions.every(
      (q) => responses[q.id] !== undefined && responses[q.id] !== ''
    )
  }, [responses, dailyQuestions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
     if (!allQuestionsAnswered) {
      alert('Моля, отговори на всички въпроси')
      return
    }
    try {
      let totalPoints = 0
      for (const q of dailyQuestions) {
        const ans = responses[q.id]
        if (!ans) continue
        const idx = q.options.findIndex((o) => o === ans)
        if (idx >= 0) totalPoints += (idx + 1)
      }

    
      const screenTimePoints = getScreenTimePoints(screenTime)
      totalPoints += screenTimePoints

      const apiBase = import.meta.env.VITE_API_URL || ''
      const userId = localStorage.getItem('authToken') || ''

      const res = await fetch(`${apiBase}/api/send_form_points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          user_id: userId,
        },
        body: JSON.stringify(totalPoints),
      })

      if (!res.ok) {
        console.error('Failed to send points to backend')
        return
      }

      const chall = await fetch(`${apiBase}/challange/receive`, {
        method: 'GET',
        headers: { user_id: userId },
      })

      if (chall.ok) {
        const quest = await chall.json()
        console.log('Assigned quest:', quest)

        setSubmitted(true)
        try { sessionStorage.setItem('showChallengePopup', '1'); console.debug('QuestionsHealth: set showChallengePopup in sessionStorage') } catch (e) { }
        setTimeout(() => {
          setResponses({})
          setScreenTime(0)
          setSubmitted(false)
          navigate('/dashboard', { state: { showChallengePopup: true } })
        }, 800)
      } else {
        console.error('Failed to retrieve challenge')
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error)
    }
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>
          <p>Твоят дневен преглед е записан. Твоите персонализирани предизвикателства са готови!</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {menuOpen && (
          <nav style={styles.mobileMenu}>
            <button onClick={() => handleNavigation('/dashboard')} style={styles.navLink}>Начална страница</button>
            <button onClick={() => handleNavigation('/challenges')} style={styles.navLink}>Колело на предизвикателствата</button>
            <button onClick={() => handleNavigation('/health-check')} style={styles.navLink}>Въпросник</button>
            <button onClick={() => handleNavigation('/your-goals')} style={styles.navLink}>Лични цели</button>
          </nav>
        )}

        <div style={styles.desktopNav}>
          <button onClick={() => handleNavigation('/dashboard')} style={styles.navLinkDesktop}>Начална страница</button>
          <button onClick={() => handleNavigation('/challenges')} style={styles.navLinkDesktop}>Колело на предизвикателствата</button>
          <button onClick={() => handleNavigation('/health-check')} style={styles.navLinkDesktop}>Въпросник</button>
          <button onClick={() => handleNavigation('/your-goals')} style={styles.navLinkDesktop}>Лични цели</button>
        </div>

        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}> Дневен психологически въпросник</h1>
            <p style={styles.subtitle}>Попълва се ежедневно — влияе директно върху днешните предизвикателства.</p>
          </div>
          <div style={styles.headerRight}>
            <button style={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>☰ Menu</button>
          </div>
        </div>

        {/* Badges Section */}
        <div style={styles.badgesSection}>
          <h2 style={styles.badgesTitle}> Tвоите значки</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Отключете значка всеки 50 XP! Вие имате <strong>{userXp} XP</strong>
          </p>
          <div style={styles.badgesContainer}>
            {badges.map((badge) => (
              <div
                key={badge.id}
                style={{
                  ...styles.badgeItem,
                  opacity: badge.unlocked ? 1 : 0.4,
                  filter: badge.unlocked ? 'none' : 'grayscale(100%)',
                }}
                title={badge.unlocked ? 'Отключено' : `Отключете на ${badge.xpRequired} XP`}
              >
                <img
                  src={badge.imagePath}
                  alt={badge.name}
                  style={styles.badgeImage}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px' }}>
                  <div style={{ color: '#666' }}>{badge.xpRequired} XP</div>
                  {badge.unlocked ? (
                    <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓ Отключено</div>
                  ) : (
                    <div style={{ color: '#999' }}>Заключено</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Questions */}
          {dailyQuestions.map((q) => (
            <fieldset key={q.id} style={styles.fieldset}>
              <legend style={styles.legend}>{q.question}</legend>
              <div style={styles.radioGroup}>
                {q.options.map((option, idx) => (
                  <label key={idx} style={styles.radioLabel}>
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option}
                      checked={responses[q.id] === option}
                      onChange={() => handleResponseChange(q.id, option)}
                      style={styles.radioInput}
                    />
                    <span style={styles.radioText}>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))} 

          {/* Screen Time Section */}
          <fieldset style={styles.fieldset}>
            <legend style={styles.legend}>
              Време на екрана днес: <span style={styles.screenTimeValue}>{screenTime}h</span>
            </legend>
            <input
              type="range"
              min="0"
              max="24"
              value={screenTime}
              onChange={(e) => setScreenTime(parseInt(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.sliderLabels}>
              <span>0h</span>
              <span>12h</span>
              <span>24h</span>
            </div>
          </fieldset>

          {/* Submit Button */}
           <button
          type="submit"
          disabled={!allQuestionsAnswered}
          style={{
            marginTop: 20,
            padding: '12px 20px',
            backgroundColor: allQuestionsAnswered ? '#4CAF50' : '#cbd5e1',
            cursor: allQuestionsAnswered ? 'pointer' : 'not-allowed',
            color: 'white',
            border: 'none',
            borderRadius: 6,
          }}
        >
          Получи моите предизвикателства
        </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    maxWidth: '900px',
    width: '100%',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,
  headerLeft: { textAlign: 'left' } as React.CSSProperties,
  headerRight: { display: 'flex', alignItems: 'center', gap: '8px' } as React.CSSProperties,
  menuToggle: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 } as React.CSSProperties,
  mobileMenu: { backgroundColor: '#213a51ff', display: 'flex', flexDirection: 'column', padding: 10, gap: 6, marginBottom: 10 } as React.CSSProperties,
  desktopNav: { display: 'flex', gap: 8, marginBottom: 12 } as React.CSSProperties,
  navLink: { backgroundColor: 'transparent', color: '#000', border: 'none', padding: '8px 12px', cursor: 'pointer', textAlign: 'left' } as React.CSSProperties,
  navLinkDesktop: { backgroundColor: 'transparent', color: '#000', border: '1px solid #e6e6e6', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' } as React.CSSProperties,
  title: {
    margin: '0 0 10px 0',
    color: '#1a3a3a',
    fontSize: '32px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  subtitle: {
    color: '#666',
    fontSize: '16px',
    margin: '0',
  } as React.CSSProperties,
  badgesSection: {
    backgroundColor: '#f9f9f9',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '40px',
    border: '2px solid #e8e8e8',
  } as React.CSSProperties,
  badgesTitle: {
    margin: '0 0 8px 0',
    color: '#1a3a3a',
    fontSize: '20px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  badgesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '16px',
  } as React.CSSProperties,
  badgeItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #ddd',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  } as React.CSSProperties,
  badgeImage: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    borderRadius: '8px',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  } as React.CSSProperties,
  fieldset: {
    border: 'none',
    padding: '0',
    margin: '0',
  } as React.CSSProperties,
  legend: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a3a3a',
    marginBottom: '16px',
    display: 'block',
  } as React.CSSProperties,
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  } as React.CSSProperties,
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f9f9f9',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '14px',
  } as React.CSSProperties,
  radioInput: {
    margin: '0 12px 0 0',
    cursor: 'pointer',
    width: '18px',
    height: '18px',
  } as React.CSSProperties,
  radioText: {
    color: '#333',
  } as React.CSSProperties,
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '5px',
    outline: 'none',
    cursor: 'pointer',
    marginBottom: '12px',
    accentColor: '#4CAF50',
  } as React.CSSProperties,
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#999',
  } as React.CSSProperties,
  screenTimeValue: {
    color: '#4CAF50',
    fontWeight: 'bold',
  } as React.CSSProperties,
  submitBtn: {
    padding: '14px 28px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '10px',
  } as React.CSSProperties,
  successCard: {
    backgroundColor: 'white',
    padding: '60px 40px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
  } as React.CSSProperties,
  successIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  } as React.CSSProperties,
}

