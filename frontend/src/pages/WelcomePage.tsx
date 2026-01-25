import { useNavigate } from 'react-router-dom'
import heroImg from '../assets/12291047_Happy crowd greeting little winner of racing.jpg'
import React from 'react'

export default function WelcomePage() {
  const navigate = useNavigate()

  const handleRegisterClick = () => {
    navigate('/register')
  }

  const handleLoginClick = () => {
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>Хармония+</h1>
        </div>
        <div style={styles.headerButtons}>
          <button onClick={handleLoginClick} style={styles.loginBtn}>
            Вход
          </button>
          <button onClick={handleRegisterClick} style={styles.registerBtnHeader}>
            Регистрация
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <div style={styles.heroContent}>
            <div style={styles.heroText}>
              <h2 style={styles.heroTitle}>Добре дошли в Хармония+</h2>
              <p style={styles.heroSubtitle}>
                Присъединете се към нашата общност и откройте пътя към по-щастлив и екологичен живот
              </p>
            </div>
            <div style={styles.heroImage}>
              <img src={heroImg} alt="Happy crowd greeting winner" style={styles.heroImg} />
            </div>
          </div>
        </section>

        {/* Main Content Section */}
        <section style={styles.section}>
          <div style={styles.contentWrapper}>
            <h2 style={styles.sectionTitle}>За нас</h2>
            <p style={styles.contentText}>
              Ние сме Хармония+ – платформа, посветена на трансформацията на живота на хората и създаването на по-екологичен свят. 
              Нашата мисия е да се превърнем в един от главните двигатели за развитието на продуктивно, щастливо, екологично и хармонично общество.
            </p>
            <p style={styles.contentText}>
              Живеем в света, който е напълнен с предизвикателства: мръсен въздух, постоянен стрес, лошо качество на живот и информационна претоварка. 
              Повечето хора се опитват да „избягат" от своето емоционално състояние, скрозвайки безкрайно в мобилни приложения или интернет. 
              Перфектно разбираме този цикъл и знаем колко е вредно за психичното и физическото ни здраве.
            </p>

            <h2 style={styles.sectionTitle}>Проблемът</h2>
            <p style={styles.contentText}>
              В днешния натоварен свят, повечето от нас не обращаме достатъчно внимание на собственото си благополучие. 
              Не си даваме достатъчно почивка, рядко излизаме сред природата без телефон в ръка, дори се храним в движение, 
              вместо да общуваме едни с други. Стресът и липсата на внимание към себе си водят до висока нивелация на живота, 
              които са често пренебрегвани и игнорирани.
            </p>

            <h2 style={styles.sectionTitle}>Нашето решение</h2>
            <p style={styles.contentText}>
              Хармония+ е направена, за да решим тези проблеми чрез специално разработена система на предизвикателства, 
              които постепенно подобряват вашата психично и физическо здраве. Нашата платформа предлага персонализирани предизвикателства, 
              базирани на вашите индивидуални нужди и цели. Чрез изпълнението на тези предизвикателства, вие ще можете да натрупате опитни точки (XP),
              да покачвате нива и да се състезавате с други потребители, което ще ви мотивира да продължавате напред. Също така създадохме личен дневник,
              където можете да следите вашия прогрес и да отразявате вашите мисли и чувства. Направихме и място, в което можете да записвате целите си и да виждате как ги постигате.
              
            </p>

            <h2 style={styles.sectionTitle}>Как работи?</h2>
            <div style={styles.stepsContainer}>
              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <h3 style={styles.stepTitle}>Заполнете въпросника</h3>
                <p style={styles.stepDescription}>Отговорете на серия от въпроси за вашето физическо и психическо здраве</p>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <h3 style={styles.stepTitle}>Получете предизвикателства</h3>
                <p style={styles.stepDescription}>Системата генерира персонализирани предизвикателства въз основа на вашите отговори</p>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <h3 style={styles.stepTitle}>Изпълнете предизвикателствата</h3>
                <p style={styles.stepDescription}>Завършете дневните и седмичните предизвикателства, за да натрупате опит</p>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>4</div>
                <h3 style={styles.stepTitle}>Прогресирайте</h3>
                <p style={styles.stepDescription}>Покачвайте нива, състезавайте се с други и следите вашия прогрес</p>
              </div>
            </div>

            <h2 style={styles.sectionTitle}>Защо Хармония+?</h2>
            <div style={styles.benefitsContainer}>
              <div style={styles.benefitItem}>
                <span style={styles.benefitIcon}>🎯</span>
                <h3>Персонализирано</h3>
                <p>Всеки потребител получава уникални предизвикателства, приспособени към техните нужди</p>
              </div>
              <div style={styles.benefitItem}>
                <span style={styles.benefitIcon}>🏆</span>
                <h3>Мотивиращо</h3>
                <p>Система от нива, точки и класиране, която те мотивира да продължаваш напред</p>
              </div>
              <div style={styles.benefitItem}>
                <span style={styles.benefitIcon}>🌍</span>
                <h3>Екологично</h3>
                <p>Предизвикателствата са насочени към устойчив, спокоен, продуктивен, екологичен живот</p>
              </div>
              <div style={styles.benefitItem}>
                <span style={styles.benefitIcon}>👥</span>
                <h3>Общност</h3>
                <p>Присъединете се към хора, които работят върху своето благополучие</p>
              </div>
              <div style={styles.benefitItem}>
                <span style={styles.benefitIcon}>📋</span>
                <h3>Моите цели</h3>
                <p>Задайте и следете личните си цели и останете продуктивни</p>
              </div>
              <div style={styles.benefitItem}>
                <span style={styles.benefitIcon}>📔</span>
                <h3>Личния дневник</h3>
                <p>Водите личен дневник, за да отразите своя прогрес и емоции през всяко пътешествие</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section style={styles.ctaSection}>
          <div style={styles.ctaContent}>
            <h2 style={styles.ctaTitle}>Готови ли сте да започнете своето пътешествие?</h2>
            <p style={styles.ctaSubtitle}>
              Регистрирайте се днес и станете част от Хармония+ общността
            </p>
            <div style={styles.ctaButtons}>
              <button onClick={handleRegisterClick} style={styles.registerBtnLarge}>
                Регистрирай се сега
              </button>
              <button onClick={handleLoginClick} style={styles.loginBtnSecondary}>
                Вече имам профил
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <p>&copy; 2026 Хармония+. Всички права запазени.</p>
          <p>Създано с ❤️ за по-добър свят</p>
        </footer>
      </main>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  header: {
    backgroundColor: 'white',
    padding: '16px 20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  } as React.CSSProperties,
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  } as React.CSSProperties,
  logo: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #19c916ff, #37b324ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } as React.CSSProperties,
  headerButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  loginBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#19c916ff',
    border: '2px solid #19c916ff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  registerBtnHeader: {
    padding: '10px 20px',
    backgroundColor: '#19c916ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  main: {
    flex: 1,
    margin: '0 auto',
    width: '100%',
    maxWidth: '1200px',
    padding: '20px',
  } as React.CSSProperties,
  heroSection: {
    marginBottom: '40px',
  } as React.CSSProperties,
  heroContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  } as React.CSSProperties,
  heroText: {
    flex: 1,
    minWidth: '280px',
  } as React.CSSProperties,
  heroTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px',
    marginTop: 0,
  } as React.CSSProperties,
  heroSubtitle: {
    fontSize: '18px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: 0,
  } as React.CSSProperties,
  heroImage: {
    flex: 1,
    minWidth: '280px',
  } as React.CSSProperties,
  heroImg: {
    width: '100%',
    height: 'auto',
    borderRadius: '10px',
    objectFit: 'cover',
  } as React.CSSProperties,
  section: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '14px',
    marginBottom: '40px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  } as React.CSSProperties,
  contentWrapper: {
    maxWidth: '900px',
    margin: '0 auto',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
    marginTop: '30px',
    paddingBottom: '12px',
    borderBottom: '3px solid #19c916ff',
    display: 'inline-block',
  } as React.CSSProperties,
  contentText: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#555',
    marginBottom: '20px',
    textAlign: 'justify',
  } as React.CSSProperties,
  stepsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '30px',
    marginBottom: '30px',
  } as React.CSSProperties,
  step: {
    backgroundColor: '#f9f9f9',
    padding: '24px',
    borderRadius: '10px',
    textAlign: 'center',
    border: '2px solid #e0e0e0',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  stepNumber: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#19c916ff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 auto 16px',
  } as React.CSSProperties,
  stepTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    margin: '12px 0',
  } as React.CSSProperties,
  stepDescription: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  } as React.CSSProperties,
  benefitsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginTop: '30px',
    marginBottom: '20px',
  } as React.CSSProperties,
  benefitItem: {
    backgroundColor: '#f0f8f5',
    padding: '24px',
    borderRadius: '10px',
    textAlign: 'center',
    border: '1px solid #d0f0e8',
    color: '#000000',
  } as React.CSSProperties,
  benefitIcon: {
    fontSize: '40px',
    display: 'block',
    marginBottom: '12px',
  } as React.CSSProperties,
  ctaSection: {
    backgroundColor: 'linear-gradient(135deg, #19c916ff, #37b324ff)',
    background: 'linear-gradient(135deg, #19c916ff, #37b324ff)',
    padding: '60px 40px',
    borderRadius: '14px',
    marginBottom: '40px',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(25, 201, 22, 0.3)',
  } as React.CSSProperties,
  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
  } as React.CSSProperties,
  ctaTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '16px',
    marginTop: 0,
  } as React.CSSProperties,
  ctaSubtitle: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: '30px',
  } as React.CSSProperties,
  ctaButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  registerBtnLarge: {
    padding: '14px 32px',
    backgroundColor: 'white',
    color: '#19c916ff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  } as React.CSSProperties,
  loginBtnSecondary: {
    padding: '14px 32px',
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  footer: {
    backgroundColor: 'white',
    padding: '20px',
    textAlign: 'center',
    borderTop: '1px solid #e0e0e0',
    color: '#666',
    fontSize: '14px',
  } as React.CSSProperties,
}
