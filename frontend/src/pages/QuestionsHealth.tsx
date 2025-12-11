import { useState, useEffect } from 'react'

type Badge = {
  id: number
  name: string
  xpRequired: number
  imagePath: string
  unlocked: boolean
}

export default function QuestionsHealth() {
  const [responses, setResponses] = useState<Record<number, string>>({})
  const [screenTime, setScreenTime] = useState<number>(0)
  const [submitted, setSubmitted] = useState(false)
  const [badges, setBadges] = useState<Badge[]>([])
  const [userXp, setUserXp] = useState(0)

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

          // Initialize badges: one badge every 500 XP
          const totalBadges = Math.ceil(currentXp / 500) + 3 // +3 for future badges to work towards
          const badgeList: Badge[] = Array.from({ length: totalBadges }, (_, i) => ({
            id: i,
            name: `Badge ${i + 1}`,
            xpRequired: (i + 1) * 500,
            imagePath: badgeImages[i % badgeImages.length], // cycle through all available badge images
            unlocked: currentXp >= (i + 1) * 500,
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
  ]

  const handleResponseChange = (questionId: number, option: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let totalPoints = 0
      for (const q of questions) {
        const ans = responses[q.id]
        if (!ans) continue
        const idx = q.options.findIndex((o) => o === ans)
        if (idx >= 0) totalPoints += (idx + 1)
      }

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
        setTimeout(() => {
          setResponses({})
          setScreenTime(0)
          setSubmitted(false)
          window.location.href = '/dashboard'
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
          <h2>Благодаря!</h2>
          <p>Твоят дневен преглед е записан. Твоите персонализирани предизвикателства са готови!</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}> Дневен психологически въпросник</h1>
          <p style={styles.subtitle}>Попълва се ежедневно — влияе директно върху днешните предизвикателства.</p>
        </div>

        {/* Badges Section */}
        <div style={styles.badgesSection}>
          <h2 style={styles.badgesTitle}> Tвоите значки</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Отключете значка всеки 500 XP! Вие имате <strong>{userXp} XP</strong>
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
                  <div style={{ fontWeight: 600, color: '#333' }}>Lvl {badge.id + 1}</div>
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
          {questions.map((q) => (
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
          <button type="submit" style={styles.submitBtn}>
            🚀 Получи моите предизвикателства
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
    textAlign: 'center',
    marginBottom: '40px',
  } as React.CSSProperties,
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

