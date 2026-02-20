import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail } from 'lucide-react';

export default function Privacy() {
  const lastUpdated = 'February 2026';

  return (
    <>
      <Helmet>
        <title>Privacy Policy — VibeForge Studios</title>
        <meta name="description" content="VibeForge Studios LLC Privacy Policy. Learn how we collect, use, and protect your information." />
        <meta property="og:title" content="Privacy Policy — VibeForge Studios" />
      </Helmet>

      <section style={{ padding: '10rem 0 9rem', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div style={{ maxWidth: '760px' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Legal</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }} data-testid="privacy-heading">
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '3rem' }}>
              VibeForge Studios LLC — Last updated: {lastUpdated}
            </p>

            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '3rem' }} />

            <div className="legal-section">
              <h2>1. Overview</h2>
              <p>VibeForge Studios LLC ("VibeForge Studios", "we", "us", "our") operates the vibeforge.studio website and related digital properties. This Privacy Policy describes how we collect, use, and protect your information when you visit our site or sign up for our waitlist.</p>
            </div>

            <div className="legal-section">
              <h2>2. Information We Collect</h2>
              <p>We collect the following information when you use our services:</p>
              <ul>
                <li><strong>Waitlist signups:</strong> Your email address, the product you're interested in, and an optional goal selection (for Habit). This is provided voluntarily by you.</li>
                <li><strong>Support messages:</strong> Your name (optional), email address, and message content when you contact us through our support form.</li>
                <li><strong>Usage data:</strong> Basic analytics about how visitors use the site (page views, referrers) may be collected through third-party analytics tools. This data is aggregated and anonymized.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Send you product launch notifications and founder access information (waitlist signups only)</li>
                <li>Respond to your support requests</li>
                <li>Improve our products and services</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p style={{ marginTop: '1rem' }}>We do not use your information for advertising, and we do not sell your personal information to third parties.</p>
            </div>

            <div className="legal-section">
              <h2>4. Data Sharing</h2>
              <p>We do not sell, rent, or trade your personal information. We may share information with:</p>
              <ul>
                <li><strong>Service providers:</strong> Third-party vendors who help us operate our services (e.g., hosting, database, analytics). These vendors are bound by confidentiality obligations.</li>
                <li><strong>Legal requirements:</strong> When required by law, regulation, or legal process.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>5. Cookies and Tracking</h2>
              <p>Our website may use cookies and similar technologies for functionality and basic analytics. These may include session cookies necessary for the website to function, and analytics cookies to understand traffic patterns. You can control cookie preferences through your browser settings.</p>
            </div>

            <div className="legal-section">
              <h2>6. Data Security</h2>
              <p>We implement industry-standard security measures to protect your information, including encryption in transit (HTTPS). However, no transmission over the internet is completely secure. We encourage you to use strong passwords and maintain the security of your devices.</p>
            </div>

            <div className="legal-section">
              <h2>7. Data Retention</h2>
              <p>We retain your information for as long as necessary to provide our services and comply with legal obligations. Waitlist data is retained until the product launches and the waitlist period ends, or until you request deletion.</p>
            </div>

            <div className="legal-section">
              <h2>8. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt out of marketing communications</li>
              </ul>
              <p style={{ marginTop: '1rem' }}>To exercise any of these rights, email us at <a href="mailto:immersivetechs@icloud.com" style={{ color: 'var(--accent0)', textDecoration: 'none' }}>immersivetechs@icloud.com</a>. We will respond within 30 days.</p>
            </div>

            <div className="legal-section">
              <h2>9. Children's Privacy</h2>
              <p>Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will delete it promptly.</p>
            </div>

            <div className="legal-section">
              <h2>10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the "Last updated" date at the top of this page. Continued use of our services after changes constitutes acceptance of the updated policy.</p>
            </div>

            <div className="legal-section">
              <h2>11. Contact</h2>
              <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '1rem 1.25rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '12px', width: 'fit-content' }}>
                <Mail size={16} color="var(--accent0)" />
                <a href="mailto:immersivetechs@icloud.com" style={{ color: 'var(--accent0)', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 600 }}>immersivetechs@icloud.com</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
