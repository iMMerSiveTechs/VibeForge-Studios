import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail } from 'lucide-react';

export default function Terms() {
  const lastUpdated = 'February 2026';

  return (
    <>
      <Helmet>
        <title>Terms of Service — VibeForge Studios</title>
        <meta name="description" content="VibeForge Studios LLC Terms of Service. Read our terms for using the VibeForge Studios website and services." />
        <meta property="og:title" content="Terms of Service — VibeForge Studios" />
      </Helmet>

      <section style={{ padding: '10rem 0 9rem', background: 'var(--bg0)' }}>
        <div className="section-container">
          <div style={{ maxWidth: '760px' }}>
            <div className="vf-chip" style={{ marginBottom: '1.5rem' }}>Legal</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text0)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }} data-testid="terms-heading">
              Terms of Service
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '3rem' }}>
              VibeForge Studios LLC — Last updated: {lastUpdated}
            </p>

            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '3rem' }} />

            <div className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing or using the VibeForge Studios website (vibeforge.studio) and any related services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Services.</p>
            </div>

            <div className="legal-section">
              <h2>2. Description of Services</h2>
              <p>VibeForge Studios LLC provides a marketing website describing forthcoming software products (Habit, VibeForge Studios App, and VibeForge Desk) and related waitlist and support services. The products described are in development and not yet publicly released.</p>
            </div>

            <div className="legal-section">
              <h2>3. Use of the Site</h2>
              <p>You agree to use the Services only for lawful purposes. You must not:</p>
              <ul>
                <li>Violate any applicable law or regulation</li>
                <li>Transmit spam, malicious code, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Misrepresent your identity or affiliation</li>
                <li>Engage in any activity that disrupts or interferes with the Services</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>4. Intellectual Property</h2>
              <p>All content on this site — including text, graphics, logos, product names, design elements, and source code — is the exclusive property of VibeForge Studios LLC or its licensors and is protected by United States and international intellectual property laws.</p>
              <p style={{ marginTop: '1rem' }}>You may not copy, reproduce, distribute, modify, or create derivative works from any content on this site without our express written permission.</p>
            </div>

            <div className="legal-section">
              <h2>5. Waitlist Participation</h2>
              <p>Joining a waitlist does not create a contractual obligation on the part of VibeForge Studios LLC to provide any product or service. Waitlist position does not guarantee access, pricing, or availability. We reserve the right to modify, delay, or cancel any product at any time.</p>
            </div>

            <div className="legal-section">
              <h2>6. Disclaimers</h2>
              <p>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
              <p style={{ marginTop: '1rem' }}>VibeForge Studios LLC does not warrant that the site will be uninterrupted, error-free, or free of viruses or other harmful components.</p>
            </div>

            <div className="legal-section">
              <h2>7. Limitation of Liability</h2>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIBEFORGE STUDIOS LLC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICES.</p>
              <p style={{ marginTop: '1rem' }}>Our total liability to you for any claim arising out of these Terms shall not exceed fifty dollars ($50).</p>
            </div>

            <div className="legal-section">
              <h2>8. Third-Party Links</h2>
              <p>Our site may contain links to third-party websites. These links are provided for convenience only. VibeForge Studios LLC has no control over third-party sites and is not responsible for their content, privacy practices, or terms of service.</p>
            </div>

            <div className="legal-section">
              <h2>9. Governing Law</h2>
              <p>These Terms are governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law principles. Any dispute arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in California.</p>
            </div>

            <div className="legal-section">
              <h2>10. Changes to Terms</h2>
              <p>We reserve the right to update these Terms at any time. Changes are effective upon posting to the site. Continued use of the Services after changes constitutes acceptance of the updated Terms. We encourage you to review this page periodically.</p>
            </div>

            <div className="legal-section">
              <h2>11. Contact</h2>
              <p>Questions about these Terms? Contact us:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '1rem 1.25rem', background: 'var(--surface0)', border: '1px solid var(--border)', borderRadius: '12px', width: 'fit-content' }}>
                <Mail size={16} color="var(--accent0)" />
                <a href="mailto:immersivetechs@icloud.com" style={{ color: 'var(--accent0)', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 600 }}>immersivetechs@icloud.com</a>
              </div>
              <p style={{ marginTop: '1rem' }}>VibeForge Studios LLC — California, United States</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
