import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, colors } from '../ThemeContext';
import { login } from '../api';

const LANGS = [
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'KZ' },
  { code: 'en', label: 'EN' },
];

function checkPassword(pwd) {
  const rules = [
    { ok: pwd.length >= 8,        label: '8+ символов'        },
    { ok: /[A-Z]/.test(pwd),      label: 'Заглавная буква'    },
    { ok: /[0-9]/.test(pwd),      label: 'Цифра'              },
    { ok: /[!@#$%^&*]/.test(pwd), label: 'Спецсимвол (!@#$%)' },
  ];
  const passed = rules.filter(r => r.ok).length;
  const strength = passed <= 1 ? 'weak' : passed <= 3 ? 'medium' : 'strong';
  return { rules, strength, valid: passed === 4 };
}

export default function LoginPage() {
  const { dark, lang, setLang, tr, toggleDark } = useTheme();
  const c = colors(dark);
  const navigate = useNavigate();
  const [email,   setEmail]   = useState('');
  const [password,setPassword]= useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const line = `1px solid ${c.border}`;
  const pwdCheck = password ? checkPassword(password) : null;
  const strengthColor = { weak: c.error, medium: c.warning, strong: c.success };
  const strengthLabel = { weak: tr.passwordWeak, medium: tr.passwordMedium, strong: tr.passwordStrong };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem('token',     res.data.access_token);
      localStorage.setItem('role',      res.data.role);
      localStorage.setItem('full_name', res.data.full_name);
      localStorage.setItem('user_id',   res.data.user_id);
      if (res.data.role === 'admin')   navigate('/admin');
      if (res.data.role === 'doctor')  navigate('/doctor');
      if (res.data.role === 'analyst') navigate('/analyst');
    } catch { setError(tr.wrongCreds); }
    finally  { setLoading(false); }
  };

  const inputStyle = {
    padding: '11px 14px', borderRadius: '10px', border: line,
    background: c.inputBg, color: c.text, fontSize: '14px', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', background: c.bg, color: c.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
    }}>
      {/* Переключатели языка и темы */}
      <div style={{ position: 'fixed', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
        <div style={{ display: 'flex', border: line, borderRadius: '8px', overflow: 'hidden' }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)}
              style={{ padding: '6px 11px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                background: lang === l.code ? c.accent : 'transparent', color: lang === l.code ? '#fff' : c.textMuted }}>
              {l.label}
            </button>
          ))}
        </div>
        <button onClick={toggleDark}
          style={{ width: '34px', height: '34px', border: line, borderRadius: '8px', background: c.bgCard, color: c.text, cursor: 'pointer', fontSize: '15px' }}>
          {dark ? '☀' : '☾'}
        </button>
      </div>

      <div style={{ background: c.bgCard, borderRadius: '16px', border: line, padding: '36px', width: '100%', maxWidth: '400px', boxShadow: c.shadowLg }}>
        {/* Заголовок */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '34px', marginBottom: '12px' }}>👁</div>
          <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em' }}>{tr.appName}</div>
          <div style={{ fontSize: '13px', color: c.textMuted, marginTop: '4px' }}>{tr.appSubtitle}</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted }}>{tr.email}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="user@odir.local" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted }}>{tr.password}</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                style={{ ...inputStyle, padding: '11px 40px 11px 14px' }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: c.textMuted }}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
            {pwdCheck && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                  {['weak', 'medium', 'strong'].map((level, i) => (
                    <div key={level} style={{ flex: 1, height: '3px', borderRadius: '2px',
                      background: ['weak', 'medium', 'strong'].indexOf(pwdCheck.strength) >= i ? strengthColor[pwdCheck.strength] : c.border }} />
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: strengthColor[pwdCheck.strength], fontWeight: 600, marginBottom: '6px' }}>{strengthLabel[pwdCheck.strength]}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {pwdCheck.rules.map(r => (
                    <span key={r.label} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', border: line,
                      background: 'transparent', color: r.ok ? c.success : c.textMuted }}>
                      {r.ok ? '✓' : '○'} {r.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <div style={{ padding: '10px 14px', background: 'transparent', color: c.error, border: `1px solid ${c.error}`, borderRadius: '8px', fontSize: '13px' }}>{error}</div>}

          <button type="submit" disabled={loading}
            style={{ padding: '12px', background: c.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginTop: '4px', opacity: loading ? 0.7 : 1 }}>
            {loading ? '...' : tr.login}
          </button>
        </form>

        {/* Тестовые аккаунты */}
        <div style={{ marginTop: '24px', borderTop: line, paddingTop: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: c.textMuted, marginBottom: '10px' }}>{tr.testAccounts}</div>
          {[
            { role: 'Admin',   email: 'admin@odir.local',   pass: 'Admin@123'   },
            { role: 'Doctor',  email: 'doctor@odir.local',  pass: 'Doctor@123'  },
            { role: 'Analyst', email: 'analyst@odir.local', pass: 'Analyst@123' },
          ].map(acc => (
            <div key={acc.role} onClick={() => { setEmail(acc.email); setPassword(acc.pass); }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '6px', border: line }}
              onMouseEnter={e => e.currentTarget.style.background = c.bgHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: c.accent }}>{acc.role}</span>
              <span style={{ fontSize: '11px', color: c.textMuted, fontFamily: 'monospace' }}>{acc.email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
