// src/pages/Landing.jsx - COMING SOON VERSION

import { Link } from 'react-router-dom';
import '../styles/Landing.css';
import ContactForm from '../components/ContactForm';
import InstallPWA from '../components/InstallPWA';
import { useState } from 'react';
import SignupModal from '../components/SignupModal';

export default function Landing() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  // Scroll to contact form
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      
      {/* NAVBAR - Hidden */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-menu">
            {/* Links removed - Coming Soon! */}
          </div>
        </div>
      </nav>

      {/* HERO SECTION WITH VIDEO BACKGROUND */}
      <section className="hero">
        {/* Video Background */}
        <div className="hero-video-container">
          <video 
  poster="/images/hero-fallback.jpg"  // ← NEU!
  autoPlay 
  loop 
  muted 
  playsInline
  className="hero-video"
>
  <source src="/videos/hero-video.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
          <div className="hero-video-overlay"></div>
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          {/* Coming Soon Badge */}
          <div className="coming-soon-badge">
            🚀 Coming Soon - Join the Waitlist
          </div>
          
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
  <InstallPWA />
  
  <button 
    onClick={() => setIsSignupModalOpen(true)} 
    className="btn-primary"
  >
    Register
  </button>
  
  <button 
    onClick={scrollToContact} 
    className="btn-secondary"
  >
    Get in Touch
  </button>
</div>
        </div>
      </section>



{/* FEATURES SECTION */}
<section className="features-section">
  <div className="features-container">
    
    <div className="features-header">
      <h2>Why JetOpti?</h2>
      <p>Real features, real value - built for the modern charter industry</p>
    </div>

    <div className="features-grid">
      
      {/* Feature 1 - Real-Time Tracking */}
      <div className="feature-card">
        <div className="feature-image">
          <img src="/images/features/live-tracking.jpg" alt="Real-Time Jet Tracking" />
        </div>
        <div className="feature-content">
          <h3>🗺️ Real-Time Tracking</h3>
          <p>See every jet's exact location live on the map. Track flights in real-time across Europe and beyond. Transparency and trust you won't find anywhere else.</p>
          <div className="feature-stat">Live ADSB Data</div>
        </div>
      </div>

      {/* Feature 2 - Fast Request System */}
      <div className="feature-card">
        <div className="feature-image">
          <img src="/images/features/instant-bookings.jpg" alt="Smart Booking System" />
        </div>
        <div className="feature-content">
          <h3>⚡ Fast Request System</h3>
          <p>Request bookings in minutes with our streamlined process. Charter companies receive instant notifications and contact you directly. No middleman delays.</p>
          <div className="feature-stat">Direct Connection</div>
        </div>
      </div>

      {/* Feature 3 - Hot Deals */}
      <div className="feature-card">
        <div className="feature-image">
          <img src="/images/features/hot-deal.jpg" alt="Hot Deals System" />
        </div>
        <div className="feature-content">
          <h3>🔥 Hot Deals (Empty Legs)</h3>
          <p>Automatically created when jets fly back to base. Save up to 75% on premium flights. Real-time updates when new deals become available.</p>
          <div className="feature-stat">Auto-Generated</div>
        </div>
      </div>

      {/* Feature 4 - Smart Search */}
      <div className="feature-card">
        <div className="feature-image">
          <img src="/images/features/smart-search.jpg" alt="Smart Search" />
        </div>
        <div className="feature-content">
          <h3>🎯 Smart Search & Filters</h3>
          <p>Find your perfect jet instantly. Filter by aircraft type, seats, range, and location. Intelligent algorithm matches your needs with available aircraft.</p>
          <div className="feature-stat">Instant Results</div>
        </div>
      </div>

      {/* Feature 5 - Transparent Pricing */}
      <div className="feature-card">
        <div className="feature-image">
          <img src="/images/features/transparent-pricing.jpg" alt="Transparent Pricing" />
        </div>
        <div className="feature-content">
          <h3>💳 Transparent Pricing</h3>
          <p>See prices upfront based on distance and aircraft type. No hidden fees, no surprises. Know exactly what you'll pay before you request.</p>
          <div className="feature-stat">Crystal Clear</div>
        </div>
      </div>

      {/* Feature 6 - Fleet Dashboard */}
      <div className="feature-card">
        <div className="feature-image">
          <img src="/images/features/fleet-dashboard.jpg" alt="Fleet Management Dashboard" />
        </div>
        <div className="feature-content">
          <h3>📊 Fleet Dashboard</h3>
          <p>Complete fleet management for charter companies. Track your jets, manage bookings, create Hot Deals, and monitor performance in real-time.</p>
          <div className="feature-stat">For Operators</div>
        </div>
      </div>

    </div>

    {/* COMING SOON SECTION */}
    <div className="features-coming-soon">
      <h3>🚀 Coming in 2026</h3>
      <div className="coming-soon-grid">
        
        {/* Coming Soon 1 - AI Matching */}
        <div className="coming-soon-card">
          <div className="coming-soon-image">
            <img src="/images/features/ai-matching.jpg" alt="AI-Powered Matching" />
          </div>
          <div className="coming-soon-content">
            <h4>🤖 AI-Powered Matching</h4>
            <p>Machine learning that learns from every booking</p>
          </div>
        </div>

        {/* Coming Soon 2 - Dynamic Pricing */}
        <div className="coming-soon-card">
          <div className="coming-soon-image">
            <img src="/images/features/dynamic-pricing.jpg" alt="Dynamic Pricing" />
          </div>
          <div className="coming-soon-content">
            <h4>💰 Dynamic Pricing</h4>
            <p>AI-optimized pricing based on demand and competition</p>
          </div>
        </div>

        {/* Coming Soon 3 - Global Expansion */}
        <div className="coming-soon-card">
          <div className="coming-soon-image">
            <img src="/images/features/global-network.jpg" alt="Global Expansion" />
          </div>
          <div className="coming-soon-content">
            <h4>🌍 Global Expansion</h4>
            <p>Expanding to international markets worldwide</p>
          </div>
        </div>

        {/* Coming Soon 4 - Mobile App */}
        <div className="coming-soon-card">
          <div className="coming-soon-image">
            <img src="/images/features/mobile-app.jpg" alt="Mobile App" />
          </div>
          <div className="coming-soon-content">
            <h4>📱 Mobile App</h4>
            <p>Native iOS and Android apps for on-the-go booking</p>
          </div>
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

          {/* Dual CTA - NOW WITH WAITLIST */}
          <div className="how-cta-dual">
            <div className="cta-column">
              <h3>Charter Companies</h3>
              <p>Join our network and reach more customers</p>
              <button onClick={scrollToContact} className="btn-primary-large">
                Join Waitlist
              </button>
              <p className="cta-subtitle">Be among the first to launch</p>
            </div>
            
            <div className="cta-divider"></div>

            <div className="cta-column">
              <h3>Travelers</h3>
              <p>Get notified when we launch</p>
              <button onClick={scrollToContact} className="btn-secondary-large">
                Get Early Access
              </button>
              <p className="cta-subtitle">Exclusive early bird discounts</p>
            </div>
          </div>

        </div>
      </section>

      {/* SCREENSHOT SHOWCASE SECTION */}
      <section className="showcase-section">
        <div className="showcase-container">
          
          <div className="showcase-header">
            <h2>See JetOpti in Action</h2>
            <p>Real screenshots from our platform - built for speed and simplicity</p>
          </div>

          <div className="showcase-grid">
            
            {/* Screenshot 1 - Interactive Map */}
            <div className="showcase-item showcase-large">
              <div className="screenshot-container">
                <img 
                  src="/images/screenshots/map-view.png" 
                  alt="Interactive Jet Map" 
                  className="screenshot-img"
                />
                <div className="screenshot-badge">Coming Soon</div>
              </div>
              <div className="screenshot-content">
                <h3>🗺️ Interactive Map</h3>
                <p>Real-time jet tracking across Europe and beyond. Filter by type, seats, and range. AI-powered matching finds your perfect jet instantly.</p>
                <div className="screenshot-features">
                  <span>✓ Live tracking</span>
                  <span>✓ Smart filters</span>
                  <span>✓ Hot Deals</span>
                </div>
              </div>
            </div>

            {/* Screenshot 2 - Charter Dashboard */}
            <div className="showcase-item">
              <div className="screenshot-container">
                <img 
                  src="/images/screenshots/dashboard.png" 
                  alt="Charter Company Dashboard" 
                  className="screenshot-img"
                />
                <div className="screenshot-badge">Coming Soon</div>
              </div>
              <div className="screenshot-content">
                <h3>📊 Smart Dashboard</h3>
                <p>Manage your entire fleet from one place. Track bookings, revenue, and Hot Deals in real-time.</p>
                <div className="screenshot-features">
                  <span>✓ Real-time stats</span>
                  <span>✓ Fleet management</span>
                </div>
              </div>
            </div>

            {/* Screenshot 3 - Jet Details */}
            <div className="showcase-item">
              <div className="screenshot-container">
                <img 
                  src="/images/screenshots/jet-details.png" 
                  alt="Jet Details View" 
                  className="screenshot-img"
                />
                <div className="screenshot-badge">Coming Soon</div>
              </div>
              <div className="screenshot-content">
                <h3>✈️ Detailed Jet Info</h3>
                <p>Every detail at a glance. Seats, range, Hot Deals discount - everything transparent.</p>
                <div className="screenshot-features">
                  <span>✓ Full specs</span>
                  <span>✓ Instant booking</span>
                </div>
              </div>
            </div>

            {/* Screenshot 4 - AI Matching */}
            <div className="showcase-item">
              <div className="screenshot-container">
                <img 
                  src="/images/screenshots/ai-match.png" 
                  alt="AI Matching Result" 
                  className="screenshot-img"
                />
                <div className="screenshot-badge">Coming Soon</div>
              </div>
              <div className="screenshot-content">
                <h3>🎯 Perfect Match</h3>
                <p>AI analyzes distance, route, price, and availability to find your ideal jet in seconds.</p>
                <div className="screenshot-features">
                  <span>✓ Smart algorithm</span>
                  <span>✓ Best price</span>
                </div>
              </div>
            </div>

            {/* Screenshot 5 - Hot Deals */}
            <div className="showcase-item">
              <div className="screenshot-container">
                <img 
                  src="/images/screenshots/hotdeal.png" 
                  alt="Hot Deals Feature" 
                  className="screenshot-img"
                />
                <div className="screenshot-badge">Coming Soon</div>
              </div>
              <div className="screenshot-content">
                <h3>🔥 Hot Deals</h3>
                <p>Exclusive discounts on empty leg flights. Save up to 75% on premium jets flying back to their home base.</p>
                <div className="screenshot-features">
                  <span>✓ Up to 75% off</span>
                  <span>✓ Limited time</span>
                  <span>✓ Best value</span>
                </div>
              </div>
            </div>

          </div>

          

        </div>
      </section>

      {/* CONTACT FORM */}
      <ContactForm />

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 JetOpti - Book Fast. Fly Smart.</p>
          <div className="footer-links">
            <a href="/impressum">Imprint</a>
            <a href="/datenschutz">Privacy</a>
            <a href="/agb">Terms</a>
          </div>
        </div>
      </footer>

      {/* Signup Modal */}
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)} 
      />

    </div>
  );
}