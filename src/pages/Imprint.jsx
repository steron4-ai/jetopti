// src/pages/Imprint.jsx
import React from 'react';
import '../styles/Legal.css';

function Imprint() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Imprint</h1>
        
        <section>
          <p className="note">
            <em><strong>Note:</strong> JetOpti is currently in Beta/MVP phase operating as a lead generation platform. 
            No direct charter services are provided at this stage. Full company registration will be 
            completed before commercial operations begin.</em>
          </p>
        </section>

        <section>
          <h2>Information according to § 5 TMG</h2>
          <p>
            <strong>JetOpti</strong><br />
            Sole Proprietorship (planned registration)<br />
            Ronny Stephan<br />
            Blankenauer Straße 2<br />
            09113 Chemnitz<br />
            Germany
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Email: <a href="mailto:info@jetopti.com">info@jetopti.com</a><br />
            Website: <a href="https://jetopti.com">www.jetopti.com</a>
          </p>
        </section>

        <section>
          <h2>Commercial Register</h2>
          <p className="note">
            <em>Company registration will be completed upon first commercial bookings. 
            During Beta phase, JetOpti operates as a lead generation platform only.</em>
          </p>
        </section>

        <section>
          <h2>VAT ID</h2>
          <p className="note">
            <em>VAT registration will be completed upon company formation and commencement 
            of commercial operations.</em>
          </p>
        </section>

        <section>
          <h2>Responsible for Content</h2>
          <p>
            Ronny Stephan<br />
            Blankenauer Straße 2<br />
            09113 Chemnitz<br />
            Germany
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
          <p>
            Obligations to remove or block the use of information under general laws remain unaffected. 
            However, liability in this regard is only possible from the time of knowledge of a specific 
            legal violation. Upon becoming aware of corresponding legal violations, we will remove this 
            content immediately.
          </p>
        </section>

        <section>
          <h2>Liability for Links</h2>
          <p>
            Our website contains links to external third-party websites over whose content we have no 
            influence. Therefore, we cannot assume any liability for this external content. The respective 
            provider or operator of the pages is always responsible for the content of the linked pages. 
            The linked pages were checked for possible legal violations at the time of linking. Illegal 
            content was not recognizable at the time of linking.
          </p>
        </section>

        <section>
          <h2>Copyright</h2>
          <p>
            The content and works created by the site operators on these pages are subject to German 
            copyright law. The duplication, processing, distribution, and any kind of exploitation outside 
            the limits of copyright require the written consent of the respective author or creator. 
            Downloads and copies of this site are only permitted for private, non-commercial use.
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
