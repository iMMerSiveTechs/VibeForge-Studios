import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Check, ChevronDown, ChevronUp, Apple, Smartphone } from 'lucide-react';
import axios from 'axios';
import { useWaitlist } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FEATURES = [
  {
    title: 'Habits & Todos',
    desc: 'Build the behaviors that define your future self. Track habits and todos in one seamless system — morning to night.',
    icon: '◉',
  },
  {
    title: '30-Day Protocol Routes',
    desc: 'Structured 30-day programs designed to cement new identities. Not motivation sprints — real system installation.',
    icon: '⌀',
  },
  {
    title: 'Focus Timer',
    desc: 'Deep work mode with distraction-free timing. Set your session, protect your time, and build your capacity for focused work.',
    icon: '◷',
  },
  {
    title: 'Progress & Insights',
    desc: 'See your integrity score, streak data, and habit completion trends. Know exactly where you stand.',
    icon: '↗',
  },
  {
    title: 'Cerebra AI Coach',
    desc: 'Your AI accountability partner. Cerebra checks in, reflects your progress, and keeps you aligned to your future self.',
    icon: '◈',
  },
  {
    title: 'Data Export & Privacy',
    desc: 'Your data is yours. Export anytime, encrypted in transit, privacy-first by design. Optional location reminders with explicit consent.',
    icon: '⊞',
  },
];

const PRICING = [
  {
    tier: 'Core',
    price: '$9.99',
    period: '/month',
    features: ['Habits & Todos', '30-Day Routes (3)', 'Focus Timer', 'Basic Insights', 'iOS & Android'],
    popular: false,
    product: 'habit',
  },
  {
    tier: 'Pro',
    price: '$19.99',
    period: '/month',
    features: ['Everything in Core', 'Unlimited Routes', 'Cerebra AI Coach', 'Advanced Insights', 'Data Export', 'Priority Support'],
    popular: true,
    product: 'habit',
  },
  {
    tier: 'Elite',
    price: '$29.99',
    period: '/month',
    features: ['Everything in Pro', 'Early Feature Access', 'Founder Pricing Lock', 'Direct Feedback Channel', 'Beta Access'],
    popular: false,
    product: 'habit',
  },
];

const FAQS = [
  { q: 'What is Habit?', a: 'Habit is an identity-first habit tracking app. It uses 30-day protocol routes to help you systematically install the behaviors that define your future self — not through motivation, but through structure.' },
  { q: 'How do 30-day routes work?', a: 'Routes are structured 30-day programs built around a specific identity outcome — like becoming someone who exercises daily, reads consistently, or ships work on time. Each day has a defined set of habits and actions.' },
  { q: 'What is Cerebra Coach?', a: 'Cerebra is an optional AI accountability partner built into the Pro and Elite tiers. Cerebra reflects your progress, helps you stay aligned to your defined future self, and provides gentle accountability. All AI interactions are private.' },
  { q: 'Is my data private?', a: 'Yes. Habit is privacy-first by design. Your data is encrypted in transit and at rest. We do not sell your personal information. You can export your data or request deletion at any time.' },
  { q: 'What is included in Core?', a: 'Core includes habits & todos tracking, 3 active 30-day routes, focus timer, basic insights, and iOS & Android support.' },
  { q: 'What is included in Pro?', a: 'Pro includes everything in Core plus unlimited 30-day routes, Cerebra AI Coach, advanced insights and trend analysis, full data export, and priority support.' },
  { q: 'What is included in Elite?', a: 'Elite includes everything in Pro plus early feature access, founder pricing guarantee, a direct feedback channel to the team, and beta program access.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime via Settings → Subscriptions on your device. You retain access until the end of your billing period. No cancellation fees.' },
  { q: 'Is there a free trial?', a: 'Trial availability will be announced at launch. Any trial converts to a paid subscription unless cancelled before the trial ends.' },
  { q: 'What platforms is Habit available on?', a: 'Habit will be available on iOS (App Store) and Android (Google Play) at launch.' },
  { q: 'How does grandfather pricing work?', a: 'If you subscribe continuously from launch, your price is locked for 12 months. As long as you maintain an active subscription, your rate stays fixed even as prices rise for new users.' },
  { q: 'Can I export my data?', a: 'Yes. Pro and Elite subscribers can export their full habit history, notes, and route completion data at any time from within the app.' },
];

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div data-testid="habit-faq">
      {items.map((item, i) => (
        <div key={i} className="faq-item">
          <button
            className="faq-question"
            onClick={() => setOpen(open === i ? null : i)}
            data-testid={`faq-item-${i}`}
          >
            {item.q}
            {open === i ? <ChevronUp size={18} color="var(--accent0)" /> : <ChevronDown size={18} color="var(--muted)" />}
          </button>
          {open === i && <div className="faq-answer">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

function WaitlistInline({ product = 'habit' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/waitlist`, { email: email.trim(), productKey: product, sourcePage: '/products/habit' });
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
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
        required
        className="vf-input"
        style={{ flex: 1, minWidth: '200px' }}
        data-testid="inline-waitlist-email"
      />
      <button type="submit" disabled={loading} className="vf-btn-primary" style={{ flexShrink: 0, opacity: loading ? 0.7 : 1 }} data-testid="inline-waitlist-submit">
        {loading ? 'Joining...' : 'Get Early Access →'}
      </button>
      {error && <p style={{ width: '100%', color: '#ff6b6b', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
    </form>
  );
}

const habitSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Habit',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'iOS, Android',
  offers: [
    { '@type': 'Offer', name: 'Core', price: '9.99', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Pro', price: '19.99', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Elite', price: '29.99', priceCurrency: 'USD' },
  ],
};

export default function HabitPage() {
  const { openWaitlist } = useWaitlist();

  return (
    <>
      <Helmet>
        <title>Habit — Become Who You're Meant to Be | VibeForge Studios</title>
        <meta name="description" content="Identity-first habit building with 30-day routes that turn intention into consistency. Habits, todos, focus timer, and Cerebra AI coach." />
        <meta property="og:title" content="Habit — Become Who You're Meant to Be" />
        <meta property="og:description" content="Identity-first habit building with 30-day routes that turn intention into consistency." />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(habitSchema)}</script>
      </Helmet>

      {/* ─── HERO ─── */}
      <section style={{ minHeight: '95vh', display: 'flex', alignItems: 'center', background: 'var(--bg0)', position: 'relative', overflow: 'hidden', paddingTop: '2rem' }}>
        <div className="hero-glow" style={{ width: 600, height: 600, background: 'rgba(0,216,255,0.07)', top: '-10%', right: '-10%' }} />
        <div className="hero-glow" style={{ width: 400, height: 400, background: 'rgba(140,89,242,0.06)', bottom: '5%', left: '-5%' }} />

        <div className="section-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%' }}>
          {/* Floating chips */}
          <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '3.5rem', flexWrap: 'wrap' }}>
            {['Disciplined', 'Focused', 'Consistent'].map(label => (
              <div key={label} className="vf-chip" style={{ fontSize: '0.8125rem', padding: '0.375rem 1rem' }}>{label}</div>
            ))}
          </div>

          <h1
            className="animate-fade-up delay-1"
            style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(5rem, 14vw, 10rem)', fontWeight: 800, color: 'var(--text0)', lineHeight: 0.9, letterSpacing: '-0.05em', marginBottom: '2rem' }}
            data-testid="habit-hero-heading"
          >
            Habit
          </h1>

          <p
            className="animate-fade-up delay-2"
            style={{ color: 'var(--accent0)', fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)', fontWeight: 600, fontFamily: 'Syne, sans-serif', marginBottom: '1rem', letterSpacing: '-0.01em' }}
          >
            Become who you're meant to be.
          </p>

          <p
            className="animate-fade-up delay-3"
            style={{ color: 'var(--text1)', fontSize: 'clamp(1rem, 1.8vw, 1.125rem)', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 3.5rem' }}
          >
            Identity-first habit building with 30-day routes that turn intention into consistency.
          </p>

          <div className="animate-fade-up delay-4" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => openWaitlist('habit')} className="vf-btn-primary" style={{ padding: '0.9375rem 2.25rem', fontSize: '0.9375rem' }} data-testid="habit-waitlist-btn">
              Join Waitlist <ArrowRight size={16} />
            </button>
            <a href="#features" className="vf-btn-ghost" style={{ padding: '0.9375rem 2.25rem', fontSize: '0.9375rem' }} data-testid="habit-how-it-works-btn">
              See how it works
            </a>
          </div>

          {/* Stats bar */}
          <div
            className="animate-fade-up delay-5"
            style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '6rem', flexWrap: 'wrap' }}
          >
            {[
              { val: '30-day', label: 'ROUTE MAP' },
              { val: 'AI', label: 'COACH' },
              { val: 'Identity', label: 'FIRST' },
            ].map(stat => (
              <div key={stat.val} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--accent0)', letterSpacing: '-0.03em' }}>{stat.val}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.6875rem', letterSpacing: '0.14em', marginTop: '0.375rem', fontFamily: 'Manrope, sans-serif' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="gradient-line" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding: '9rem 0', background: 'var(--bg1)' }} data-testid="habit-features">
        <div className="section-container">
          <div style={{ marginBottom: '5rem' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Features</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Built for who<br />
              <span className="neon-text">you're becoming.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`vf-card animate-fade-up delay-${i % 3 + 1}`} style={{ padding: '2rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'var(--chipBg)', border: '1px solid var(--chipBorder)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', fontSize: '1.125rem', color: 'var(--accent0)' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text0)', marginBottom: '0.625rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text1)', fontSize: '0.9375rem', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DOWNLOAD BUTTONS ─── */}
      <section style={{ padding: '5rem 0', background: 'var(--bg0)' }}>
        <div className="section-container" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'Manrope, sans-serif' }}>Available on</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              disabled
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.75rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '14px', color: 'var(--muted)', cursor: 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: 0.6 }}
              data-testid="app-store-btn"
            >
              <Apple size={20} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Coming Soon</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>App Store</div>
              </div>
            </button>
            <button
              disabled
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.75rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '14px', color: 'var(--muted)', cursor: 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: 0.6 }}
              data-testid="play-store-btn"
            >
              <Smartphone size={20} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Coming Soon</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Google Play</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg1)' }} data-testid="habit-pricing">
        <div className="section-container">
          <div style={{ marginBottom: '5rem', textAlign: 'center' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Pricing</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }}>
              Choose your tier.
            </h2>
            <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.6 }}>
              All plans billed monthly. Cancel anytime via App Store or Google Play settings.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', maxWidth: '960px', margin: '0 auto' }}>
            {PRICING.map(plan => (
              <div
                key={plan.tier}
                className={`vf-card ${plan.popular ? 'pricing-card-popular' : ''}`}
                style={{ padding: '2.25rem', position: 'relative' }}
                data-testid={`pricing-${plan.tier.toLowerCase()}`}
              >
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent0)', color: '#000', fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.25rem 0.875rem', borderRadius: '100px', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap' }}>
                    Most Popular
                  </div>
                )}

                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text0)', marginBottom: '0.5rem' }}>{plan.tier}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '2rem' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.25rem', fontWeight: 800, color: plan.popular ? 'var(--accent0)' : 'var(--text0)' }}>{plan.price}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{plan.period}</span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', color: 'var(--text1)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                      <Check size={15} color="var(--accent0)" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => openWaitlist('habit')}
                  className={plan.popular ? 'vf-btn-primary' : 'vf-btn-ghost'}
                  style={{ width: '100%', justifyContent: 'center' }}
                  data-testid={`pricing-cta-${plan.tier.toLowerCase()}`}
                >
                  Join Waitlist
                </button>
              </div>
            ))}
          </div>

          <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', textAlign: 'center', marginTop: '2rem', lineHeight: 1.6 }}>
            Subscriptions renew monthly until cancelled. Managed by App Store / Google Play. Pricing subject to change for new subscribers.
          </p>
        </div>
      </section>

      {/* ─── SUBSCRIPTION AGREEMENT ─── */}
      <section style={{ padding: '7rem 0', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div className="vf-card" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Subscription Agreement</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text0)', marginBottom: '1.5rem' }}>
              What you're agreeing to
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Billing', text: 'Subscriptions begin after any free trial period and renew automatically each billing cycle until cancelled.' },
                { label: 'Grandfather Pricing', text: 'Subscribers who maintain continuous subscriptions from launch have their price locked for 12 months, even as rates change for new users.' },
                { label: 'Trials', text: 'Any trial period converts to a paid subscription unless cancelled before expiration. Cancel from device Settings → Subscriptions.' },
                { label: 'Data Integrity', text: 'Your habit data is encrypted in transit and at rest. You own your data and can export it anytime from within the app.' },
                { label: 'AI Privacy', text: 'Cerebra Coach interactions are private. AI data may be used in aggregate to improve the experience, never sold to third parties.' },
                { label: 'Cancellation', text: 'Cancel anytime via Settings → Subscriptions on your device. You retain access until the end of your current billing cycle.' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flexShrink: 0, width: '140px', color: 'var(--accent0)', fontSize: '0.8125rem', fontWeight: 700, fontFamily: 'Syne, sans-serif', paddingTop: '0.1rem' }}>{item.label}</div>
                  <p style={{ color: 'var(--text1)', fontSize: '0.9375rem', lineHeight: 1.65, flex: 1 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST + LEGAL ─── */}
      <section style={{ padding: '5rem 0', background: 'var(--bg1)' }}>
        <div className="section-container">
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Privacy-first</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text0)', marginBottom: '1rem' }}>
              Your data. Your rules.
            </h2>
            <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Habit collects only what's needed to operate the app. No data selling. No third-party advertising. Full transparency in our legal docs.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/habit/privacy" className="vf-btn-ghost" style={{ fontSize: '0.875rem', padding: '0.625rem 1.5rem' }}>
                Habit Privacy Policy
              </Link>
              <Link to="/habit/terms" className="vf-btn-ghost" style={{ fontSize: '0.875rem', padding: '0.625rem 1.5rem' }}>
                Habit Terms of Service
              </Link>
              <a
                href="https://docs.google.com/document/d/19yeXgkDZ2WP4N3SpKb7wyOb3Ar4_SJhLPdzJpW_TlWs/edit?usp=drivesdk"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--muted)', fontSize: '0.8125rem', textDecoration: 'none', transition: 'color 0.2s ease', alignSelf: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent0)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
              >
                Privacy (Google Doc) <ExternalLink size={12} />
              </a>
              <a
                href="https://docs.google.com/document/d/17meUk5SNoVh0jY6mzxd24Rcmmw15SqVMRWYqJAc201Q/edit?usp=drivesdk"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--muted)', fontSize: '0.8125rem', textDecoration: 'none', transition: 'color 0.2s ease', alignSelf: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent0)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
              >
                Terms (Google Doc) <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div style={{ marginBottom: '4rem' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>FAQ</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Frequently asked questions
            </h2>
          </div>
          <div style={{ maxWidth: '720px' }}>
            <FAQ items={FAQS} />
          </div>
        </div>
      </section>

      {/* ─── WAITLIST BLOCK ─── */}
      <section style={{ padding: '9rem 0', background: 'var(--bg1)', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-glow" style={{ width: 500, height: 500, background: 'rgba(0,216,255,0.07)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '620px' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Early Access</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }}>
              Start becoming.<br />
              <span className="neon-text">Join the waitlist.</span>
            </h2>
            <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
              Founder access at launch. Pricing locked for 12 months.
            </p>
            <WaitlistInline product="habit" />
          </div>
        </div>
      </section>
    </>
  );
}
