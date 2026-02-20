import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import { useWaitlist } from '../App';

const PRINCIPLES = [
  { title: 'Identity-first', desc: 'Every product we build starts with a question: how does this shape who the user becomes? Not just what they do.' },
  { title: 'Systems over motivation', desc: 'Motivation is unreliable. Systems compound. We build infrastructure that works even when motivation is low.' },
  { title: 'Privacy-first', desc: 'User data is a responsibility, not an asset. We do not sell personal information. We collect only what\'s needed to operate.' },
  { title: 'Premium minimalism', desc: 'Less surface area. Stronger signal. Every element earns its place. No feature for features\' sake.' },
  { title: 'Ship relentlessly', desc: 'Iteration beats perfection. A product in users\' hands is worth more than a perfect product never shipped.' },
];

export default function About() {
  const { openWaitlist } = useWaitlist();

  return (
    <>
      <Helmet>
        <title>About VibeForge Studios LLC</title>
        <meta name="description" content="VibeForge Studios LLC is a product studio building disciplined systems for identity, execution, and creation. Learn about our mission, values, and ecosystem." />
        <meta property="og:title" content="About VibeForge Studios LLC" />
        <meta property="og:description" content="A product studio building disciplined systems for identity, execution, and creation." />
      </Helmet>

      {/* Hero */}
      <section style={{ padding: '10rem 0 7rem', background: 'var(--bg0)', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-glow" style={{ width: 500, height: 500, background: 'rgba(0,229,255,0.055)', top: '-10%', right: '-5%' }} />
        <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="vf-chip animate-fade-up" style={{ marginBottom: '1.5rem' }}>About</div>
          <h1
            className="animate-fade-up delay-1"
            style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.75rem, 7vw, 5.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '2rem', maxWidth: '700px' }}
            data-testid="about-heading"
          >
            Building systems<br />
            <span className="neon-text">that forge identity.</span>
          </h1>
          <p
            className="animate-fade-up delay-2"
            style={{ color: 'var(--text1)', fontSize: 'clamp(1rem, 2vw, 1.1875rem)', lineHeight: 1.75, maxWidth: '600px' }}
          >
            VibeForge Studios LLC is a product studio. We build disciplined software systems for identity, execution, and creation — products that don't just solve problems, but shape the people who use them.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: '7rem 0', background: 'var(--bg1)' }}>
        <div className="section-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Mission</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }}>
                Why VibeForge<br />exists.
              </h2>
              <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.75 }}>
                Most productivity software is built around tasks. We build around people.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                'People don\'t fail because they lack information. They fail because they lack systems.',
                'The best tool is the one that quietly reshapes how you think and act, not just what you track.',
                'We exist to build those tools — premium, disciplined, and uncompromising.',
              ].map((text, i) => (
                <div key={i} style={{ padding: '1.5rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '16px', borderLeft: '3px solid var(--accent0)' }}>
                  <p style={{ color: 'var(--text0)', fontSize: '1rem', lineHeight: 1.7, fontFamily: 'Syne, sans-serif', fontWeight: 500, fontStyle: 'italic' }}>
                    "{text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section style={{ padding: '7rem 0', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>The Ecosystem</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '3rem' }}>
            Three products.<br />
            <span className="neon-text">One philosophy.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {[
              { name: 'Habit', accent: '#00D8FF', desc: 'Identity-first habit building. 30-day protocol routes that turn intention into consistency. Built for who you\'re becoming, not just what you\'re tracking.' },
              { name: 'Studio App', accent: '#FF4DFF', desc: 'An automated app creation pipeline. From raw idea to structured, executable deliverables — blueprint, components, build plan, QA, and launch kit.' },
              { name: 'Desk', accent: '#7EDE97', desc: 'A modular command surface. Master Plan, Task Planner, Stickies, Steno Notebook, Vault, and Journal — six modules, one disciplined workspace.' },
            ].map(p => (
              <div key={p.name} className="vf-card" style={{ padding: '2rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.accent, marginBottom: '1.5rem' }} />
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.125rem', fontWeight: 800, color: 'var(--text0)', marginBottom: '0.75rem' }}>{p.name}</h3>
                <p style={{ color: 'var(--text1)', fontSize: '0.9375rem', lineHeight: 1.65 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section style={{ padding: '7rem 0', background: 'var(--bg1)' }}>
        <div className="section-container">
          <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Values</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '4rem' }}>
            What we stand for.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {PRINCIPLES.map((p, i) => (
              <div
                key={p.title}
                style={{ display: 'flex', gap: '3rem', padding: '2.25rem 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start', flexWrap: 'wrap' }}
              >
                <div style={{ flexShrink: 0, minWidth: '200px' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem', fontFamily: 'Manrope, sans-serif' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent0)' }}>{p.title}</h3>
                </div>
                <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.75, maxWidth: '560px' }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy stance */}
      <section style={{ padding: '7rem 0', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div style={{ maxWidth: '680px' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Privacy</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }}>
              We don't sell your data.
            </h2>
            <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.75 }}>
              Full stop. We collect only what's required to operate our products. User data is encrypted, not sold, not used for advertising. You can request deletion at any time. Privacy is a design constraint, not a checkbox.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '9rem 0', background: 'var(--bg1)', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-glow" style={{ width: 400, height: 400, background: 'rgba(0,229,255,0.06)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="section-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }}>
            Join the waitlist.
          </h2>
          <p style={{ color: 'var(--text1)', fontSize: '1.125rem', lineHeight: 1.65, marginBottom: '2.5rem' }}>
            Be first. Founder pricing locked for 12 months.
          </p>
          <button onClick={() => openWaitlist('ecosystem')} className="vf-btn-primary" style={{ fontSize: '1rem', padding: '1rem 2.75rem' }} data-testid="about-waitlist-btn">
            Get Early Access <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </>
  );
}
