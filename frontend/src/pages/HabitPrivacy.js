import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, Mail } from 'lucide-react';

const PRIVACY_DOC_URL = 'https://docs.google.com/document/d/19yeXgkDZ2WP4N3SpKb7wyOb3Ar4_SJhLPdzJpW_TlWs/edit?usp=drivesdk';

export default function HabitPrivacy() {
  const lastUpdated = 'February 2026';

  return (
    <>
      <Helmet>
        <title>Privacy Policy — Habit | VibeForge Studios</title>
        <meta name="description" content="Privacy Policy for the Habit app by VibeForge Studios LLC. Understand how Habit handles your personal data." />
        <meta property="og:title" content="Privacy Policy — Habit | VibeForge Studios" />
      </Helmet>

      <section style={{ padding: '10rem 0 9rem', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div style={{ maxWidth: '760px' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Habit — Legal</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }} data-testid="habit-privacy-heading">
              Privacy Policy — Habit
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
                The full and authoritative version of this Privacy Policy is maintained in a Google Document. The content below is a structured summary. For the complete canonical text:
              </p>
              <a
                href={PRIVACY_DOC_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent0)', fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'Syne, sans-serif', transition: 'opacity 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                data-testid="habit-privacy-source-doc-link"
              >
                View source document <ExternalLink size={15} />
              </a>
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '3rem' }} />

            <div className="legal-section">
              <h2>1. Overview</h2>
              <p>This Privacy Policy applies to the Habit mobile application ("Habit", "App") developed and operated by VibeForge Studios LLC ("we", "us", "our"). It explains what data we collect, why we collect it, and how we protect and use it.</p>
            </div>

            <div className="legal-section">
              <h2>2. Information We Collect</h2>
              <p>Habit collects only the data necessary to provide the service:</p>
              <ul>
                <li><strong>Account data:</strong> Email address and any profile information you provide during onboarding</li>
                <li><strong>Habit & todo data:</strong> Your habits, tasks, streaks, completion records, and 30-day route progress</li>
                <li><strong>Focus session data:</strong> Timer usage and session logs</li>
                <li><strong>Journal entries:</strong> Any notes or reflections you create within the app</li>
                <li><strong>Cerebra AI interactions:</strong> Conversations with the Cerebra AI coach (Pro/Elite tiers)</li>
                <li><strong>Location data:</strong> Only if you explicitly enable location reminders. Always optional, always revocable.</li>
                <li><strong>Device data:</strong> Device type, operating system version, and app version for diagnostic purposes</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>3. How We Use Your Data</h2>
              <p>We use the data we collect to:</p>
              <ul>
                <li>Operate and improve the Habit app</li>
                <li>Sync your data across devices</li>
                <li>Provide the Cerebra AI coaching experience (Pro/Elite tiers)</li>
                <li>Send habit reminders and progress notifications (with your permission)</li>
                <li>Generate your personal insights and progress reports</li>
                <li>Diagnose and resolve technical issues</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>4. AI Interactions and Cerebra Coach</h2>
              <p>Conversations with Cerebra Coach are private. AI interactions may be used in aggregate, anonymized form to improve the AI coaching experience. Individual AI conversation content is never sold to third parties or used for advertising targeting.</p>
            </div>

            <div className="legal-section">
              <h2>5. Data Sharing</h2>
              <p>We do not sell your personal information. We may share data with:</p>
              <ul>
                <li><strong>Service providers:</strong> Infrastructure, cloud storage, and analytics vendors under strict confidentiality obligations</li>
                <li><strong>App Store / Google Play:</strong> In-app purchase and subscription management is handled by Apple or Google per their respective privacy policies</li>
                <li><strong>Legal requirements:</strong> When required by applicable law or legal process</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>6. Data Security</h2>
              <p>Your data is encrypted in transit (TLS) and at rest. We implement industry-standard security practices and regularly review our infrastructure. No system is completely secure, and we cannot guarantee absolute security.</p>
            </div>

            <div className="legal-section">
              <h2>7. Location Data</h2>
              <p>Location-based reminders are entirely optional. If you enable them, location access is used only to trigger habit reminders at specified locations. We do not store precise location history. Location access can be revoked at any time through your device's Settings.</p>
            </div>

            <div className="legal-section">
              <h2>8. Your Rights and Data Control</h2>
              <p>You have the right to:</p>
              <ul>
                <li><strong>Export your data:</strong> Available in-app for Pro and Elite subscribers</li>
                <li><strong>Delete your account:</strong> Contact us at immersivetechs@icloud.com. We will process deletion within 30 days.</li>
                <li><strong>Access or correct your data:</strong> Contact us and we will assist</li>
                <li><strong>Revoke permissions:</strong> Location and notification permissions can be revoked anytime in device Settings</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>9. Data Retention</h2>
              <p>We retain your data as long as your account is active or as needed to provide services. Upon account deletion, your data is removed within 30 days, except where retention is required by law.</p>
            </div>

            <div className="legal-section">
              <h2>10. Children</h2>
              <p>Habit is not intended for users under 13. We do not knowingly collect data from children under 13. If you believe we have inadvertently collected such data, contact us immediately.</p>
            </div>

            <div className="legal-section">
              <h2>11. Changes to This Policy</h2>
              <p>We may update this Privacy Policy. Significant changes will be communicated via in-app notification. The canonical source document linked above will always reflect the most current version.</p>
            </div>

            <div className="legal-section">
              <h2>12. Contact</h2>
              <p>Privacy questions or data requests:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '1rem 1.25rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '12px', width: 'fit-content' }}>
                <Mail size={16} color="var(--accent0)" />
                <a href="mailto:immersivetechs@icloud.com" style={{ color: 'var(--accent0)', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 600 }}>immersivetechs@icloud.com</a>
              </div>
            </div>

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ color: 'var(--text1)', fontSize: '0.875rem' }}>
                Full text of this Privacy Policy is available in the canonical source document:
              </p>
              <a
                href={PRIVACY_DOC_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent0)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
                data-testid="habit-privacy-source-doc-link-bottom"
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
