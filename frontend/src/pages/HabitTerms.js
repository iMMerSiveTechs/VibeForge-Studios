import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, Mail } from 'lucide-react';

const TERMS_DOC_URL = 'https://docs.google.com/document/d/17meUk5SNoVh0jY6mzxd24Rcmmw15SqVMRWYqJAc201Q/edit?usp=drivesdk';

export default function HabitTerms() {
  const lastUpdated = 'February 2026';

  return (
    <>
      <Helmet>
        <title>Terms of Service — Habit | VibeForge Studios</title>
        <meta name="description" content="Terms of Service for the Habit app by VibeForge Studios LLC. Understand your rights and responsibilities as a Habit subscriber." />
        <meta property="og:title" content="Terms of Service — Habit | VibeForge Studios" />
      </Helmet>

      <section style={{ padding: '10rem 0 9rem', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div style={{ maxWidth: '760px' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Habit — Legal</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }} data-testid="habit-terms-heading">
              Terms of Service — Habit
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              VibeForge Studios LLC — Last updated: {lastUpdated}
            </p>

            {/* Source doc notice */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--chipBg)', border: '1px solid var(--chipBorder)', borderRadius: '16px', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ color: 'var(--text0)', fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'Syne, sans-serif' }}>
                Canonical source document available
              </p>
              <p style={{ color: 'var(--text1)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                The full and authoritative version of these Terms of Service is maintained in a Google Document. The content below is a structured summary. For the complete canonical text:
              </p>
              <a
                href={TERMS_DOC_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent0)', fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'Syne, sans-serif', transition: 'opacity 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                data-testid="habit-terms-source-doc-link"
              >
                View source document <ExternalLink size={15} />
              </a>
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '3rem' }} />

            <div className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>By downloading, installing, or using the Habit application ("App"), you agree to be bound by these Terms of Service ("Terms") between you and VibeForge Studios LLC. If you do not agree to these Terms, do not use the App.</p>
            </div>

            <div className="legal-section">
              <h2>2. License to Use the App</h2>
              <p>Subject to your compliance with these Terms and payment of applicable subscription fees, VibeForge Studios LLC grants you a limited, non-exclusive, non-transferable, revocable license to use the App for your personal, non-commercial purposes.</p>
            </div>

            <div className="legal-section">
              <h2>3. Subscriptions and Billing</h2>
              <ul>
                <li><strong>Subscription tiers:</strong> Core ($9.99/mo), Pro ($19.99/mo), Elite ($29.99/mo)</li>
                <li><strong>Billing cycle:</strong> Subscriptions are billed monthly in advance and renew automatically until cancelled</li>
                <li><strong>Trial periods:</strong> If a free trial is offered, it converts to a paid subscription at the end of the trial period unless cancelled beforehand</li>
                <li><strong>Grandfather pricing:</strong> Subscribers who maintain continuous active subscriptions from their original signup date will have their price locked for 12 months</li>
                <li><strong>Price changes:</strong> We may change subscription prices with 30 days' notice. Continued subscription after the notice period constitutes acceptance of the new price</li>
                <li><strong>Cancellation:</strong> Cancel anytime via Settings → Subscriptions on your iOS or Android device. Access continues until the end of the current billing period. No prorated refunds for partial months.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>4. Subscription Management</h2>
              <p>All subscriptions are managed by Apple (App Store) or Google (Google Play) per their respective terms of service. Billing, refunds, and subscription management are subject to the policies of the applicable platform. For billing disputes, contact Apple or Google support directly.</p>
            </div>

            <div className="legal-section">
              <h2>5. User Content and Data</h2>
              <p>You retain ownership of all content you create within the App (habits, journal entries, notes, etc.). You grant VibeForge Studios LLC a limited license to process and store this content solely to provide the App's services to you. We do not claim ownership of your data.</p>
            </div>

            <div className="legal-section">
              <h2>6. AI Features (Cerebra Coach)</h2>
              <p>Cerebra Coach is an AI-powered accountability feature available in Pro and Elite tiers. The AI coach provides general accountability support and should not be construed as professional medical, mental health, financial, or legal advice. AI interactions are processed to provide the service and to improve the AI experience in aggregate. Individual conversations are not sold or shared with third parties.</p>
            </div>

            <div className="legal-section">
              <h2>7. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Reverse engineer, decompile, or attempt to extract the source code of the App</li>
                <li>Use the App for any unlawful purpose</li>
                <li>Share your account credentials with others</li>
                <li>Attempt to circumvent subscription requirements or access locked features without a valid subscription</li>
                <li>Transmit harmful, offensive, or illegal content through any App features</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>8. Intellectual Property</h2>
              <p>The App, including all code, design, branding, content, and functionality, is the exclusive property of VibeForge Studios LLC. These Terms do not transfer any intellectual property rights to you. "Habit", "VibeForge Studios", "Cerebra", and related marks are trademarks of VibeForge Studios LLC.</p>
            </div>

            <div className="legal-section">
              <h2>9. Disclaimers</h2>
              <p>THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. VIBEFORGE STUDIOS LLC DOES NOT GUARANTEE THAT THE APP WILL MEET YOUR REQUIREMENTS OR THAT IT WILL BE AVAILABLE UNINTERRUPTED OR ERROR-FREE. RESULTS FROM USING THE APP (HABIT FORMATION, PERSONAL DEVELOPMENT) ARE NOT GUARANTEED AND VARY BY USER.</p>
            </div>

            <div className="legal-section">
              <h2>10. Limitation of Liability</h2>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIBEFORGE STUDIOS LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE APP IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
            </div>

            <div className="legal-section">
              <h2>11. Termination</h2>
              <p>We reserve the right to terminate or suspend your access to the App for violation of these Terms. You may terminate your use at any time by cancelling your subscription and uninstalling the App. Upon termination, your license to use the App ends immediately.</p>
            </div>

            <div className="legal-section">
              <h2>12. Governing Law</h2>
              <p>These Terms are governed by the laws of the State of California, United States. Any dispute shall be subject to binding arbitration in California, except where prohibited by law.</p>
            </div>

            <div className="legal-section">
              <h2>13. Changes to Terms</h2>
              <p>We may update these Terms. Significant changes will be communicated via in-app notice or email. Continued use of the App after changes constitutes acceptance. The canonical source document linked above will reflect the most current version.</p>
            </div>

            <div className="legal-section">
              <h2>14. Contact</h2>
              <p>Questions about these Terms:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '1rem 1.25rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '12px', width: 'fit-content' }}>
                <Mail size={16} color="var(--accent0)" />
                <a href="mailto:immersivetechs@icloud.com" style={{ color: 'var(--accent0)', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 600 }}>immersivetechs@icloud.com</a>
              </div>
            </div>

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ color: 'var(--text1)', fontSize: '0.875rem' }}>
                Full text of these Terms is available in the canonical source document:
              </p>
              <a
                href={TERMS_DOC_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent0)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
                data-testid="habit-terms-source-doc-link-bottom"
              >
                View source document <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
