// src/components/InstallPWA.jsx
import { useState, useEffect } from 'react';
import '../styles/InstallPWA.css';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      console.log('JetOpti PWA installed successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // Show install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const closeIOSInstructions = () => {
    setShowIOSInstructions(false);
  };

  // Don't show button if already installed
  if (isInstalled) {
    return null;
  }

  // Show button if installable OR if iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <button 
        onClick={handleInstallClick} 
        className="btn-app-download"
      >
        <span className="btn-icon">📱</span>
        <span className="btn-text">Download App</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="ios-instructions-overlay" onClick={closeIOSInstructions}>
          <div className="ios-instructions-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ios-close-btn" onClick={closeIOSInstructions}>×</button>
            
            <h3>📱 Install JetOpti on iOS</h3>
            
            <div className="ios-steps">
              <div className="ios-step">
                <div className="ios-step-number">1</div>
                <div className="ios-step-content">
                  <p>Tap the <strong>Share</strong> button</p>
                  <div className="ios-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M18 8l-1.41 1.41L18.17 11H8v2h10.17l-1.58 1.59L18 16l4-4-4-4zM6 8v8h2V8H6z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="ios-step">
                <div className="ios-step-number">2</div>
                <div className="ios-step-content">
                  <p>Scroll and tap <strong>"Add to Home Screen"</strong></p>
                </div>
              </div>

              <div className="ios-step">
                <div className="ios-step-number">3</div>
                <div className="ios-step-content">
                  <p>Tap <strong>"Add"</strong> in the top right</p>
                </div>
              </div>

              <div className="ios-step">
                <div className="ios-step-number">4</div>
                <div className="ios-step-content">
                  <p>JetOpti icon will appear on your home screen!</p>
                </div>
              </div>
            </div>

            <button className="ios-got-it-btn" onClick={closeIOSInstructions}>
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
