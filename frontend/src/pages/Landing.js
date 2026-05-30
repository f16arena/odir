import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, colors } from '../ThemeContext';

const LANGS = [
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'KZ' },
  { code: 'en', label: 'EN' },
];

// Реальные классы модели и реальные метрики (см. backend/routers/analytics.py).
const DISEASE_CODES = ['N', 'D', 'G', 'C', 'A', 'H', 'M', 'O'];

export default function Landing() {
  const { dark, toggleDark, lang, setLang, tr } = useTheme();
  const c = colors(dark);
  const navigate = useNavigate();
  const L = tr.landing;

  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  const goApp = () => navigate(role ? `/${role}` : '/login');

  const line = `1px solid ${c.border}`;

  return (
    <div style={{
      minHeight: '100vh', background: c.bg, color: c.text,
      fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
    }}>
      {/* ── Навигация ─────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px max(24px, 5vw)', borderBottom: line,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.04em' }}>ODIR</span>
          <span style={{ fontSize: '12px', color: c.textMuted }}>{L.tagline}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', border: line, borderRadius: '8px', overflow: 'hidden' }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                style={{
                  padding: '6px 11px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 600,
                  background: lang === l.code ? c.accent : 'transparent',
                  color: lang === l.code ? '#fff' : c.textMuted,
                }}>
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={toggleDark} title="theme"
            style={{ width: '34px', height: '34px', border: line, borderRadius: '8px', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '15px' }}>
            {dark ? '☀' : '☾'}
          </button>
          <button onClick={() => navigate('/login')}
            style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', background: c.accent, color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            {L.signin}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
        {/* ── Hero ───────────────────────────────── */}
        <section style={{
          display: 'flex', flexWrap: 'wrap', gap: '48px',
          alignItems: 'stretch', padding: '72px 0 64px',
        }}>
          <div style={{ flex: '1 1 440px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: c.accent, letterSpacing: '0.06em', marginBottom: '20px' }}>
              {L.tagline}
            </div>
            <h1 style={{
              fontSize: 'clamp(34px, 4.6vw, 58px)', lineHeight: 1.05,
              fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 22px',
            }}>
              {L.heroTitle}
            </h1>
            <p style={{ fontSize: '17px', lineHeight: 1.6, color: c.textMuted, maxWidth: '520px', margin: '0 0 32px' }}>
              {L.heroLead}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/login')}
                style={{ padding: '13px 28px', border: 'none', borderRadius: '10px', background: c.accent, color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                {L.heroCta} →
              </button>
              {token && (
                <button onClick={goApp}
                  style={{ padding: '13px 28px', border: line, borderRadius: '10px', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                  {L.openApp}
                </button>
              )}
            </div>
          </div>

          {/* Спек-блок с крупными цифрами */}
          <div style={{ flex: '1 1 300px', border: line, borderRadius: '14px', overflow: 'hidden' }}>
            <SpecRow c={c} line={line} value="0.93" label={L.metricAuc} big />
            <SpecRow c={c} line={line} value="8"    label={L.metricClasses} big />
            <SpecRow c={c} line={line} value="EfficientNet-B0" label={L.metricArch} />
          </div>
        </section>

        {/* ── Распознаваемые состояния ───────────── */}
        <section style={{ padding: '8px 0 64px' }}>
          <SectionHead c={c} title={L.diseasesTitle} lead={L.diseasesLead} />
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            border: line, borderRadius: '14px', overflow: 'hidden',
          }}>
            {DISEASE_CODES.map((code, i) => (
              <div key={code} style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 22px',
                borderRight: line, borderBottom: line, minWidth: 0,
              }}>
                <span style={{ fontSize: '30px', fontWeight: 700, color: c.accent, fontVariantNumeric: 'tabular-nums', width: '34px', flexShrink: 0 }}>
                  {code}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 500 }}>{tr.classNames[code]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Как это работает ───────────────────── */}
        <section style={{ padding: '8px 0 64px' }}>
          <SectionHead c={c} title={L.howTitle} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', border: line, borderRadius: '14px', overflow: 'hidden' }}>
            {L.steps.map((s, i) => (
              <div key={i} style={{
                flex: '1 1 260px', padding: '28px 26px',
                borderRight: i < L.steps.length - 1 ? line : 'none',
              }}>
                <div style={{ fontSize: '38px', fontWeight: 700, color: c.accent, lineHeight: 1, marginBottom: '16px', fontVariantNumeric: 'tabular-nums' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>{s.title}</div>
                <div style={{ fontSize: '14px', lineHeight: 1.55, color: c.textMuted }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Техническая основа ─────────────────── */}
        <section style={{ padding: '8px 0 72px' }}>
          <SectionHead c={c} title={L.specTitle} />
          <div style={{ border: line, borderRadius: '14px', overflow: 'hidden' }}>
            <SpecRow c={c} line={line} value="EfficientNet-B0" label={L.specModel} />
            <SpecRow c={c} line={line} value="ODIR-5K"         label={L.specDataset} />
            <SpecRow c={c} line={line} value="0.6714"          label={L.specF1} />
            <SpecRow c={c} line={line} value="0.8735"          label={L.specRecall} last />
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────── */}
      <footer style={{ borderTop: line, padding: '24px', textAlign: 'center', fontSize: '13px', color: c.textMuted }}>
        {L.footer} · {'©'} 2026
      </footer>
    </div>
  );
}

function SectionHead({ c, title, lead }) {
  return (
    <div style={{ marginBottom: '24px', maxWidth: '620px' }}>
      <h2 style={{ fontSize: 'clamp(22px, 2.6vw, 32px)', fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 10px' }}>{title}</h2>
      {lead && <p style={{ fontSize: '15px', lineHeight: 1.6, color: c.textMuted, margin: 0 }}>{lead}</p>}
    </div>
  );
}

function SpecRow({ c, line, value, label, big, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: '16px', padding: '20px 24px', borderBottom: last ? 'none' : line,
    }}>
      <span style={{
        fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        fontSize: big ? '40px' : '20px', lineHeight: 1,
        color: big ? c.accent : c.text, letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
      <span style={{ fontSize: '13px', color: c.textMuted, textAlign: 'right' }}>{label}</span>
    </div>
  );
}
