import React, { useState, useEffect } from 'react';
import { useTheme, colors } from '../ThemeContext';

export default function WelcomeGuide() {
  const { dark, tr } = useTheme();
  const c = colors(dark);
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('guide_seen');
    if (!seen) setVisible(true);
  }, []);

  const hide = () => {
    localStorage.setItem('guide_seen', '1');
    setVisible(false);
  };

  if (!visible) return null;

  const steps = tr.guideSteps;
  const isLast = step === steps.length - 1;

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, background: c.bgCard, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>

        {/* Заголовок */}
        <div style={styles.header}>
          <div style={styles.logo}>👁</div>
          <div>
            <div style={{ ...styles.title, color: c.text }}>{tr.guideTitle}</div>
            <div style={{ ...styles.subtitle, color: c.textMuted }}>{tr.guideSubtitle}</div>
          </div>
        </div>

        {/* Точки прогресса */}
        <div style={styles.dots}>
          {steps.map((_, i) => (
            <div key={i} style={{
              ...styles.dot,
              background: i === step ? '#1a237e' : (dark ? '#3a3a5a' : '#ddd'),
              width: i === step ? '24px' : '8px',
            }} onClick={() => setStep(i)} />
          ))}
        </div>

        {/* Шаг */}
        <div style={styles.stepCard}>
          <div style={styles.stepIcon}>{steps[step].icon}</div>
          <div style={{ ...styles.stepTitle, color: c.text }}>{steps[step].title}</div>
          <div style={{ ...styles.stepDesc, color: c.textMuted }}>{steps[step].desc}</div>
        </div>

        {/* Кнопки */}
        <div style={styles.actions}>
          <button
            style={{ ...styles.btnSkip, color: c.textMuted }}
            onClick={() => hide()}
          >
            {tr.dontShowAgain}
          </button>
          <button
            style={styles.btnNext}
            onClick={() => isLast ? hide() : setStep(s => s + 1)}
          >
            {isLast ? tr.finish : tr.nextStep} {!isLast && '→'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    borderRadius: '20px',
    padding: '32px',
    width: '100%',
    maxWidth: '460px',
    animation: 'fadeIn 0.3s ease',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px',
  },
  logo:     { fontSize: '40px' },
  title:    { fontSize: '20px', fontWeight: '700', marginBottom: '2px' },
  subtitle: { fontSize: '13px' },
  dots: {
    display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px',
  },
  dot: {
    height: '8px', borderRadius: '4px',
    transition: 'all 0.3s', cursor: 'pointer',
  },
  stepCard: {
    textAlign: 'center',
    padding: '24px 16px',
    background: 'linear-gradient(135deg, #1a237e11, #3949ab11)',
    borderRadius: '12px',
    marginBottom: '24px',
    minHeight: '160px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '12px',
  },
  stepIcon:  { fontSize: '48px' },
  stepTitle: { fontSize: '18px', fontWeight: '700' },
  stepDesc:  { fontSize: '14px', lineHeight: '1.6', maxWidth: '320px' },
  actions: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  btnSkip: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '13px', padding: '8px',
  },
  btnNext: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #1a237e, #3949ab)',
    color: '#fff', border: 'none', borderRadius: '10px',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  },
};
