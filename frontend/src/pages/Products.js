import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useWaitlist } from '../App';

const PRODUCTS = [
  {
    id: 'habit',
    name: 'Habit',
    tagline: 'Become who you\'re meant to be.',
    desc: 'Identity-first habit building with 30-day routes that turn intention into consistency.',
    accent: '#00D8FF',
    path: '/products/habit',
    product: 'habit',
    chip: 'Health & Identity',
    strips: ['#00D8FF', '#0CCCF2', '#8C59F2'],
  },
  {
    id: 'studio',
    name: 'Studio App',
    tagline: 'From idea to App Store — in a disciplined pipeline.',
    desc: 'Automated app creation from blueprint to launch. Full deliverables, zero guesswork.',
    accent: '#FF4DFF',
    path: '/products/studio',
    product: 'studio',
    chip: 'Productivity & Automation',
    strips: ['#00E5FF', '#FF4DFF', '#7C3AED'],
  },
  {
    id: 'desk',
    name: 'Desk',
    tagline: 'Your modular command surface.',
    desc: 'Master Plan. Task Planner. Stickies. Steno Notebook. One system for everything.',
    accent: '#7EDE97',
    path: '/products/desk',
    product: 'desk',
    chip: 'Organization & Focus',
    strips: ['#7EDE97', '#506AF2', '#F8DC5F'],
  },
];

export default function Products() {
  const { openWaitlist } = useWaitlist();

  return (
    <>
      <Helmet>
        <title>Products — VibeForge Studios</title>
        <meta name="description" content="Explore the VibeForge Studios ecosystem: Habit, Studio App, and Desk. Three disciplined tools for identity, creation, and execution." />
        <meta property="og:title" content="Products — VibeForge Studios" />
        <meta property="og:description" content="Explore the VibeForge Studios ecosystem: Habit, Studio App, and Desk." />
      </Helmet>

      {/* Hero */}
      <section style={{ padding: '8rem 0 5rem', background: 'var(--bg0)', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-glow" style={{ width: 500, height: 500, background: 'rgba(0,229,255,0.06)', top: '-10%', right: '-5%' }} />
        <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="vf-chip animate-fade-up" style={{ marginBottom: '1.5rem' }}>The Ecosystem</div>
          <h1
            className="animate-fade-up delay-1"
            style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }}
          >
            Three tools.<br />
            <span className="neon-text">One studio.</span>
          </h1>
          <p
            className="animate-fade-up delay-2"
            style={{ color: 'var(--text1)', fontSize: 'clamp(1rem, 2vw, 1.125rem)', lineHeight: 1.7, maxWidth: '500px' }}
          >
            Each product is a complete system. Together, they form a disciplined stack for identity, creation, and execution.
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <section style={{ padding: '3rem 0 9rem', background: 'var(--bg0)' }} data-testid="products-grid">
        <div className="section-container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {PRODUCTS.map((product, i) => (
              <div
                key={product.id}
                className={`vf-card animate-fade-up delay-${i + 1}`}
                style={{ padding: '0', overflow: 'hidden' }}
                data-testid={`product-card-${product.id}`}
              >
                {/* Theme preview strip */}
                <div style={{ height: '4px', background: `linear-gradient(90deg, ${product.strips.join(', ')})` }} />

                <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div
                        className="vf-chip"
                        style={{ '--chipColor': product.accent, '--chipBg': `${product.accent}15`, '--chipBorder': `${product.accent}30`, marginBottom: '1.5rem' }}
                      >
                        {product.chip}
                      </div>
                      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text0)', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
                        {product.name}
                      </h2>
                      <p style={{ color: product.accent, fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', fontFamily: 'Syne, sans-serif' }}>
                        {product.tagline}
                      </p>
                      <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '480px' }}>
                        {product.desc}
                      </p>
                    </div>

                    {/* Color swatches */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      {product.strips.map((color, j) => (
                        <div key={j} style={{ width: '28px', height: '28px', borderRadius: '8px', background: color, border: '1px solid rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link
                      to={product.path}
                      className="vf-btn-primary"
                      style={{ textDecoration: 'none', '--btnGrad0': product.accent, '--btnGrad1': product.strips[2] || product.accent }}
                      data-testid={`products-page-link-${product.id}`}
                    >
                      View Product <ArrowRight size={15} />
                    </Link>
                    <button
                      onClick={() => openWaitlist(product.product)}
                      className="vf-btn-ghost"
                      data-testid={`products-page-waitlist-${product.id}`}
                    >
                      Join Waitlist
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
