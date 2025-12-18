import { useState, useEffect } from 'react'
import api from '../services/api'
import React from 'react'

type PersonalGoal = {
  id: string
  title: string
  description: string
  category: string
  dueDate?: string
  createdAt?: string
}

type DiaryEntry = {
  id: string
  date: string
  mood: 'amazing' | 'happy' | 'neutral' | 'sad' | 'stressed'
  content: string
  createdAt?: string
}

export default function YourGoals() {
  const [goals, setGoals] = useState<PersonalGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Personal',
  })

  // Diary state
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [showDiaryForm, setShowDiaryForm] = useState(false)
  const [diaryFormData, setDiaryFormData] = useState({
    mood: 'happy' as const,
    content: '',
  })
  const [loadingDiary, setLoadingDiary] = useState(true)

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await api.request('/api/goals')
        if (response && Array.isArray(response)) {
          const mappedGoals: PersonalGoal[] = response.map((goal: any) => ({
            id: goal.id || goal[0],
            title: goal.title || goal.name || goal[1] || 'Goal',
            description: goal.description || goal[2] || '',
            category: goal.category || goal[6] || 'Personal',
            dueDate: goal.due_date || goal.dueDate || goal[7] || '',
            createdAt: goal.created_at || goal.createdAt || '',
          }))
          setGoals(mappedGoals)
        }
      } catch (e) {
        console.warn('Failed to fetch goals', e)
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [])

  // Fetch diary entries
  useEffect(() => {
    const fetchDiaryEntries = async () => {
      try {
        const response = await api.request('/api/diary')
        if (response && Array.isArray(response)) {
          const mappedEntries: DiaryEntry[] = response.map((entry: any) => ({
            id: entry.id || entry[0],
            date: entry.date || entry[1] || new Date().toISOString().split('T')[0],
            mood: entry.mood || entry[2] || 'happy',
            content: entry.content || entry[3] || '',
            createdAt: entry.created_at || entry.createdAt || entry.date ||'',
          }))
          // Sort by date descending (newest first)
          setDiaryEntries(mappedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        }
      } catch (e) {
        console.warn('Failed to fetch diary entries', e)
      } finally {
        setLoadingDiary(false)
      }
    }

    fetchDiaryEntries()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Моля, въведете название на целта')
      return
    }

    try {
      const newGoal: PersonalGoal = await api.request('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.title,
          description: formData.description,
          category: formData.category,
          priority: 0,
        }),
      })

      if (newGoal) {
        const mappedGoal: PersonalGoal = {
          id: newGoal.id || Math.random().toString(),
          title: newGoal.title || formData.title,
          description: newGoal.description || formData.description,
          category: newGoal.category || formData.category,
          dueDate: newGoal.dueDate || '',
        }
        setGoals([...goals, mappedGoal])
        setFormData({ title: '', description: '', category: 'Personal' })
        setShowForm(false)
      }
    } catch (e) {
      console.error('Failed to create goal', e)
      alert('Грешка при създаване на целта')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази цел?')) {
      return
    }
    try {
      await api.request(`/api/goals/${goalId}`, { method: 'DELETE' })
      setGoals(goals.filter((g) => g.id !== goalId))
    } catch (e) {
      console.error('Failed to delete goal', e)
      alert('Грешка при изтриване на целта')
    }
  }



  // Diary handlers
  const handleDiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!diaryFormData.content.trim()) {
      alert('Моля, напишете своята мисъл или усещане')
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      const newEntry: DiaryEntry = await api.request('/api/diary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: today,
          mood: diaryFormData.mood,
          content: diaryFormData.content,
        }),
      })

      if (newEntry) {
        const mappedEntry: DiaryEntry = {
          id: newEntry.id || Math.random().toString(),
          date: newEntry.date || today,
          mood: newEntry.mood || diaryFormData.mood,
          content: newEntry.content || diaryFormData.content,
          createdAt: newEntry.createdAt || new Date().toISOString(),
        }
        setDiaryEntries([mappedEntry, ...diaryEntries])
        setDiaryFormData({ mood: 'happy', content: '' })
        setShowDiaryForm(false)
      }
    } catch (e) {
      console.error('Failed to create diary entry', e)
      alert('Грешка при запазване на дневника')
    }
  }

  const handleDeleteDiaryEntry = async (entryId: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този запис?')) {
      return
    }
    try {
      await api.request(`/api/diary/${entryId}`, { method: 'DELETE' })
      setDiaryEntries(diaryEntries.filter((e) => e.id !== entryId))
    } catch (e) {
      console.error('Failed to delete diary entry', e)
      alert('Грешка при изтриване на записа')
    }
  }

  const getMoodEmoji = (mood: string): string => {
    const moods: Record<string, string> = {
      amazing: '😄',
      happy: '😊',
      neutral: '😐',
      sad: '😢',
      stressed: '😰',
    }
    return moods[mood] || '😊'
  }

  const getMoodColor = (mood: string): string => {
    const colors: Record<string, string> = {
      amazing: '#FFD700',
      happy: '#4CAF50',
      neutral: '#2196F3',
      sad: '#FF9800',
      stressed: '#F44336',
    }
    return colors[mood] || '#2196F3'
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Personal: '#2196F3',
      Health: '#4CAF50',
      Work: '#FF9800',
      Learning: '#9C27B0',
      Fitness: '#F44336',
      Mindfulness: '#00BCD4',
    }
    return colors[category] || '#2196F3'
  }



  if (loading) {
    return <div style={styles.loadingContainer}>Зареждане...</div>
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>🎯 Моите цели</h1>
          <p style={styles.subtitle}>Следете своя прогрес и постигайте своите мечти</p>
        </div>
        <button
          style={styles.createBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Отмени' : '+ Нова цел'}
        </button>
      </header>

      {/* Create Goal Form */}
      {showForm && (
        <div style={styles.formContainer}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Название на целта</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="напр. Прочетете 12 книги"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опишете вашата цел..."
                style={styles.textarea}
                rows={3}
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Категория</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={styles.select}
                >
                  <option>Personal</option>
                  <option>Health</option>
                  <option>Work</option>
                  <option>Learning</option>
                  <option>Fitness</option>
                  <option>Mindfulness</option>
                </select>
              </div>
            </div>

            <button type="submit" style={styles.submitBtn}>
              Създай цел
            </button>
          </form>
        </div>
      )}

      {/* Goals Grid */}
      <main style={styles.main}>
        {goals.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎯</div>
            <h2 style={styles.emptyTitle}>Нямате цели</h2>
            <p style={styles.emptyText}>Създайте първата си цел и започнете пътешествието си към успех!</p>
            <button
              style={styles.emptyBtn}
              onClick={() => setShowForm(true)}
            >
              Създайте първата цел
            </button>
          </div>
        ) : (
          <div style={styles.goalsGrid}>
            {goals.map((goal) => (
              <div key={goal.id} style={styles.goalCard}>
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleSection}>
                    <h3 style={styles.goalTitle}>{goal.title}</h3>
                    <span
                      style={{
                        ...styles.categoryBadge,
                        backgroundColor: getCategoryColor(goal.category),
                      }}
                    >
                      {goal.category}
                    </span>
                  </div>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDeleteGoal(goal.id)}
                    title="Изтрий целта"
                  >
                    ✕
                  </button>
                </div>

                {/* Description */}
                <p style={styles.goalDescription}>{goal.description}</p>



                {/* Due Date */}
                {goal.dueDate && (
                  <div style={styles.dueDate}>
                    📅 Краен срок: {new Date(goal.dueDate).toLocaleDateString('bg-BG')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Personal Diary Section */}
        <section style={styles.diarySection}>
          <div style={styles.diaryHeader}>
            <h2 style={styles.diaryTitle}>📔 Моят личен дневник</h2>
            <p style={styles.diarySubtitle}>За твоите мисли, усещания и преживяния</p>
          </div>

          <button
            style={styles.diaryCreateBtn}
            onClick={() => setShowDiaryForm(!showDiaryForm)}
          >
            {showDiaryForm ? '✕ Отмени' : '✎ Напиши нов запис'}
          </button>

          {/* Diary Entry Form */}
          {showDiaryForm && (
            <div style={styles.diaryFormContainer}>
              <form onSubmit={handleDiarySubmit} style={styles.diaryForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Как се чувстваш днес?</label>
                  <div style={styles.moodSelector}>
                    {(['amazing', 'happy', 'neutral', 'sad', 'stressed'] as const).map((mood) => (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => setDiaryFormData({ ...diaryFormData, mood })}
                        style={{
                          ...styles.moodButton,
                          backgroundColor: diaryFormData.mood === mood ? getMoodColor(mood) : '#f0f0f0',
                          transform: diaryFormData.mood === mood ? 'scale(1.15)' : 'scale(1)',
                        }}
                        title={mood}
                      >
                        {getMoodEmoji(mood)}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Твоята мисъл</label>
                  <textarea
                    value={diaryFormData.content}
                    onChange={(e) => setDiaryFormData({ ...diaryFormData, content: e.target.value })}
                    placeholder="Напиши какво те занимава, какво си преживял/а днес, какви са твоите мисли..."
                    style={styles.diaryTextarea}
                    rows={5}
                  />
                </div>

                <button type="submit" style={styles.diarySaveBtn}>
                  Запази записа
                </button>
              </form>
            </div>
          )}

          {/* Diary Entries List */}
          <div style={styles.diaryEntriesContainer}>
            {loadingDiary ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Зареждане на записите...</div>
            ) : diaryEntries.length === 0 ? (
              <div style={styles.emptyDiary}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
                <p style={{ color: '#666' }}>Нямаш записи. Започни да пишеш дневника си!</p>
              </div>
            ) : (
              <div style={styles.diaryEntriesList}>
                {diaryEntries.map((entry) => (
                  <div key={entry.id} style={styles.diaryEntryCard}>
                    <div style={styles.diaryEntryHeader}>
                      <div style={styles.diaryEntryDate}>
                        📅 {new Date(entry.date).toLocaleDateString('bg-BG', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span
                          style={{
                            ...styles.moodRing,
                            backgroundColor: getMoodColor(entry.mood),
                          }}
                          title={entry.mood}
                        >
                          {getMoodEmoji(entry.mood)}
                        </span>
                        <button
                          style={styles.diaryDeleteBtn}
                          onClick={() => handleDeleteDiaryEntry(entry.id)}
                          title="Изтрий записа"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <p style={styles.diaryEntryContent}>{entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '20px',
  } as React.CSSProperties,
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#666',
  } as React.CSSProperties,
  header: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
  } as React.CSSProperties,
  headerContent: {
    flex: 1,
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#333',
  } as React.CSSProperties,
  subtitle: {
    margin: '8px 0 0',
    fontSize: '16px',
    color: '#666',
  } as React.CSSProperties,
  createBtn: {
    padding: '12px 24px',
    backgroundColor: '#FF6B6B',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  formContainer: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    background: 'white',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  } as React.CSSProperties,
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  } as React.CSSProperties,
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  } as React.CSSProperties,
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  } as React.CSSProperties,
  input: {
    padding: '10px 15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.3s',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  textarea: {
    padding: '10px 15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    transition: 'border-color 0.3s',
  } as React.CSSProperties,
  select: {
    padding: '10px 15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  submitBtn: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  } as React.CSSProperties,
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  goalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  } as React.CSSProperties,
  goalCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '24px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '12px',
  } as React.CSSProperties,
  cardTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  } as React.CSSProperties,
  goalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  } as React.CSSProperties,
  categoryBadge: {
    padding: '4px 12px',
    color: 'white',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  deleteBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#999',
    cursor: 'pointer',
    padding: '0',
    transition: 'color 0.3s',
  } as React.CSSProperties,
  goalDescription: {
    margin: '0 0 16px',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
  } as React.CSSProperties,
  dueDate: {
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#fff3e0',
    borderLeft: '3px solid #FF9800',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#E65100',
    fontWeight: '500',
  } as React.CSSProperties,
  completedBadge: {
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#e8f5e9',
    borderLeft: '3px solid #4CAF50',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '15px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  } as React.CSSProperties,
  emptyTitle: {
    margin: '0 0 12px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  } as React.CSSProperties,
  emptyText: {
    margin: '0 0 24px',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  emptyBtn: {
    padding: '12px 28px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  } as React.CSSProperties,

  // Diary styles
  diarySection: {
    marginTop: '40px',
  } as React.CSSProperties,
  diaryHeader: {
    maxWidth: '1200px',
    margin: '0 auto 24px',
  } as React.CSSProperties,
  diaryTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  } as React.CSSProperties,
  diarySubtitle: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  diaryCreateBtn: {
    maxWidth: '1200px',
    margin: '0 auto 24px',
    display: 'block',
    padding: '12px 24px',
    backgroundColor: '#9C27B0',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(156, 39, 176, 0.3)',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  diaryFormContainer: {
    maxWidth: '1200px',
    margin: '0 auto 24px',
    background: 'white',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  diaryForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  } as React.CSSProperties,
  moodSelector: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  } as React.CSSProperties,
  moodButton: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
     border: '2px solid transparent',
    outline: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    WebkitTapHighlightColor: 'transparent' as any,
  } as React.CSSProperties,
  diaryTextarea: {
    padding: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    transition: 'border-color 0.3s',
    lineHeight: '1.6',
  } as React.CSSProperties,
  diarySaveBtn: {
    padding: '12px 24px',
    backgroundColor: '#9C27B0',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  } as React.CSSProperties,
  diaryEntriesContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  diaryEntriesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,
  diaryEntryCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  diaryEntryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #f0f0f0',
  } as React.CSSProperties,
  diaryEntryDate: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#666',
  } as React.CSSProperties,
  moodRing: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  } as React.CSSProperties,
  diaryDeleteBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#bbb',
    cursor: 'pointer',
    padding: '0',
    transition: 'color 0.3s',
  } as React.CSSProperties,
  diaryEntryContent: {
    margin: 0,
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  } as React.CSSProperties,
  emptyDiary: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  } as React.CSSProperties,
}