import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ExternalLink, ArrowRight } from 'lucide-react';
import { useWaitlist } from '../App';

const ROUTE_THEMES = {
  '/products/habit': 'habit',
  '/habit/privacy': 'habit',
  '/habit/terms': 'habit',
  '/products/studio': 'studioapp',
  '/products/desk': 'desk',
};

function getTheme(pathname) {
  return ROUTE_THEMES[pathname] || 'studio';
}

export default function Layout({ children }) {
  const location = useLocation();
  const theme = getTheme(location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openWaitlist } = useWaitlist();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProductsOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backdropFilter: scrolled ? 'blur(24px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
    backgroundColor: scrolled ? 'rgba(4,3,10,0.88)' : 'transparent',
    borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  };

  const linkStyle = {
    color: 'var(--text1)',
    fontSize: '0.875rem',
    fontWeight: 500,
    textDecoration: 'none',
    fontFamily: 'Manrope, sans-serif',
    transition: 'color 0.2s ease',
  };

  return (
    <div style={{ backgroundColor: 'var(--bg0)', minHeight: '100vh' }}>
      {/* ── HEADER ── */}
      <header style={navStyle}>
        <div
          className="section-container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}
        >
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', flexShrink: 0 }}>
            <img
              src="/brand/vibeforge-logo.png"
              alt="VibeForge Studios"
              style={{ height: '34px', width: '34px', objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--text0)' }}>
              VibeForge Studios
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="nav-desktop" style={{ alignItems: 'center', gap: '2.25rem' }}>
            {/* Products dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProductsOpen(!productsOpen)}
                onBlur={() => setTimeout(() => setProductsOpen(false), 150)}
                style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text0)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text1)'}
              >
                Products <ChevronDown size={13} />
              </button>
              {productsOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 14px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(7,8,18,0.96)',
                  border: '1px solid var(--border)',
                  borderRadius: '18px',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  padding: '0.625rem',
                  minWidth: '220px',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
                  animation: 'fadeIn 0.15s ease',
                }}>
                  {[
                    { to: '/products/habit', label: 'Habit', desc: 'Identity-first habits', color: '#00D8FF' },
                    { to: '/products/studio', label: 'Studio App', desc: 'App creation pipeline', color: '#FF4DFF' },
                    { to: '/products/desk', label: 'Desk', desc: 'Modular command surface', color: '#7EDE97' },
                  ].map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setProductsOpen(false)}
                      style={{ display: 'block', padding: '0.75rem 1rem', borderRadius: '12px', textDecoration: 'none', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <div style={{ color: 'var(--text0)', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{item.label}</div>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.2rem', paddingLeft: '1rem' }}>{item.desc}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {[
              { to: '/about', label: 'About' },
              { to: '/support', label: 'Support' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={linkStyle}
                onMouseEnter={e => e.target.style.color = 'var(--text0)'}
                onMouseLeave={e => e.target.style.color = 'var(--text1)'}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button
              onClick={() => openWaitlist('ecosystem')}
              className="vf-btn-primary nav-cta-desktop"
              style={{ padding: '0.625rem 1.375rem', fontSize: '0.8125rem' }}
              data-testid="nav-waitlist-btn"
            >
              Join Waitlist
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="nav-mobile-btn"
              style={{ color: 'var(--text0)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
              data-testid="mobile-menu-btn"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: 'rgba(4,3,10,0.98)', borderTop: '1px solid var(--border)', padding: '1.5rem 1.5rem 2rem', backdropFilter: 'blur(20px)' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { to: '/products', label: 'All Products', sub: false },
                { to: '/products/habit', label: 'Habit', sub: true },
                { to: '/products/studio', label: 'Studio App', sub: true },
                { to: '/products/desk', label: 'Desk', sub: true },
                { to: '/about', label: 'About', sub: false },
                { to: '/support', label: 'Support', sub: false },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    color: item.sub ? 'var(--text1)' : 'var(--text0)',
                    textDecoration: 'none',
                    fontWeight: item.sub ? 500 : 700,
                    fontFamily: 'Syne, sans-serif',
                    fontSize: item.sub ? '0.9375rem' : '1rem',
                    paddingLeft: item.sub ? '1rem' : '0',
                    paddingTop: '0.875rem',
                    paddingBottom: item.sub ? '0.5rem' : '0.875rem',
                    borderBottom: !item.sub ? '1px solid var(--border)' : 'none',
                    display: 'block',
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => openWaitlist('ecosystem')}
                className="vf-btn-primary"
                style={{ marginTop: '1.5rem', justifyContent: 'center' }}
                data-testid="mobile-waitlist-btn"
              >
                Join Waitlist <ArrowRight size={15} />
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* PAGE CONTENT */}
      <main style={{ paddingTop: '72px' }}>
        {children}
      </main>

      {/* FOOTER */}
      <Footer openWaitlist={openWaitlist} />
    </div>
  );
}

function Footer({ openWaitlist }) {
  const cols = [
    {
      title: 'Products',
      links: [
        { to: '/products', label: 'All Products', external: false },
        { to: '/products/habit', label: 'Habit', external: false },
        { to: '/products/studio', label: 'Studio App', external: false },
        { to: '/products/desk', label: 'Desk', external: false },
      ],
    },
    {
      title: 'Company',
      links: [
        { to: '/about', label: 'About', external: false },
        { to: '/support', label: 'Support', external: false },
        { to: 'mailto:immersivetechs@icloud.com', label: 'immersivetechs@icloud.com', external: true },
      ],
    },
    {
      title: 'Legal',
      links: [
        { to: '/privacy', label: 'Privacy Policy', external: false },
        { to: '/terms', label: 'Terms of Service', external: false },
      ],
    },
  ];

  const footerLinkStyle = {
    color: 'var(--text1)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    transition: 'color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  return (
    <footer style={{ background: 'var(--bg1)', borderTop: '1px solid var(--border)', marginTop: '5rem' }}>
      <div className="section-container" style={{ padding: '5rem 1.5rem 2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <img src="/brand/vibeforge-logo.png" alt="VibeForge Studios" style={{ height: '28px', width: '28px', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text0)' }}>VibeForge Studios</span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.65, maxWidth: '220px' }}>
              Forge what's next. Disciplined systems for identity, execution, and creation.
            </p>
          </div>

          {/* Nav cols */}
          {cols.map(col => (
            <div key={col.title}>
              <h4 style={{ color: 'var(--text0)', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                {col.title}
              </h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {col.links.map(link => (
                  link.external ? (
                    <a
                      key={link.label}
                      href={link.to}
                      style={footerLinkStyle}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent0)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text1)'}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.to}
                      to={link.to}
                      style={footerLinkStyle}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent0)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text1)'}
                    >
                      {link.label}
                    </Link>
                  )
                ))}
              </nav>
            </div>
          ))}

          {/* Habit Legal */}
          <div>
            <h4 style={{ color: 'var(--text0)', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Habit Legal
            </h4>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <Link to="/habit/privacy" style={footerLinkStyle} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent0)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text1)'}>
                Habit Privacy
              </Link>
              <Link to="/habit/terms" style={footerLinkStyle} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent0)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text1)'}>
                Habit Terms
              </Link>
              <a
                href="https://docs.google.com/document/d/19yeXgkDZ2WP4N3SpKb7wyOb3Ar4_SJhLPdzJpW_TlWs/edit?usp=drivesdk"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...footerLinkStyle, color: 'var(--muted)', fontSize: '0.8125rem' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent0)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
              >
                Habit Privacy (Doc) <ExternalLink size={11} />
              </a>
              <a
                href="https://docs.google.com/document/d/17meUk5SNoVh0jY6mzxd24Rcmmw15SqVMRWYqJAc201Q/edit?usp=drivesdk"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...footerLinkStyle, color: 'var(--muted)', fontSize: '0.8125rem' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent0)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
              >
                Habit Terms (Doc) <ExternalLink size={11} />
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
            &copy; {new Date().getFullYear()} VibeForge Studios LLC. All rights reserved.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.6875rem', opacity: 0.45 }}>
            Products by VibeForge Studios, under Nemurium.
          </p>
        </div>
      </div>
    </footer>
  );
}
