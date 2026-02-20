import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, ChevronDown, ChevronUp, Apple, Smartphone } from 'lucide-react';
import axios from 'axios';
import { useWaitlist } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DELIVERABLES = [
  { icon: '◈', title: 'Blueprint & Spec', desc: 'A complete product specification document including user personas, core flows, data models, and technical requirements.' },
  { icon: '⊞', title: 'User Story Map', desc: 'Structured user stories organized by journey stage, priority, and sprint readiness.' },
  { icon: '◉', title: 'UI Kit & Component Library', desc: 'Design-ready component definitions: tokens, styles, states, and hierarchy — ready for implementation.' },
  { icon: '⌀', title: 'Component Architecture Map', desc: 'Visual map of all screens, components, and data flows showing how the system connects.' },
  { icon: '↗', title: 'Build Roadmap', desc: 'Sprint-ready task breakdown from first line of code to submission-ready build.' },
  { icon: '⊡', title: 'QA Checklist', desc: 'Systematic quality gates covering functionality, performance, accessibility, and edge cases.' },
  { icon: '◷', title: 'Store Assets Plan', desc: 'App Store and Google Play asset requirements: screenshots, preview videos, icons, and metadata structure.' },
  { icon: '◎', title: 'ASO Copy Draft', desc: 'Keyword-optimized app title, subtitle, description, and promotional text ready for submission.' },
  { icon: '⊗', title: 'Launch Content Templates', desc: 'Ready-to-use templates for social launch, email announcement, and press kit.' },
];

const MODULES = [
  {
    name: 'Blueprint Generator',
    desc: 'Transform a raw idea into a structured product specification. Define the scope, constraints, and success criteria before a single line of code is written.',
    accent: '#00E5FF',
  },
  {
    name: 'Component Forge',
    desc: 'Generate a complete component architecture and UI system from your spec. Every screen, state, and interaction mapped before development begins.',
    accent: '#FF4DFF',
  },
  {
    name: 'Quality Gatekeeper',
    desc: 'Automated quality checkpoints at each pipeline stage. Catch issues early. Every deliverable meets the bar before moving forward.',
    accent: '#8A5BFF',
  },
  {
    name: 'Launch Kit',
    desc: 'Everything needed for App Store and Google Play submission: store copy, screenshots specs, metadata, and submission checklist.',
    accent: '#00E5FF',
  },
  {
    name: 'Marketing Autopilot',
    desc: 'Launch content templates and ASO-optimized copy ready the moment your app ships. Built into the pipeline, not an afterthought.',
    accent: '#FF4DFF',
  },
];

const AUDIENCES = [
  'Indie founders building their first mobile app',
  'Developers who want a structured blueprint before writing code',
  'Product builders moving fast who can\'t afford wasted iterations',
  'Studios launching multiple products and need a repeatable process',
  'Anyone who\'s had an idea for years and needs a disciplined path to ship',
];

const FAQS = [
  { q: 'What is the VibeForge Studios App?', a: 'The Studios App is an automated app creation pipeline. Give it your idea, and it produces a complete set of structured deliverables — from spec to launch kit — so you can build with discipline instead of guesswork.' },
  { q: 'What deliverables do I actually get?', a: 'You get: blueprint & spec, user story map, UI kit & component library, component architecture map, build roadmap, QA checklist, store assets plan, ASO copy draft, and launch content templates.' },
  { q: 'What is the Blueprint Generator?', a: 'The Blueprint Generator transforms your raw idea into a structured product specification — defining user personas, core flows, data models, and technical requirements before development begins.' },
  { q: 'What is the Quality Gatekeeper?', a: 'The Quality Gatekeeper enforces systematic quality checks at each stage of the pipeline. Nothing moves forward until it meets the defined quality bar.' },
  { q: 'What is the Launch Kit?', a: 'The Launch Kit includes all App Store and Google Play submission requirements: store copy, screenshot specs, metadata structure, and a complete submission checklist.' },
  { q: 'What is Marketing Autopilot?', a: 'Marketing Autopilot generates ASO-optimized store copy, social launch content templates, and promotional material — built into the pipeline so your marketing is ready when the app is.' },
  { q: 'Who is this for?', a: 'Indie founders, developers, and product studios who want a systematic, disciplined approach to building apps. If you\'ve had an idea and don\'t know where to start — or keep starting without finishing — this is for you.' },
  { q: 'How long does the pipeline take?', a: 'The pipeline timeline varies by project complexity. The goal is to compress months of planning into structured, executable deliverables. Launch details will be announced at release.' },
  { q: 'Is this a no-code tool?', a: 'No. The Studios App produces structured deliverables and plans for disciplined human execution. It accelerates planning and spec work — you or your team still build the product.' },
  { q: 'When is it launching?', a: 'Join the waitlist for launch updates. Founders get early access and locked pricing.' },
];

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div data-testid="studio-faq">
      {items.map((item, i) => (
        <div key={i} className="faq-item">
          <button className="faq-question" onClick={() => setOpen(open === i ? null : i)} data-testid={`studio-faq-item-${i}`}>
            {item.q}
            {open === i ? <ChevronUp size={18} color="var(--accent0)" /> : <ChevronDown size={18} color="var(--muted)" />}
          </button>
          {open === i && <div className="faq-answer">{item.a}</div>}
        </div>
      ))}
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
      await axios.post(`${BACKEND_URL}/api/waitlist`, { email: email.trim(), productKey: product, sourcePage: '/products/studio' });
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
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" required className="vf-input" style={{ flex: 1, minWidth: '200px' }} data-testid="studio-inline-email" />
      <button type="submit" disabled={loading} className="vf-btn-primary" style={{ flexShrink: 0, opacity: loading ? 0.7 : 1 }} data-testid="studio-inline-submit">
        {loading ? 'Joining...' : 'Get Early Access →'}
      </button>
      {error && <p style={{ width: '100%', color: '#ff6b6b', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
    </form>
  );
}

const studioSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VibeForge Studios App',
  applicationCategory: 'DeveloperApplication',
  description: 'An automated app creation pipeline. From blueprint to launch in a disciplined workflow.',
});

export default function StudioPage() {
  const { openWaitlist } = useWaitlist();

  return (
    <>
      <Helmet>
        <title>VibeForge Studios App — From Idea to App Store | VibeForge Studios</title>
        <meta name="description" content="An automated app creation pipeline. Blueprint, spec, UI kit, build plan, QA checklist, store assets, ASO copy, and launch templates — all delivered." />
        <meta property="og:title" content="VibeForge Studios App — From Idea to App Store" />
        <meta property="og:description" content="An automated app creation pipeline. From blueprint to launch in a disciplined workflow." />
      </Helmet>

      {/* ─── HERO ─── */}
      <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', background: 'var(--bg0)', position: 'relative', overflow: 'hidden', paddingTop: '2rem' }}>
        <div className="hero-glow" style={{ width: 700, height: 700, background: 'rgba(0,229,255,0.06)', top: '-20%', right: '-10%' }} />
        <div className="hero-glow" style={{ width: 500, height: 500, background: 'rgba(255,77,255,0.05)', bottom: '0%', left: '-5%' }} />

        <div className="section-container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="vf-chip animate-fade-up" style={{ marginBottom: '2rem' }}>Product Pipeline</div>
          <h1
            className="animate-fade-up delay-1"
            style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(3rem, 8vw, 6.5rem)', fontWeight: 800, color: 'var(--text0)', lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: '1.75rem', maxWidth: '820px' }}
            data-testid="studio-hero-heading"
          >
            VibeForge<br />
            <span className="neon-text">Studios App</span>
          </h1>
          <p className="animate-fade-up delay-2" style={{ color: 'var(--accent0)', fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)', fontWeight: 600, fontFamily: 'Syne, sans-serif', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
            From idea to App Store — in a disciplined pipeline.
          </p>
          <p className="animate-fade-up delay-3" style={{ color: 'var(--text1)', fontSize: 'clamp(1rem, 1.8vw, 1.125rem)', lineHeight: 1.7, maxWidth: '560px', marginBottom: '3.5rem' }}>
            A complete app creation workflow. From raw idea to structured deliverables — blueprint, components, build plan, and launch kit included.
          </p>
          <div className="animate-fade-up delay-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <button onClick={() => openWaitlist('studio')} className="vf-btn-primary" style={{ padding: '0.9375rem 2.25rem', fontSize: '0.9375rem' }} data-testid="studio-waitlist-btn">
              Join Waitlist <ArrowRight size={16} />
            </button>
            <a href="#deliverables" className="vf-btn-ghost" style={{ padding: '0.9375rem 2.25rem', fontSize: '0.9375rem' }}>
              See Deliverables
            </a>
          </div>
        </div>

        {/* Pipeline line decoration */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(180deg, transparent, var(--bg0))' }} />
        <div className="gradient-line" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </section>

      {/* ─── DELIVERABLES ─── */}
      <section id="deliverables" style={{ padding: '9rem 0', background: 'var(--bg1)' }} data-testid="studio-deliverables">
        <div className="section-container">
          <div style={{ marginBottom: '5rem' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Deliverables</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }}>
              What you get.
            </h2>
            <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '500px' }}>
              Every output is structured, actionable, and ready to execute. No vague recommendations — specific, usable deliverables.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {DELIVERABLES.map((d, i) => (
              <div key={d.title} className={`vf-card animate-fade-up delay-${i % 3 + 1}`} style={{ padding: '2rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'var(--chipBg)', border: '1px solid var(--chipBorder)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', fontSize: '1.125rem', color: 'var(--accent0)' }}>
                  {d.icon}
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text0)', marginBottom: '0.5rem' }}>{d.title}</h3>
                <p style={{ color: 'var(--text1)', fontSize: '0.9rem', lineHeight: 1.65 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MODULES ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg0)' }} data-testid="studio-modules">
        <div className="section-container">
          <div style={{ marginBottom: '5rem' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Modules</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              The pipeline.<br />
              <span className="neon-text">Stage by stage.</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {MODULES.map((mod, i) => (
              <div
                key={mod.name}
                className="vf-card animate-fade-up"
                style={{ padding: '2rem 2.5rem', display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}
              >
                <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: `${mod.accent}18`, border: `1px solid ${mod.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mod.accent, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.875rem' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text0)', marginBottom: '0.5rem' }}>{mod.name}</h3>
                  <p style={{ color: 'var(--text1)', fontSize: '0.9375rem', lineHeight: 1.65 }}>{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO IT'S FOR ─── */}
      <section style={{ padding: '7rem 0', background: 'var(--bg1)' }}>
        <div className="section-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Who It's For</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }}>
                Builders who are<br />
                <span className="neon-text">done planning.</span>
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {AUDIENCES.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem 1.25rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent0)', flexShrink: 0, marginTop: '0.5rem' }} />
                  <p style={{ color: 'var(--text1)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{a}</p>
                </div>
              ))}
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
        <div className="hero-glow" style={{ width: 500, height: 500, background: 'rgba(0,229,255,0.07)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '620px' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Early Access</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }}>
              Build your next app.<br />
              <span className="neon-text">The right way.</span>
            </h2>
            <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
              Founder access at launch. Pricing locked for 12 months.
            </p>
            <WaitlistInline product="studio" />
          </div>
        </div>
      </section>
    </>
  );
}
