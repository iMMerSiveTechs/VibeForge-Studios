import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PRODUCTS = [
  { value: 'ecosystem', label: 'VibeForge Ecosystem' },
  { value: 'habit', label: 'Habit' },
  { value: 'studio', label: 'Studio App' },
  { value: 'desk', label: 'Desk' },
];

const HABIT_GOALS = [
  { value: 'health', label: 'Health & Fitness' },
  { value: 'focus', label: 'Focus & Deep Work' },
  { value: 'career', label: 'Career & Skills' },
  { value: 'money', label: 'Money & Finance' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'growth', label: 'Personal Growth' },
];

export default function WaitlistModal({ isOpen, onClose, defaultProduct }) {
  const [email, setEmail] = useState('');
  const [product, setProduct] = useState(defaultProduct || 'ecosystem');
  const [goal, setGoal] = useState('');
  const [hp, setHp] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setProduct(defaultProduct || 'ecosystem');
      setSuccess(false);
      setError('');
      setEmail('');
      setGoal('');
    }
  }, [defaultProduct, isOpen]);

  // Trap focus + close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/waitlist`, {
        email: email.trim(),
        productKey: product,
        goalOptional: product === 'habit' && goal ? goal : undefined,
        sourcePage: window.location.pathname,
        hp,
      });
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Already on the list. See you at launch.');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Try again later.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      data-testid="waitlist-modal"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Join Waitlist"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg1)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px var(--border)',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'color 0.2s ease, background 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          data-testid="modal-close-btn"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--chipBg)', border: '2px solid var(--accent0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Check size={24} color="var(--accent0)" strokeWidth={2.5} />
            </div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text0)', marginBottom: '0.75rem' }}>
              You're in.
            </h3>
            <p style={{ color: 'var(--text1)', fontSize: '1rem', lineHeight: 1.65 }}>
              Founder access will be sent at launch.
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text0)', marginBottom: '0.375rem' }}>
              Join the Waitlist
            </h2>
            <p style={{ color: 'var(--text1)', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              Get founder access at launch. Pricing locked for 12 months.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              {/* Honeypot — invisible */}
              <input
                type="text"
                value={hp}
                onChange={e => setHp(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ display: 'none' }}
              />

              <div>
                <label style={{ display: 'block', color: 'var(--text1)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.02em', fontFamily: 'Manrope, sans-serif' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="vf-input"
                  data-testid="waitlist-email-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text1)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.02em', fontFamily: 'Manrope, sans-serif' }}>
                  Product
                </label>
                <select
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  className="vf-select"
                  data-testid="waitlist-product-select"
                >
                  {PRODUCTS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {product === 'habit' && (
                <div>
                  <label style={{ display: 'block', color: 'var(--text1)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.02em', fontFamily: 'Manrope, sans-serif' }}>
                    Primary Goal <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <select
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    className="vf-select"
                    data-testid="waitlist-goal-select"
                  >
                    <option value="">Select a goal...</option>
                    {HABIT_GOALS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <p style={{ color: '#ff6b6b', fontSize: '0.875rem', textAlign: 'center', background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)', borderRadius: '10px', padding: '0.625rem 1rem' }} data-testid="waitlist-error">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="vf-btn-primary"
                style={{ justifyContent: 'center', marginTop: '0.375rem', opacity: loading ? 0.7 : 1, width: '100%', padding: '0.875rem' }}
                data-testid="waitlist-submit-btn"
              >
                {loading ? 'Joining...' : 'Get Founder Access →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
