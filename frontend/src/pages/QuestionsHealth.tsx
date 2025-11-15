import { useState } from 'react'

export default function QuestionsHealth() {
  const [responses, setResponses] = useState<Record<number, string>>({})
  const [screenTime, setScreenTime] = useState<number>(0)
  const [submitted, setSubmitted] = useState(false)

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
      // Simple scoring: for each question, find the selected option index and add (index+1)*9 points
      // (this maps to quest required_points scale used in the backend seed data)
      let totalPoints = 0
      for (const q of questions) {
        const ans = responses[q.id]
        if (!ans) continue
        const idx = q.options.findIndex((o) => o === ans)
        if (idx >= 0) totalPoints += (idx + 1) * 9
      }

      // Update user points on backend
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

      // Immediately request a challenge for the user
      const chall = await fetch(`${apiBase}/challange/receive`, {
        method: 'GET',
        headers: { user_id: userId },
      })

      if (chall.ok) {
        // We don't need to use the returned challenge here because DashboardPage will fetch it on mount
        // but we can log it for debugging.
        const quest = await chall.json()
        console.log('Assigned quest:', quest)

        setSubmitted(true)
        setTimeout(() => {
          setResponses({})
          setScreenTime(0)
          setSubmitted(false)
          // navigate user to dashboard to see their challenge
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
          <h1 style={styles.title}>🌿 Дневен психологически въпросник</h1>
          <p style={styles.subtitle}>Попълва се ежедневно — влияе директно върху днешните предизвикателства.</p>
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
    maxWidth: '800px',
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

