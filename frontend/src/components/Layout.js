import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme, colors } from '../ThemeContext';
import WelcomeGuide from './WelcomeGuide';

const LANGS = [
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'kz', label: 'KZ', flag: '🇰🇿' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
];

export default function Layout({ children, menuItems, sidebarColor }) {
  const { dark, toggleDark, lang, setLang, tr } = useTheme();
  const c = colors(dark);
  const navigate  = useNavigate();
  const location  = useLocation();
  const fullName  = localStorage.getItem('full_name') || '';
  const [collapsed, setCollapsed] = useState(false);
  const [showLangs, setShowLangs] = useState(false);

  const bgSidebar = sidebarColor || (dark ? '#12122a' : '#1a237e');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif", background: c.bg }}>
      <WelcomeGuide />

      <aside style={{
        width: collapsed ? '64px' : '230px',
        transition: 'width 0.25s',
        overflow: 'hidden',
        flexShrink: 0,
        background: bgSidebar,
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '26px' }}>👁</span>
          {!collapsed && <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap' }}>ODIR</span>}
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
            return (
              <div key={item.path} onClick={() => navigate(item.path)} title={collapsed ? item.label : ''}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', borderRadius: '10px', margin: '2px 0', cursor: 'pointer', background: active ? 'rgba(255,255,255,0.18)' : 'transparent', color: '#fff', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: '14px', fontWeight: active ? '600' : '400' }}>{item.label}</span>}
              </div>
            );
          })}
        </nav>

        {!collapsed && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
            <button onClick={handleLogout} style={{ marginTop: '8px', width: '100%', padding: '7px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              {tr.logout}
            </button>
          </div>
        )}
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '58px', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', background: c.bgCard, borderBottom: `1px solid ${c.border}`, flexShrink: 0, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: c.textMuted, padding: '4px 8px', borderRadius: '6px' }}>☰</button>
          <div style={{ flex: 1 }} />

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowLangs(!showLangs)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: c.text }}>
              {LANGS.find(l => l.code === lang)?.flag} {lang.toUpperCase()} ▾
            </button>
            {showLangs && (
              <div style={{ position: 'absolute', right: 0, top: '38px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden', zIndex: 100, boxShadow: c.shadow, minWidth: '110px' }}>
                {LANGS.map(l => (
                  <div key={l.code} onClick={() => { setLang(l.code); setShowLangs(false); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: lang === l.code ? '600' : '400', color: c.text, background: lang === l.code ? (dark ? '#1e1e35' : '#f0f0ff') : 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {l.flag} {l.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={toggleDark} style={{ width: '38px', height: '38px', borderRadius: '10px', background: c.bg, border: `1px solid ${c.border}`, cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
