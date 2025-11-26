// src/pages/Landing.jsx

import { Link } from 'react-router-dom';
import '../styles/Landing.css';
import ContactForm from '../components/ContactForm';

export default function Landing() {
  return (
    <div className="landing-page">
      
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-menu">
            <Link to="/map" className="nav-link">View Jets</Link>
            <Link to="/dashboard" className="nav-link">For Charter Companies</Link>
            <Link to="/dashboard" className="btn-nav">List Your Fleet</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION WITH VIDEO BACKGROUND */}
      <section className="hero">
        {/* Video Background */}
        <div className="hero-video-container">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="hero-video"
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Dark overlay for text readability */}
          <div className="hero-video-overlay"></div>
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <img 
            src="/images/logo.png" 
            alt="JetOpti Logo" 
            className="hero-logo-color" 
          />
          <h1>Book Fast. Fly Smart.</h1>
          <p className="hero-subtitle">
            AI-powered marketplace connecting charter companies with customers worldwide
          </p>
          <div className="hero-cta">
            <Link to="/dashboard" className="btn-primary">
              List Your Fleet
            </Link>
            <Link to="/map" className="btn-secondary">
              Find Your Perfect Jet
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">$4B</div>
              <div className="stat-label">Market Size</div>
            </div>
            <div className="stat">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Annual Flights</div>
            </div>
            <div className="stat">
              <div className="stat-number">200+</div>
              <div className="stat-label">Global Operators</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-section">
        <div className="features-container">
          
          <div className="features-header">
            <h2>Why JetOpti?</h2>
            <p>The complete solution for modern charter operations</p>
          </div>

          <div className="features-grid">
            
            {/* Feature 1 - AI Matching */}
            <div className="feature-card">
              <div className="feature-image">
                <img src="/images/features/ai-matching.jpg" alt="AI Matching System" />
              </div>
              <div className="feature-content">
                <h3>AI Matching</h3>
                <p>AI-powered matching that analyzes customer requests in real-time and connects them with the perfect jet for every flight.</p>
                <div className="feature-stat">Smart Algorithm</div>
              </div>
            </div>

            {/* Feature 2 - Live Tracking */}
            <div className="feature-card">
              <div className="feature-image">
                <img src="/images/features/live-tracking.jpg" alt="Live Tracking System" />
              </div>
              <div className="feature-content">
                <h3>Live Tracking</h3>
                <p>Real-time jet tracking that lets customers see where aircraft are. Builds trust and reduces support requests.</p>
                <div className="feature-stat">Real-time Updates</div>
              </div>
            </div>

            {/* Feature 3 - Instant Bookings */}
            <div className="feature-card">
              <div className="feature-image">
                <img src="/images/features/instant-bookings.jpg" alt="Instant Booking Interface" />
              </div>
              <div className="feature-content">
                <h3>Instant Bookings</h3>
                <p>From request to booking in minutes. Automated processes eliminate delays and manual work.</p>
                <div className="feature-stat">Lightning Fast</div>
              </div>
            </div>

            {/* Feature 4 - Smart Analytics */}
            <div className="feature-card">
              <div className="feature-image">
                <img src="/images/features/smart-analytics.jpg" alt="Analytics Dashboard" />
              </div>
              <div className="feature-content">
                <h3>Smart Analytics</h3>
                <p>Data-driven insights showing exactly which jets are most profitable. Optimize your fleet based on real data.</p>
                <div className="feature-stat">Data-Driven</div>
              </div>
            </div>

            {/* Feature 5 - Dynamic Pricing */}
            <div className="feature-card">
              <div className="feature-image">
                <img src="/images/features/dynamic-pricing.jpg" alt="Dynamic Pricing Engine" />
              </div>
              <div className="feature-content">
                <h3>Dynamic Pricing</h3>
                <p>AI calculates optimal prices based on demand, season, and competition to maximize your revenue.</p>
                <div className="feature-stat">Revenue Optimization</div>
              </div>
            </div>

            {/* Feature 6 - Global Network */}
            <div className="feature-card">
              <div className="feature-image">
                <img src="/images/features/global-network.jpg" alt="Global Aviation Network" />
              </div>
              <div className="feature-content">
                <h3>Global Network</h3>
                <p>Connect with customers worldwide. Your jets fly not just locally, but internationally.</p>
                <div className="feature-stat">Worldwide Reach</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="how-it-works-section">
        <div className="features-container">
          
          <div className="features-header">
            <h2>How JetOpti Works</h2>
            <p>Three simple steps to transform your charter business</p>
          </div>

          <div className="features-grid">
            
            {/* Step 1 */}
            <div className="feature-card">
              <div className="feature-image">
                <img src="/images/steps/step-1.jpg" alt="List Your Fleet" />
              </div>
              <div className="feature-content">
                <div className="step-number-badge">1</div>
                <h3>List Your Fleet</h3>
                <p>Add your jets in minutes. Set prices, availability, and specifications. Our AI optimizes your listings automatically.</p>
                <div className="step-features-list">
                  <span>• 5 min setup</span>
                  <span>• Auto-optimization</span>
                  <span>• Real-time sync</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="feature-card">
              <div className="feature-image">
                <img src="/images/steps/step-2.jpg" alt="AI Matches Customers" />
              </div>
              <div className="feature-content">
                <div className="step-number-badge">2</div>
                <h3>AI Matches Customers</h3>
                <p>Our AI analyzes customer requests and automatically matches them with your perfect jet. No manual work required.</p>
                <div className="step-features-list">
                  <span>• Smart matching</span>
                  <span>• Instant notifications</span>
                  <span>• Automated process</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="feature-card">
              <div className="feature-image">
                <img src="/images/steps/step-3.jpg" alt="Get Bookings" />
              </div>
              <div className="feature-content">
                <div className="step-number-badge">3</div>
                <h3>Get Bookings</h3>
                <p>Customers book instantly. You receive payment automatically. Focus on flying, we handle everything else.</p>
                <div className="step-features-list">
                  <span>• Instant booking</span>
                  <span>• Auto payments</span>
                  <span>• More revenue</span>
                </div>
              </div>
            </div>

          </div>

          {/* Dual CTA */}
          <div className="how-cta-dual">
            <div className="cta-column">
              <h3>Charter Companies</h3>
              <p>Join our network and reach more customers</p>
              <Link to="/dashboard" className="btn-primary-large">
                List Your Fleet
              </Link>
              <p className="cta-subtitle">No fees until you get bookings</p>
            </div>
            
            <div className="cta-divider"></div>

            <div className="cta-column">
              <h3>Travelers</h3>
              <p>Find and book your perfect private jet</p>
              <Link to="/map" className="btn-secondary-large">
                Find Your Jet
              </Link>
              <p className="cta-subtitle">Compare prices • Instant booking</p>
            </div>
          </div>

        </div>
      </section>

      {/* CONTACT FORM */}
      <ContactForm />

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 JetOpti. Made in Germany 🇩🇪</p>
          <div className="footer-links">
            <a href="/impressum">Imprint</a>
            <a href="/datenschutz">Privacy</a>
            <a href="/agb">Terms</a>
          </div>
        </div>
      </footer>

    </div>
  );
}