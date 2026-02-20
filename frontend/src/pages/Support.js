import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Mail, ChevronDown, ChevronUp, Send } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FAQS = [
  { q: 'How do I report a bug or issue?', a: 'Use the contact form below or email immersivetechs@icloud.com directly. Include as much detail as possible: what you were doing, what you expected, and what happened instead.' },
  { q: 'How do I cancel my subscription?', a: 'Subscriptions are managed by the App Store (iOS) or Google Play (Android). Go to Settings → Subscriptions on your device and cancel from there. You\'ll retain access until the end of your billing period.' },
  { q: 'How do I request a data export?', a: 'Email immersivetechs@icloud.com with your request. We\'ll process it as quickly as possible.' },
  { q: 'How do I delete my account?', a: 'Email immersivetechs@icloud.com with your deletion request. We\'ll remove your data and confirm deletion.' },
  { q: 'Where can I find the legal documents?', a: 'Website privacy and terms are linked in the footer. Habit app legal documents are at /habit/privacy and /habit/terms.' },
  { q: 'When will the apps be available?', a: 'Join the waitlist for each product to be notified at launch. Waitlist signups get founder access and locked pricing.' },
];

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div data-testid="support-faq">
      {items.map((item, i) => (
        <div key={i} className="faq-item">
          <button className="faq-question" onClick={() => setOpen(open === i ? null : i)}>
            {item.q}
            {open === i ? <ChevronUp size={18} color="var(--accent0)" /> : <ChevronDown size={18} color="var(--muted)" />}
          </button>
          {open === i && <div className="faq-answer">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

export default function Support() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/support`, {
        name: name.trim() || undefined,
        email: email.trim(),
        message: message.trim(),
        hp,
      });
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please try again later.');
      } else if (err.response?.status === 400) {
        setError('Message too short. Please provide more detail.');
      } else {
        setError('Something went wrong. Please email us directly.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Support — VibeForge Studios</title>
        <meta name="description" content="Get support for VibeForge Studios products. Contact us, find answers to common questions, and access legal documentation." />
        <meta property="og:title" content="Support — VibeForge Studios" />
      </Helmet>

      {/* Hero */}
      <section style={{ padding: '10rem 0 5rem', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div className="vf-chip animate-fade-up" style={{ marginBottom: '1.5rem' }}>Support</div>
          <h1 className="animate-fade-up delay-1" style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }} data-testid="support-heading">
            We're here.
          </h1>
          <p className="animate-fade-up delay-2" style={{ color: 'var(--text1)', fontSize: 'clamp(1rem, 2vw, 1.125rem)', lineHeight: 1.7, maxWidth: '500px', marginBottom: '2rem' }}>
            Have a question, issue, or feedback? Use the form below or email us directly.
          </p>
          <a
            href="mailto:immersivetechs@icloud.com"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', color: 'var(--accent0)', fontSize: '1rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'Syne, sans-serif', transition: 'opacity 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            data-testid="support-email-link"
          >
            <Mail size={18} />
            immersivetechs@icloud.com
          </a>
        </div>
      </section>

      {/* Contact + FAQ */}
      <section style={{ padding: '3rem 0 9rem', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem' }}>
            {/* Contact Form */}
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text0)', marginBottom: '2rem' }}>
                Send a message
              </h2>

              {success ? (
                <div style={{ padding: '2.5rem', background: 'var(--chipBg)', border: '1px solid var(--chipBorder)', borderRadius: '20px', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--chipBg)', border: '2px solid var(--accent0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                    <Send size={20} color="var(--accent0)" />
                  </div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text0)', marginBottom: '0.5rem' }}>Message received.</h3>
                  <p style={{ color: 'var(--text1)', fontSize: '0.9375rem' }}>We'll be in touch at {email}.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Honeypot */}
                  <input type="text" value={hp} onChange={e => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />

                  <div>
                    <label style={{ display: 'block', color: 'var(--text1)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.02em' }}>
                      Name <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="vf-input"
                      data-testid="support-name-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text1)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.02em' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="vf-input"
                      data-testid="support-email-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text1)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.02em' }}>
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Describe your issue or question in detail..."
                      required
                      minLength={10}
                      className="vf-textarea"
                      data-testid="support-message-input"
                    />
                  </div>

                  {error && (
                    <p style={{ color: '#ff6b6b', fontSize: '0.875rem', background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)', borderRadius: '10px', padding: '0.625rem 1rem', margin: 0 }} data-testid="support-error">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="vf-btn-primary"
                    style={{ opacity: loading ? 0.7 : 1 }}
                    data-testid="support-submit-btn"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                    <Send size={15} />
                  </button>
                </form>
              )}

              {/* Legal links */}
              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1rem', fontFamily: 'Manrope, sans-serif' }}>Legal</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {[
                    { to: '/privacy', label: 'Privacy Policy' },
                    { to: '/terms', label: 'Terms of Service' },
                    { to: '/habit/privacy', label: 'Habit Privacy' },
                    { to: '/habit/terms', label: 'Habit Terms' },
                  ].map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      style={{ color: 'var(--text1)', fontSize: '0.875rem', textDecoration: 'none', padding: '0.375rem 0.875rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '8px', transition: 'border-color 0.2s ease, color 0.2s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent0)'; e.currentTarget.style.color = 'var(--accent0)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text1)'; }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text0)', marginBottom: '2rem' }}>
                Common questions
              </h2>
              <FAQ items={FAQS} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
