// src/components/Features.jsx

import { useState } from 'react';
import '../styles/features.css';

function Features() {
  const features = [
    {
      icon: '🤖',
      title: 'AI Matching',
      description: 'Our AI analyzes customer requests in real-time and automatically finds the perfect jet for every flight.',
      stat: '95% Match Accuracy',
      color: '#667eea'
    },
    {
      icon: '📍',
      title: 'Live Tracking',
      description: 'Customers see where your jets are in real-time. Increases trust and reduces support requests by 80%.',
      stat: 'Real-time Updates',
      color: '#764ba2'
    },
    {
      icon: '⚡',
      title: 'Instant Bookings',
      description: 'From request to booking in under 5 minutes. No manual processes, no delays.',
      stat: '<5 Min Booking',
      color: '#f093fb'
    },
    {
      icon: '📊',
      title: 'Smart Analytics',
      description: 'See exactly which jets are most profitable. Optimize your fleet based on real data.',
      stat: '+40% Profitability',
      color: '#4facfe'
    },
    {
      icon: '💰',
      title: 'Dynamic Pricing',
      description: 'AI automatically calculates optimal prices based on demand, season, and competition.',
      stat: '+23% Revenue',
      color: '#43e97b'
    },
    {
      icon: '🌍',
      title: 'Global Network',
      description: 'Access to customers worldwide. Your jets fly not just locally, but internationally.',
      stat: '150+ Countries',
      color: '#fa709a'
    }
  ];

  return (
    <section className="features-section" id="features">
      <div className="features-container">
        
        {/* Header */}
        <div className="features-header">
          <h2>Why JetOpti?</h2>
          <p>The complete solution for modern charter operations</p>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

      </div>
    </section>
  );
}

function FeatureCard({ feature, index }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="feature-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 0.1}s`
      }}
    >
      {/* Icon */}
      <div 
        className="feature-icon"
        style={{ 
          background: isHovered ? feature.color : '#f5f5f5',
          transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
        }}
      >
        <span>{feature.icon}</span>
      </div>

      {/* Content */}
      <div className="feature-content">
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
        
        {/* Stat Badge */}
        <div 
          className="feature-stat"
          style={{ 
            background: feature.color,
            opacity: isHovered ? 1 : 0.9
          }}
        >
          {feature.stat}
        </div>
      </div>
    </div>
  );
}

export default Features;