import { useState, useEffect } from 'react'
import api from '../services/api'
import React from 'react'

type PersonalGoal = {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  progress: number
  category: string
  dueDate?: string
  createdAt?: string
}

export default function YourGoals() {
  const [goals, setGoals] = useState<PersonalGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetValue: '',
    category: 'Personal',
  })

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await api.request('/api/goals')
        if (response && Array.isArray(response)) {
          const mappedGoals: PersonalGoal[] = response.map((goal: any) => ({
            id: goal.id || goal[0],
            title: goal.title || goal.name || goal[1] || 'Goal',
            description: goal.description || goal[2] || '',
            targetValue: Number(goal.target_value ?? goal.targetValue ?? goal[3] ?? 100),
            currentValue: Number(goal.current_value ?? goal.currentValue ?? goal[4] ?? 0),
            progress: Number(goal.progress ?? goal[5] ?? 0),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetVal = parseInt(formData.targetValue)
    
    if (!formData.title.trim()) {
      alert('Моля, въведете название на целта')
      return
    }
    
    if (isNaN(targetVal) || targetVal <= 0) {
      alert('Моля, въведете валидна целева стойност')
      return
    }

    try {
      const newGoal: PersonalGoal = await api.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          target_value: targetVal,
          category: formData.category,
        }),
      })

      if (newGoal) {
        const mappedGoal: PersonalGoal = {
          id: newGoal.id || Math.random().toString(),
          title: newGoal.title || formData.title,
          description: newGoal.description || formData.description,
          targetValue: Number(newGoal.targetValue ?? targetVal ?? 100),
          currentValue: 0,
          progress: 0,
          category: newGoal.category || formData.category,
          dueDate: newGoal.dueDate || '',
        }
        setGoals([...goals, mappedGoal])
        setFormData({ title: '', description: '', targetValue: '', category: 'Personal' })
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

  const handleUpdateProgress = async (goalId: string, newValue: number) => {
    try {
      await api.request(`/api/goals/${goalId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ current_value: newValue }),
      })
      setGoals(
        goals.map((g) =>
          g.id === goalId
            ? { ...g, currentValue: newValue, progress: Math.min((newValue / g.targetValue) * 100, 100) }
            : g
        )
      )
    } catch (e) {
      console.error('Failed to update progress', e)
    }
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

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return '#4CAF50'
    if (progress >= 75) return '#8BC34A'
    if (progress >= 50) return '#FFC107'
    if (progress >= 25) return '#FF9800'
    return '#F44336'
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
                <label style={styles.label}>Целева стойност</label>
                <input
                  type="number"
                  min="1"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  placeholder="100"
                  style={styles.input}
                  required
                />
              </div>

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

                {/* Progress Section */}
                <div style={styles.progressSection}>
                  <div style={styles.progressHeader}>
                    <span style={styles.progressLabel}>Прогрес</span>
                    <span style={{ ...styles.progressValue, color: getProgressColor(goal.progress) }}>
                      {Math.round(goal.progress)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={styles.progressBarContainer}>
                    <div
                      style={{
                        ...styles.progressBar,
                        width: `${Math.min(goal.progress, 100)}%`,
                        backgroundColor: getProgressColor(goal.progress),
                      }}
                    />
                  </div>

                  {/* Progress Text */}
                  <div style={styles.progressText}>
                    <span>{goal.currentValue}</span>
                    <span style={styles.separator}>/</span>
                    <span>{goal.targetValue}</span>
                  </div>
                </div>

                {/* Update Progress */}
                <div style={styles.progressControls}>
                  <input
                    type="range"
                    min="0"
                    max={goal.targetValue}
                    value={goal.currentValue}
                    onChange={(e) => handleUpdateProgress(goal.id, Number(e.target.value))}
                    style={styles.slider}
                  />
                  <div style={styles.sliderButtons}>
                    <button
                      style={styles.incrementBtn}
                      onClick={() => handleUpdateProgress(goal.id, Math.min(goal.currentValue + 1, goal.targetValue))}
                    >
                      +
                    </button>
                    <button
                      style={styles.decrementBtn}
                      onClick={() => handleUpdateProgress(goal.id, Math.max(goal.currentValue - 1, 0))}
                    >
                      −
                    </button>
                  </div>
                </div>

                {/* Due Date */}
                {goal.dueDate && (
                  <div style={styles.dueDate}>
                    📅 Краен срок: {new Date(goal.dueDate).toLocaleDateString('bg-BG')}
                  </div>
                )}

                {/* Completion Badge */}
                {goal.currentValue >= goal.targetValue && (
                  <div style={styles.completedBadge}>
                    ✅ Завършено!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
    color: '#fff',
    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
  } as React.CSSProperties,
  subtitle: {
    margin: '8px 0 0',
    fontSize: '16px',
    color: 'rgba(255,255,255,0.9)',
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
  progressSection: {
    marginBottom: '16px',
  } as React.CSSProperties,
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px',
  } as React.CSSProperties,
  progressLabel: {
    color: '#666',
    fontWeight: '600',
  } as React.CSSProperties,
  progressValue: {
    fontWeight: 'bold',
    fontSize: '14px',
  } as React.CSSProperties,
  progressBarContainer: {
    width: '100%',
    height: '12px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '8px',
  } as React.CSSProperties,
  progressBar: {
    height: '100%',
    borderRadius: '10px',
    transition: 'all 0.4s ease',
  } as React.CSSProperties,
  progressText: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#999',
    fontWeight: '500',
  } as React.CSSProperties,
  separator: {
    margin: '0 2px',
  } as React.CSSProperties,
  progressControls: {
    marginTop: '16px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  } as React.CSSProperties,
  slider: {
    flex: 1,
    height: '6px',
    borderRadius: '10px',
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#4CAF50',
  } as React.CSSProperties,
  sliderButtons: {
    display: 'flex',
    gap: '6px',
  } as React.CSSProperties,
  incrementBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #4CAF50',
    backgroundColor: '#e8f5e9',
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  decrementBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #f44336',
    backgroundColor: '#ffebee',
    color: '#f44336',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
}