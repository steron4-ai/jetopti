// src/pages/Imprint.jsx
import React from 'react';
import '../styles/Legal.css';

function Imprint() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Imprint</h1>
        
        <section>
          <h2>Information according to § 5 TMG</h2>
          <p>
            <strong>JetOpti</strong><br />
            [Company Form - e.g. GmbH, UG, Sole Proprietorship]<br />
            [Street and Number]<br />
            [ZIP Code and City]<br />
            Germany
          </p>
        </section>

        <section>
          <h2>Represented by</h2>
          <p>
            [Managing Director/Owner Name]
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Phone: [+49 XXX XXXXXXX]<br />
            Email: <a href="mailto:info@jetopti.com">info@jetopti.com</a><br />
            Website: <a href="https://jetopti.com">www.jetopti.com</a>
          </p>
        </section>

        <section>
          <h2>Commercial Register</h2>
          <p>
            Entry in the Commercial Register<br />
            Registration Court: [e.g. District Court Frankfurt]<br />
            Registration Number: [HRB XXXXX]
          </p>
          <p className="note">
            <em>Note: Fill in after company registration. Not required for MVP/Beta phase.</em>
          </p>
        </section>

        <section>
          <h2>VAT ID</h2>
          <p>
            VAT identification number according to § 27 a VAT Tax Act:<br />
            DE [XXX XXX XXX]
          </p>
          <p className="note">
            <em>Note: Fill in after tax registration. Not required for MVP/Beta phase.</em>
          </p>
        </section>

        <section>
          <h2>EU Dispute Resolution</h2>
          <p>
            The European Commission provides a platform for online dispute resolution (ODR): 
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr/
            </a>
            <br />
            You can find our email address in the contact section above.
          </p>
        </section>

        <section>
          <h2>Consumer Dispute Resolution</h2>
          <p>
            We are not willing or obliged to participate in dispute resolution proceedings before a 
            consumer arbitration board.
          </p>
        </section>

        <section>
          <h2>Liability for Content</h2>
          <p>
            As a service provider, we are responsible for our own content on these pages according to 
            general laws pursuant to § 7 para.1 TMG. However, according to §§ 8 to 10 TMG, we are not 
            obligated as a service provider to monitor transmitted or stored third-party information or 
            to investigate circumstances that indicate illegal activity.
          </p>
        </section>

        <section>
          <h2>Liability for Links</h2>
          <p>
            Our website contains links to external third-party websites over whose content we have no 
            influence. Therefore, we cannot assume any liability for this external content. The respective 
            provider or operator of the pages is always responsible for the content of the linked pages.
          </p>
        </section>

        <section>
          <h2>Copyright</h2>
          <p>
            The content and works created by the site operators on these pages are subject to German 
            copyright law. The duplication, processing, distribution, and any kind of exploitation outside 
            the limits of copyright require the written consent of the respective author or creator.
          </p>
        </section>

        <div className="back-link">
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}

export default Imprint;
