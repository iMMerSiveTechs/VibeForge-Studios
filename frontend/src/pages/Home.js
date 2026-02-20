import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Target, Shield, Rocket, Brain } from 'lucide-react';
import { useWaitlist } from '../App';

const PRODUCTS = [
  {
    id: 'habit',
    name: 'Habit',
    tagline: 'Become who you\'re meant to be.',
    desc: 'Identity-first habit building with 30-day routes that turn intention into consistency.',
    accent: '#00D8FF',
    path: '/products/habit',
    chip: 'Identity-first',
    product: 'habit',
  },
  {
    id: 'studio',
    name: 'Studio App',
    tagline: 'From idea to App Store — in a disciplined pipeline.',
    desc: 'Automated app creation from blueprint to launch. Full deliverables. Zero guesswork.',
    accent: '#FF4DFF',
    path: '/products/studio',
    chip: 'Automated',
    product: 'studio',
  },
  {
    id: 'desk',
    name: 'Desk',
    tagline: 'Your modular command surface.',
    desc: 'Master Plan. Task Planner. Stickies. Steno Notebook. One system for everything.',
    accent: '#7EDE97',
    path: '/products/desk',
    chip: 'Modular',
    product: 'desk',
  },
];

const PIPELINE = [
  { stage: 'Discover', desc: 'Research + validation' },
  { stage: 'Blueprint', desc: 'Spec + architecture' },
  { stage: 'Design', desc: 'UI kit + components' },
  { stage: 'Build', desc: 'Component forge' },
  { stage: 'QA', desc: 'Quality gates' },
  { stage: 'Ship', desc: 'Store submission' },
  { stage: 'Market', desc: 'Launch + ASO' },
];

const PRINCIPLES = [
  { icon: Target, title: 'Identity-first', desc: 'Systems that shape who you are, not just what you do.' },
  { icon: Zap, title: 'Systems over motivation', desc: 'Reliable infrastructure beats fleeting inspiration.' },
  { icon: Shield, title: 'Privacy-first', desc: 'Your data stays yours. No exceptions, no data selling.' },
  { icon: Brain, title: 'Premium minimalism', desc: 'Less surface area. Stronger signal. Higher quality.' },
  { icon: Rocket, title: 'Ship relentlessly', desc: 'Done beats perfect. Iteration compounds over time.' },
];

const orgSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'VibeForge Studios LLC',
  url: 'https://habit-protocol.preview.emergentagent.com',
  description: 'A product studio building disciplined systems for identity, execution, and creation.',
  email: 'immersivetechs@icloud.com',
});

export default function Home() {
  const { openWaitlist } = useWaitlist();

  return (
    <>
      <Helmet>
        <title>VibeForge Studios — Forge What's Next</title>
        <meta name="description" content="A product studio building disciplined systems for identity, execution, and creation. Products: Habit, Studio App, Desk." />
        <meta property="og:title" content="VibeForge Studios — Forge What's Next" />
        <meta property="og:description" content="A product studio building disciplined systems for identity, execution, and creation." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="VibeForge Studios — Forge What's Next" />
        <meta name="twitter:description" content="A product studio building disciplined systems for identity, execution, and creation." />
        <script type="application/ld+json">{orgSchema}</script>
      </Helmet>

      {/* ─── HERO ─── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', background: 'var(--bg0)' }}>
        <div className="hero-glow" style={{ width: 700, height: 700, background: 'rgba(0,229,255,0.055)', top: '-15%', left: '55%' }} />
        <div className="hero-glow" style={{ width: 500, height: 500, background: 'rgba(255,77,255,0.045)', bottom: '0%', left: '10%' }} />
        <div className="hero-glow" style={{ width: 350, height: 350, background: 'rgba(138,91,255,0.06)', top: '20%', right: '5%' }} />

        <div className="section-container" style={{ paddingTop: '5rem', paddingBottom: '5rem', position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="vf-chip animate-fade-up" style={{ marginBottom: '2.5rem' }}>
            Product Studio
          </div>

          <h1
            className="animate-fade-up delay-1"
            style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(3.5rem, 9vw, 7.5rem)', fontWeight: 800, color: 'var(--text0)', lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: '1.75rem', maxWidth: '780px' }}
            data-testid="hero-heading"
          >
            VibeForge<br />
            <span className="neon-text">Studios</span>
          </h1>

          <p
            className="animate-fade-up delay-2"
            style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.25rem, 3vw, 1.875rem)', fontWeight: 600, color: 'var(--accent0)', letterSpacing: '-0.01em', marginBottom: '1.5rem' }}
          >
            Forge what's next.
          </p>

          <p
            className="animate-fade-up delay-3"
            style={{ color: 'var(--text1)', fontSize: 'clamp(1rem, 2vw, 1.1875rem)', lineHeight: 1.7, maxWidth: '560px', marginBottom: '3.5rem' }}
          >
            A product studio building disciplined systems for identity, execution, and creation.
          </p>

          <div className="animate-fade-up delay-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <Link to="/products" className="vf-btn-primary" style={{ fontSize: '0.9375rem', padding: '0.875rem 2.25rem' }} data-testid="hero-explore-btn">
              Explore Products <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => openWaitlist('ecosystem')}
              className="vf-btn-ghost"
              style={{ fontSize: '0.9375rem', padding: '0.875rem 2.25rem' }}
              data-testid="hero-waitlist-btn"
            >
              Join Waitlist
            </button>
          </div>
        </div>

        <div className="gradient-line" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </section>

      {/* ─── ECOSYSTEM TILES ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg0)' }} data-testid="ecosystem-section">
        <div className="section-container">
          <div style={{ marginBottom: '5rem' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>The Ecosystem</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Three products.<br />
              <span className="neon-text">One vision.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {PRODUCTS.map((product, i) => (
              <div
                key={product.id}
                className={`vf-card animate-fade-up delay-${i + 2}`}
                style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}
                data-testid={`ecosystem-tile-${product.id}`}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${product.accent}, transparent)` }} />

                <div
                  className="vf-chip"
                  style={{ '--chipColor': product.accent, '--chipBg': `${product.accent}18`, '--chipBorder': `${product.accent}35`, marginBottom: '1.75rem' }}
                >
                  {product.chip}
                </div>

                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.625rem', fontWeight: 800, color: 'var(--text0)', marginBottom: '0.625rem' }}>
                  {product.name}
                </h3>
                <p style={{ color: product.accent, fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.875rem', fontFamily: 'Syne, sans-serif' }}>
                  {product.tagline}
                </p>
                <p style={{ color: 'var(--text1)', fontSize: '0.9375rem', lineHeight: 1.65, marginBottom: '2.5rem' }}>
                  {product.desc}
                </p>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <Link
                    to={product.path}
                    style={{ color: product.accent, textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Syne, sans-serif', transition: 'opacity 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    data-testid={`product-link-${product.id}`}
                  >
                    View <ArrowRight size={14} />
                  </Link>
                  <button
                    onClick={() => openWaitlist(product.product)}
                    style={{ color: 'var(--muted)', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', transition: 'color 0.2s ease' }}
                    onMouseEnter={e => e.target.style.color = 'var(--text0)'}
                    onMouseLeave={e => e.target.style.color = 'var(--muted)'}
                    data-testid={`product-waitlist-${product.id}`}
                  >
                    Join waitlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PIPELINE ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg1)' }}>
        <div className="section-container">
          <div style={{ marginBottom: '5rem' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>The Pipeline</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Idea to App Store.<br />
              <span className="neon-text">Systematically.</span>
            </h2>
          </div>

          <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: '1rem', gap: 0 }}>
            {PIPELINE.map((step, i) => (
              <React.Fragment key={step.stage}>
                <div
                  style={{ flexShrink: 0, textAlign: 'center', padding: '1.25rem 1.5rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '14px', minWidth: '120px', transition: 'border-color 0.2s ease, background 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent0)'; e.currentTarget.style.background = 'var(--surface1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface0)'; }}
                >
                  <div style={{ color: 'var(--muted)', fontSize: '0.625rem', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.5rem', fontFamily: 'Manrope, sans-serif' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ color: 'var(--text0)', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.375rem' }}>{step.stage}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{step.desc}</div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="pipeline-connector" style={{ flexShrink: 0 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRINCIPLES ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div style={{ marginBottom: '5rem' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Principles</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Built on<br />
              <span className="neon-text">conviction.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {PRINCIPLES.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className={`vf-card animate-fade-up delay-${i + 1}`} style={{ padding: '2rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--chipBg)', border: '1px solid var(--chipBorder)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Icon size={20} color="var(--accent0)" strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text0)', marginBottom: '0.625rem' }}>{p.title}</h3>
                  <p style={{ color: 'var(--text1)', fontSize: '0.9375rem', lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ padding: '10rem 0', background: 'var(--bg0)', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-glow" style={{ width: 600, height: 600, background: 'rgba(0,229,255,0.07)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="hero-glow" style={{ width: 400, height: 400, background: 'rgba(255,77,255,0.05)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="section-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.25rem, 6vw, 4.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', marginBottom: '1.5rem', lineHeight: 1 }}>
            Ready to forge<br />
            <span className="neon-text">what's next?</span>
          </h2>
          <p style={{ color: 'var(--text1)', fontSize: '1.125rem', lineHeight: 1.65, marginBottom: '3rem' }}>
            Get early access. Founder pricing locked for 12 months.
          </p>
          <button
            onClick={() => openWaitlist('ecosystem')}
            className="vf-btn-primary"
            style={{ fontSize: '1rem', padding: '1rem 2.75rem' }}
            data-testid="bottom-cta-btn"
          >
            Join the Waitlist <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </>
  );
}
