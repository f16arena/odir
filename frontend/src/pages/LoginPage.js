import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, colors } from '../ThemeContext';
import { login } from '../api';

const LANGS = [
  { code: 'ru', flag: '🇷🇺', label: 'RU' },
  { code: 'kz', flag: '🇰🇿', label: 'KZ' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
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

  const pwdCheck = password ? checkPassword(password) : null;
  const strengthColor = { weak:'#e53935', medium:'#fb8c00', strong:'#2e7d32' };
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

  return (
    <div style={{ minHeight:'100vh', background: dark ? '#0f0f1a' : 'linear-gradient(135deg,#1a237e,#0d47a1,#01579b)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:"'Segoe UI', sans-serif" }}>
      <div style={{ position:'fixed', top:'16px', right:'16px', display:'flex', gap:'8px' }}>
        {LANGS.map(l => (
          <button key={l.code} onClick={() => setLang(l.code)} style={{ padding:'6px 10px', borderRadius:'8px', border:`1px solid ${lang===l.code?'#fff':'rgba(255,255,255,0.3)'}`, background: lang===l.code?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.1)', color:'#fff', cursor:'pointer', fontSize:'12px', fontWeight:'600' }}>
            {l.flag} {l.label}
          </button>
        ))}
        <button onClick={toggleDark} style={{ padding:'6px 10px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.1)', color:'#fff', cursor:'pointer', fontSize:'16px' }}>{dark?'☀️':'🌙'}</button>
      </div>

      <div style={{ background:c.bgCard, borderRadius:'20px', padding:'40px', width:'100%', maxWidth:'420px', boxShadow:'0 24px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontSize:'52px', marginBottom:'10px' }}>👁</div>
          <div style={{ fontSize:'22px', fontWeight:'700', color:c.text, marginBottom:'6px' }}>{tr.appName}</div>
          <div style={{ fontSize:'12px', color:c.textMuted }}>{tr.appSubtitle}</div>
        </div>

        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
            <label style={{ fontSize:'12px', fontWeight:'600', color:c.textMuted }}>{tr.email}</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="user@odir.local"
              style={{ padding:'10px 14px', borderRadius:'10px', border:`1.5px solid ${c.inputBorder}`, background:c.inputBg, color:c.text, fontSize:'14px', outline:'none' }} />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
            <label style={{ fontSize:'12px', fontWeight:'600', color:c.textMuted }}>{tr.password}</label>
            <div style={{ position:'relative' }}>
              <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"
                style={{ width:'100%', padding:'10px 40px 10px 14px', borderRadius:'10px', border:`1.5px solid ${c.inputBorder}`, background:c.inputBg, color:c.text, fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
              <button type="button" onClick={()=>setShowPwd(!showPwd)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:c.textMuted }}>
                {showPwd?'🙈':'👁'}
              </button>
            </div>
            {pwdCheck && (
              <div style={{ marginTop:'6px' }}>
                <div style={{ display:'flex', gap:'4px', marginBottom:'6px' }}>
                  {['weak','medium','strong'].map((level,i)=>(
                    <div key={level} style={{ flex:1, height:'4px', borderRadius:'2px', background:['weak','medium','strong'].indexOf(pwdCheck.strength)>=i ? strengthColor[pwdCheck.strength] : (dark?'#2a2a4a':'#e0e0e0'), transition:'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ fontSize:'11px', color:strengthColor[pwdCheck.strength], fontWeight:'600', marginBottom:'4px' }}>{strengthLabel[pwdCheck.strength]}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {pwdCheck.rules.map(r=>(
                    <span key={r.label} style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'10px', background: r.ok?'#e8f5e9':(dark?'#2a2a4a':'#f5f5f5'), color: r.ok?'#2e7d32':c.textMuted }}>
                      {r.ok?'✓':'○'} {r.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <div style={{ padding:'10px 14px', background: dark?'#3a1a1a':'#ffebee', color:'#e53935', borderRadius:'8px', fontSize:'13px' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ padding:'12px', background:'linear-gradient(135deg,#1a237e,#3949ab)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:'600', cursor:'pointer', marginTop:'4px', opacity:loading?0.7:1 }}>
            {loading ? '...' : tr.login}
          </button>
        </form>

        <div style={{ marginTop:'24px', padding:'14px', background: dark?'#1e1e35':'#f8f8ff', borderRadius:'10px', border:`1px solid ${c.border}` }}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:c.textMuted, marginBottom:'8px' }}>{tr.testAccounts}:</div>
          {[
            { role:'Admin',   email:'admin@odir.local',   pass:'Admin@123'   },
            { role:'Doctor',  email:'doctor@odir.local',  pass:'Doctor@123'  },
            { role:'Analyst', email:'analyst@odir.local', pass:'Analyst@123' },
          ].map(acc=>(
            <div key={acc.role} onClick={()=>{setEmail(acc.email);setPassword(acc.pass);}}
              style={{ display:'flex', justifyContent:'space-between', padding:'7px 10px', borderRadius:'7px', cursor:'pointer', marginBottom:'4px', background: dark?'#252540':'#fff', border:`1px solid ${c.border}` }}>
              <span style={{ fontSize:'12px', fontWeight:'600', color:'#3949ab' }}>{acc.role}</span>
              <span style={{ fontSize:'11px', color:c.textMuted, fontFamily:'monospace' }}>{acc.email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
