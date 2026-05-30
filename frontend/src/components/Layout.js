import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme, colors } from '../ThemeContext';
import WelcomeGuide from './WelcomeGuide';

const LANGS = [
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'KZ' },
  { code: 'en', label: 'EN' },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return mobile;
}

export default function Layout({ children, menuItems, sidebarColor }) {
  const { dark, toggleDark, lang, setLang, tr } = useTheme();
  const c = colors(dark);
  const navigate  = useNavigate();
  const location  = useLocation();
  const fullName  = localStorage.getItem('full_name') || '';
  const isMobile  = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);  // десктоп: узкий сайдбар
  const [mobileOpen, setMobileOpen] = useState(false); // мобайл: выезжающее меню
  const [showLangs, setShowLangs] = useState(false);

  const bgSidebar  = sidebarColor || (dark ? '#12122a' : '#1a237e');
  const showLabels = isMobile || !collapsed;
  const sidebarW   = isMobile ? '250px' : (collapsed ? '64px' : '230px');

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const onMenuClick  = (path) => { navigate(path); if (isMobile) setMobileOpen(false); };
  const onBurger     = () => isMobile ? setMobileOpen(o => !o) : setCollapsed(v => !v);

  const asideBase = {
    width: sidebarW, background: bgSidebar,
    display: 'flex', flexDirection: 'column', flexShrink: 0,
    boxShadow: '4px 0 20px rgba(0,0,0,0.15)', overflow: 'hidden',
  };
  const asideStyle = isMobile
    ? { ...asideBase, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 200,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s' }
    : { ...asideBase, transition: 'width 0.25s' };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif", background: c.bg }}>
      <WelcomeGuide />

      {/* Затемнение под мобильным меню */}
      {isMobile && mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 150 }} />
      )}

      <aside style={asideStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '26px' }}>👁</span>
          {showLabels && <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>ODIR</span>}
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
            return (
              <div key={item.path} onClick={() => onMenuClick(item.path)} title={showLabels ? '' : item.label}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', borderRadius: '10px', margin: '2px 0', cursor: 'pointer', background: active ? 'rgba(255,255,255,0.18)' : 'transparent', color: '#fff', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                {showLabels && <span style={{ fontSize: '14px', fontWeight: active ? 600 : 400 }}>{item.label}</span>}
              </div>
            );
          })}
        </nav>

        {showLabels && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
            <button onClick={handleLogout} style={{ marginTop: '8px', width: '100%', padding: '7px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              {tr.logout}
            </button>
          </div>
        )}
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ height: '58px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', background: c.bgCard, borderBottom: `1px solid ${c.border}`, flexShrink: 0, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <button onClick={onBurger} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: c.textMuted, padding: '4px 8px', borderRadius: '6px' }}>☰</button>
          <div style={{ flex: 1 }} />

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowLangs(!showLangs)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: c.text }}>
              {lang.toUpperCase()} ▾
            </button>
            {showLangs && (
              <div style={{ position: 'absolute', right: 0, top: '38px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden', zIndex: 100, boxShadow: c.shadowLg, minWidth: '110px' }}>
                {LANGS.map(l => (
                  <div key={l.code} onClick={() => { setLang(l.code); setShowLangs(false); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: lang === l.code ? 600 : 400, color: lang === l.code ? c.accent : c.text, background: lang === l.code ? c.bgHover : 'transparent' }}>
                    {l.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={toggleDark} style={{ width: '38px', height: '38px', borderRadius: '10px', background: c.bg, border: `1px solid ${c.border}`, cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.text }}>
            {dark ? '☀' : '☾'}
          </button>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
