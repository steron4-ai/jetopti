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
    // GA4: Track when PWA is installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      console.log("JetOpti PWA installed successfully!");

      if (window.gtag) {
        window.gtag("event", "pwa_installed", {
          event_category: "pwa",
          event_label: "jetopti_install_success"
        });
      }
    };

    // Already installed?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Detect installability (Android / Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // GA4: Track button clicks
    if (window.gtag) {
      window.gtag("event", "pwa_download_click", {
        event_category: "engagement",
        event_label: "download_app_button"
      });
    }

    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const closeIOSInstructions = () => setShowIOSInstructions(false);

  if (isInstalled) return null;
  if (!isInstallable && !isIOS) return null;

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
