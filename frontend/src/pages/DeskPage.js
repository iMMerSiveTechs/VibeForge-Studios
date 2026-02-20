import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, ChevronDown, ChevronUp, Apple, Smartphone } from 'lucide-react';
import axios from 'axios';
import { useWaitlist } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MODULES = [
  { name: 'Master Plan', chip: 'STRATEGY', bg: '#0d0f1a', accent: '#506AF2', accentPos: 'left', textColor: '#fff', subColor: 'rgba(255,255,255,0.4)', chipBg: 'rgba(255,255,255,0.08)', chipBorder: 'rgba(255,255,255,0.12)', chipColor: 'rgba(255,255,255,0.6)', desc: 'Your long-term strategy board. Set high-level goals and break them into executable phases with full context preserved.' },
  { name: 'Task Planner', chip: 'DAILY LOG', bg: '#253334', accent: '#7EDE97', accentPos: null, textColor: '#fff', subColor: 'rgba(255,255,255,0.45)', chipBg: 'rgba(126,222,151,0.15)', chipBorder: 'rgba(126,222,151,0.25)', chipColor: '#7EDE97', desc: 'Daily and weekly task management with priority ranking. Your command center for what needs to happen today.' },
  { name: 'Stickies', chip: 'QUICK CAPTURE', bg: '#F8DC5F', accent: null, accentPos: null, textColor: '#111', subColor: 'rgba(0,0,0,0.4)', chipBg: 'rgba(0,0,0,0.08)', chipBorder: 'rgba(0,0,0,0.12)', chipColor: 'rgba(0,0,0,0.6)', desc: 'Frictionless capture for ideas, notes, and fragments. Think it — capture it — refine it later.' },
  { name: 'Steno Notebook', chip: 'REFINEMENT', bg: '#D9DBE7', accent: null, accentPos: null, textColor: '#1a1a2e', subColor: 'rgba(0,0,0,0.38)', chipBg: 'rgba(0,0,0,0.06)', chipBorder: 'rgba(0,0,0,0.1)', chipColor: 'rgba(0,0,0,0.5)', isSteno: true, desc: 'A structured notebook for thinking through complex problems. Ruled pages, margin space, and linked entries.' },
  { name: 'Vault', chip: 'ARCHIVE', bg: '#0A0E19', accent: '#506AF2', accentPos: 'top', textColor: '#fff', subColor: 'rgba(255,255,255,0.4)', chipBg: 'rgba(80,106,242,0.12)', chipBorder: 'rgba(80,106,242,0.25)', chipColor: '#506AF2', desc: 'Permanent storage for completed plans, archived notes, and reference material you need to keep but not see every day.' },
  { name: 'Journal', chip: 'REFLECTION', bg: '#111820', accent: '#F8DC5F', accentPos: null, textColor: '#fff', subColor: 'rgba(255,255,255,0.4)', chipBg: 'rgba(248,220,95,0.12)', chipBorder: 'rgba(248,220,95,0.25)', chipColor: '#F8DC5F', desc: 'Daily reflections and long-form entries. Your private space to process, record, and learn from each day.' },
];

const THEMES = [
  { name: 'Stealth Founder', colors: ['#111', '#e24b5a', '#6b7280', '#f5c842'] },
  { name: 'Marble Classic', colors: ['#1a0f0f', '#c8821a', '#6b7280', '#f5c842'] },
  { name: 'Midnight Terminal', colors: ['#040408', '#506AF2', '#253334', '#F8DC5F'] },
  { name: 'Warm Studio', colors: ['#1c0f0a', '#e07030', '#7a7d48', '#f5c842'] },
  { name: 'Arctic Minimal', colors: ['#f8fafc', '#3b82f6', '#14532d', '#f5c842'] },
  { name: 'Noir Brass', colors: ['#0a0a0a', '#c9a86c', '#5a6b5c', '#cdb48c'] },
  { name: 'Neon Nightshift', colors: ['#040408', '#ec4899', '#10b981', '#f5c842'] },
  { name: 'Sandstone Paper', colors: ['#2a1a0e', '#d07030', '#6b7a48', '#f5c842'] },
];

const DESIGN_PACKS = [
  { name: 'Metallic', desc: 'Chrome and steel tones with polished surfaces' },
  { name: 'Neon', desc: 'High-contrast glow effects and vivid accents' },
  { name: 'Flat', desc: 'Clean, solid fills with sharp borders' },
  { name: 'Pastel', desc: 'Soft, muted tones for a calm workspace' },
  { name: 'Vintage Typewriter', desc: 'Sepia tones, worn edges, and typeface nostalgia' },
  { name: 'Blueprint Grid', desc: 'Technical grid overlay for the systems-oriented mind' },
];

const FAQS = [
  { q: 'What is VibeForge Desk?', a: 'Desk is a modular command surface — a single app that combines your strategic planning, daily tasks, quick capture, structured notes, archive, and journal into one cohesive workspace.' },
  { q: 'What modules are included?', a: 'Desk includes: Master Plan (strategy), Task Planner (daily log), Stickies (quick capture), Steno Notebook (refinement), Vault (archive), and Journal (reflection).' },
  { q: 'What is the Master Plan?', a: 'Master Plan is your long-term strategy board. Set high-level goals, break them into phases, and maintain full context as you execute. Built for people who think in systems.' },
  { q: 'What is the Task Planner?', a: 'Task Planner is your daily and weekly task command center. Priority ranking, completion tracking, and a daily log view to see exactly what needs to happen today.' },
  { q: 'What are Stickies?', a: 'Stickies is frictionless quick capture — the yellow tile on your Desk. Capture thoughts, ideas, and fragments instantly without friction. Refine them later.' },
  { q: 'What is the Steno Notebook?', a: 'A structured, ruled notebook for deep thinking and problem refinement. Think of it as the paper-gray quadrant on your Desk — for ideas that need more than a sticky.' },
  { q: 'What is Scan to Desk?', a: 'Scan to Desk is a feature that lets you capture physical notes, whiteboard sessions, or printed documents directly into your Desk modules using your device camera.' },
  { q: 'Are there different themes?', a: 'Yes. Desk supports 8 full themes: Stealth Founder, Marble Classic, Midnight Terminal, Warm Studio, Arctic Minimal, Noir Brass, Neon Nightshift, and Sandstone Paper.' },
  { q: 'What are Design Packs?', a: 'Design Packs add visual texture and treatment on top of themes: Metallic, Neon, Flat, Pastel, Vintage Typewriter, and Blueprint Grid. Mix a theme with a pack for a fully customized workspace.' },
  { q: 'What platforms will Desk be available on?', a: 'Desk will launch on iOS and Android. Join the waitlist for early access details.' },
  { q: 'How does Vault work?', a: 'Vault is permanent storage for completed plans, archived notes, and reference material. Items moved to Vault leave your active workspace clean while remaining fully searchable.' },
  { q: 'What is Journal?', a: 'Journal is your private daily reflection space. Long-form entries, date-linked, never shown in the main Desk grid. A place to process, record, and learn from each day.' },
];

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div data-testid="desk-faq">
      {items.map((item, i) => (
        <div key={i} className="faq-item">
          <button className="faq-question" onClick={() => setOpen(open === i ? null : i)} data-testid={`desk-faq-item-${i}`}>
            {item.q}
            {open === i ? <ChevronUp size={18} color="var(--accent0)" /> : <ChevronDown size={18} color="var(--muted)" />}
          </button>
          {open === i && <div className="faq-answer">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

function DeskTileGallery() {
  // Matches the Desk app screenshots exactly
  return (
    <div style={{ maxWidth: '440px', margin: '0 auto' }}>
      {/* Search bar mock */}
      <div style={{ background: '#111820', borderRadius: '14px', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.25)' }} />
        </div>
        <span style={{ color: 'rgba(243,247,255,0.3)', fontSize: '0.9375rem', fontFamily: 'Manrope, sans-serif' }}>Search all items...</span>
      </div>

      {/* Scan to Desk button */}
      <div style={{ background: '#1e2d2e', borderRadius: '14px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.875rem', marginBottom: '0.875rem', border: '1px solid rgba(126,222,151,0.2)', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.background = '#253334'}
        onMouseLeave={e => e.currentTarget.style.background = '#1e2d2e'}
      >
        <div style={{ width: '20px', height: '16px', border: '2px solid #7EDE97', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '6px', height: '6px', border: '1.5px solid #7EDE97', borderRadius: '1px' }} />
        </div>
        <span style={{ color: '#7EDE97', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em' }}>Scan to Desk</span>
      </div>

      {/* 2×2 tile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
        {/* Master Plan */}
        <div className="desk-tile" style={{ background: '#0d0f1a', minHeight: '160px', paddingLeft: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#506AF2', borderRadius: '18px 0 0 18px' }} />
          <div className="desk-chip" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>STRATEGY</div>
          <div style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.0625rem' }}>Master Plan</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '0.25rem' }}>2 items</div>
        </div>

        {/* Task Planner */}
        <div className="desk-tile" style={{ background: '#253334', minHeight: '160px', border: '1px solid rgba(126,222,151,0.15)' }}>
          <div className="desk-chip" style={{ background: 'rgba(126,222,151,0.15)', border: '1px solid rgba(126,222,151,0.25)', color: '#7EDE97' }}>DAILY LOG</div>
          <div style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.0625rem' }}>Task Planner</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginTop: '0.25rem' }}>4 items</div>
        </div>

        {/* Stickies */}
        <div className="desk-tile" style={{ background: '#F8DC5F', minHeight: '160px', border: '1px solid rgba(0,0,0,0.1)' }}>
          <div className="desk-chip" style={{ background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.6)' }}>QUICK CAPTURE</div>
          <div style={{ color: '#111', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.0625rem' }}>Stickies</div>
          <div style={{ color: 'rgba(0,0,0,0.4)', fontSize: '0.75rem', marginTop: '0.25rem' }}>2 items</div>
        </div>

        {/* Steno Notebook */}
        <div className="desk-tile" style={{ background: '#D9DBE7', minHeight: '160px', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Ruled lines */}
          {[0, 1, 2, 3, 4, 5].map(j => (
            <div key={j} style={{ position: 'absolute', left: '1.25rem', right: '1.25rem', height: '1px', background: 'rgba(200,0,0,0.12)', top: `${16 + j * 22}px` }} />
          ))}
          {/* Left margin line */}
          <div style={{ position: 'absolute', left: '2.5rem', top: 0, bottom: 0, width: '1px', background: 'rgba(200,0,0,0.15)' }} />
          <div className="desk-chip" style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.5)', position: 'relative', zIndex: 1 }}>REFINEMENT</div>
          <div style={{ color: '#1a1a2e', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.0625rem', position: 'relative', zIndex: 1 }}>Steno Notebook</div>
          <div style={{ color: 'rgba(0,0,0,0.38)', fontSize: '0.75rem', marginTop: '0.25rem', position: 'relative', zIndex: 1 }}>4 items</div>
        </div>
      </div>

      {/* Vault + Journal row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <div style={{ background: '#0A0E19', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(80,106,242,0.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#506AF2' }} />
          <div style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem' }}>Vault</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>2 items</div>
        </div>
        <div style={{ background: '#111820', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(248,220,95,0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#F8DC5F' }} />
          <div style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem' }}>Journal</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>1 item</div>
        </div>
      </div>
    </div>
  );
}

function WaitlistInline({ product }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/waitlist`, { email: email.trim(), productKey: product, sourcePage: '/products/desk' });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.status === 409 ? 'Already on the list.' : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--chipBg)', border: '1px solid var(--chipBorder)', borderRadius: '16px' }}>
        <p style={{ color: 'var(--accent0)', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.125rem' }}>You're in. Founder access will be sent at launch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" required className="vf-input" style={{ flex: 1, minWidth: '200px' }} data-testid="desk-inline-email" />
      <button type="submit" disabled={loading} className="vf-btn-primary" style={{ flexShrink: 0, opacity: loading ? 0.7 : 1 }} data-testid="desk-inline-submit">
        {loading ? 'Joining...' : 'Get Early Access →'}
      </button>
      {error && <p style={{ width: '100%', color: '#ff6b6b', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
    </form>
  );
}

const deskSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VibeForge Desk',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'iOS, Android',
  description: 'A modular command surface for plans, tasks, capture, and notes.',
});

export default function DeskPage() {
  const { openWaitlist } = useWaitlist();

  return (
    <>
      <Helmet>
        <title>VibeForge Desk — Your Modular Command Surface | VibeForge Studios</title>
        <meta name="description" content="Master Plan. Task Planner. Stickies. Steno Notebook. Vault. Journal. One modular command surface for plans, tasks, capture, and notes." />
        <meta property="og:title" content="VibeForge Desk — Your Modular Command Surface" />
        <meta property="og:description" content="A modular command surface for plans, tasks, capture, and notes." />
      </Helmet>

      {/* ─── HERO ─── */}
      <section style={{ minHeight: '95vh', display: 'flex', alignItems: 'center', background: 'var(--bg0)', position: 'relative', overflow: 'hidden', paddingTop: '2rem' }}>
        <div className="hero-glow" style={{ width: 500, height: 500, background: 'rgba(126,222,151,0.06)', top: '-10%', right: '-5%' }} />
        <div className="hero-glow" style={{ width: 350, height: 350, background: 'rgba(80,106,242,0.05)', bottom: '10%', left: '-5%' }} />

        <div className="section-container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div className="vf-chip animate-fade-up" style={{ marginBottom: '2rem' }}>Modular Workspace</div>
              <h1
                className="animate-fade-up delay-1"
                style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 800, color: 'var(--text0)', lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: '1.75rem' }}
                data-testid="desk-hero-heading"
              >
                VibeForge<br />
                <span style={{ color: 'var(--accent0)' }}>Desk</span>
              </h1>
              <p className="animate-fade-up delay-2" style={{ color: 'var(--text0)', fontSize: 'clamp(1.125rem, 2vw, 1.375rem)', fontWeight: 600, fontFamily: 'Syne, sans-serif', marginBottom: '1rem' }}>
                Your modular command surface.
              </p>
              <p className="animate-fade-up delay-3" style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
                Master Plan. Task Planner. Stickies. Steno Notebook. Vault. Journal. One system — completely yours.
              </p>
              <div className="animate-fade-up delay-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                  onClick={() => openWaitlist('desk')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9375rem 2.25rem', background: 'var(--surface1)', color: 'var(--accent0)', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9375rem', borderRadius: '100px', border: '1px solid var(--accent0)', cursor: 'pointer', transition: 'background 0.2s ease', letterSpacing: '0.01em' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(126,222,151,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface1)'}
                  data-testid="desk-waitlist-btn"
                >
                  Join Waitlist <ArrowRight size={16} />
                </button>
                <a href="#modules" className="vf-btn-ghost" style={{ padding: '0.9375rem 2.25rem', fontSize: '0.9375rem' }}>
                  Explore Modules
                </a>
              </div>
            </div>

            {/* App Gallery Mock */}
            <div className="animate-fade-up delay-3">
              <DeskTileGallery />
            </div>
          </div>
        </div>

        <div className="gradient-line" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </section>

      {/* ─── SCAN TO DESK ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg1)' }}>
        <div className="section-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Scan to Desk</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }}>
                Physical notes.<br />
                <span style={{ color: 'var(--accent0)' }}>Into your Desk.</span>
              </h2>
              <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.7 }}>
                Capture whiteboards, printed documents, handwritten notes, and sticky notes directly into any Desk module using your device camera. Everything captured, nothing lost.
              </p>
            </div>
            <div>
              <div style={{ background: 'var(--surface1)', borderRadius: '20px', padding: '2.5rem', border: '1px solid rgba(126,222,151,0.2)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { step: '01', label: 'Point camera at document, whiteboard, or handwritten note' },
                  { step: '02', label: 'Scan captures and processes the content' },
                  { step: '03', label: 'Route to any Desk module — Master Plan, Stickies, Steno, or Vault' },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(126,222,151,0.12)', border: '1px solid rgba(126,222,151,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7EDE97', fontSize: '0.6875rem', fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>
                      {s.step}
                    </div>
                    <p style={{ color: 'var(--text1)', fontSize: '0.9375rem', lineHeight: 1.6, paddingTop: '0.375rem' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MODULES ─── */}
      <section id="modules" style={{ padding: '9rem 0', background: 'var(--bg0)' }} data-testid="desk-modules">
        <div className="section-container">
          <div style={{ marginBottom: '5rem' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Modules</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Six modules.<br />
              <span style={{ color: 'var(--accent0)' }}>One surface.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {MODULES.map((mod, i) => (
              <div
                key={mod.name}
                className={`animate-fade-up delay-${i % 3 + 1}`}
                style={{
                  background: mod.bg,
                  borderRadius: '20px',
                  padding: '2rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                data-testid={`desk-module-${mod.name.toLowerCase().replace(' ', '-')}`}
              >
                {mod.accentPos === 'left' && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: mod.accent, borderRadius: '20px 0 0 20px' }} />
                )}
                {mod.accentPos === 'top' && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: mod.accent }} />
                )}
                {mod.isSteno && [...Array(5)].map((_, j) => (
                  <div key={j} style={{ position: 'absolute', left: '2rem', right: '1.25rem', height: '1px', background: 'rgba(200,0,0,0.1)', top: `${40 + j * 20}px` }} />
                ))}

                <div style={{ paddingLeft: mod.accentPos === 'left' ? '0.75rem' : '0' }}>
                  <div style={{ display: 'inline-block', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12em', borderRadius: '100px', padding: '3px 10px', marginBottom: '2rem', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif', background: mod.chipBg, border: `1px solid ${mod.chipBorder}`, color: mod.chipColor }}>
                    {mod.chip}
                  </div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.125rem', fontWeight: 800, color: mod.textColor, marginBottom: '0.5rem' }}>{mod.name}</h3>
                  <p style={{ color: mod.subColor, fontSize: '0.875rem', lineHeight: 1.6 }}>{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THEMES ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg1)' }} data-testid="desk-themes">
        <div className="section-container">
          <div style={{ marginBottom: '5rem' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Themes & Design Packs</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Your Desk.<br />
              <span style={{ color: 'var(--accent0)' }}>Your aesthetic.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem' }}>
            {/* Themes */}
            <div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.25rem' }}>
                Available Themes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {THEMES.map(theme => (
                  <div
                    key={theme.name}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '14px', transition: 'border-color 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent0)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    data-testid={`theme-${theme.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <span style={{ color: 'var(--text0)', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9375rem' }}>{theme.name}</span>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {theme.colors.map((c, i) => (
                        <div key={i} style={{ width: '22px', height: '22px', borderRadius: '6px', background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Design Packs */}
            <div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.25rem' }}>
                Design Packs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {DESIGN_PACKS.map(pack => (
                  <div
                    key={pack.name}
                    style={{ padding: '1.25rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '14px', transition: 'border-color 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent0)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    data-testid={`design-pack-${pack.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <div style={{ color: 'var(--text0)', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{pack.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>{pack.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DOWNLOAD BUTTONS ─── */}
      <section style={{ padding: '5rem 0', background: 'var(--bg0)' }}>
        <div className="section-container" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Available on</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {[{ icon: Apple, label: 'App Store' }, { icon: Smartphone, label: 'Google Play' }].map(({ icon: Icon, label }) => (
              <button key={label} disabled style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.75rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '14px', color: 'var(--muted)', cursor: 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: 0.6 }}>
                <Icon size={20} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Coming Soon</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg1)' }}>
        <div className="section-container">
          <div style={{ marginBottom: '4rem' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>FAQ</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Frequently asked questions
            </h2>
          </div>
          <div style={{ maxWidth: '720px' }}>
            <FAQ items={FAQS} />
          </div>
        </div>
      </section>

      {/* ─── WAITLIST ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg0)', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-glow" style={{ width: 400, height: 400, background: 'rgba(126,222,151,0.06)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '620px' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Early Access</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }}>
              Command your day.<br />
              <span style={{ color: 'var(--accent0)' }}>Join the waitlist.</span>
            </h2>
            <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
              Founder access at launch. Pricing locked for 12 months.
            </p>
            <WaitlistInline product="desk" />
          </div>
        </div>
      </section>
    </>
  );
}
