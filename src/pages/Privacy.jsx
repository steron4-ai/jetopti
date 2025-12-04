// src/pages/Privacy.jsx
import React from 'react';
import '../styles/Legal.css';

function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        
        <section>
          <h2>1. Privacy at a Glance</h2>
          <h3>General Information</h3>
          <p>
            The following information provides a simple overview of what happens to your personal data 
            when you visit this website. Personal data is any data that can be used to personally 
            identify you.
          </p>
        </section>

        <section>
          <h2>2. Responsible Party</h2>
          <p>
            The party responsible for data processing on this website is:<br /><br />
            <strong>JetOpti</strong><br />
            [Street and Number]<br />
            [ZIP Code and City]<br />
            Germany<br /><br />
            Phone: [+49 XXX XXXXXXX]<br />
            Email: <a href="mailto:privacy@jetopti.com">privacy@jetopti.com</a>
          </p>
        </section>

        <section>
          <h2>3. Data Collection on This Website</h2>
          
          <h3>Contact Form & Booking Requests</h3>
          <p>
            If you send us inquiries via contact form or email, your information from the inquiry form, 
            including the contact details you provided, will be stored by us for the purpose of processing 
            the inquiry and in case of follow-up questions.
          </p>
          <p>
            <strong>Data processed for booking requests:</strong>
          </p>
          <ul>
            <li>First and last name</li>
            <li>Email address</li>
            <li>Departure and destination location</li>
            <li>Travel date(s)</li>
            <li>Number of passengers</li>
            <li>Additional optional information</li>
          </ul>
          <p>
            <strong>Legal basis:</strong> Art. 6 para. 1 lit. b GDPR (contract initiation)<br />
            <strong>Storage period:</strong> Until complete processing of your request, then according 
            to legal retention periods.
          </p>

          <h3>Server Log Files</h3>
          <p>
            The website provider automatically collects and stores information in server log files that 
            your browser automatically transmits to us:
          </p>
          <ul>
            <li>Browser type and browser version</li>
            <li>Operating system used</li>
            <li>Referrer URL</li>
            <li>Hostname of the accessing computer</li>
            <li>Time of the server request</li>
            <li>IP address</li>
          </ul>
          <p>
            This data is not combined with other data sources.
          </p>
        </section>

        <section>
          <h2>4. External Services</h2>
          
          <h3>Mapbox (Map Service)</h3>
          <p>
            We use the Mapbox map service to display interactive maps. The provider is 
            Mapbox Inc., 740 15th Street NW, 5th Floor, Washington, DC 20005, USA.
          </p>
          <p>
            When using the map function, data is transmitted to Mapbox, in particular your IP address 
            and location data. More information can be found in Mapbox's privacy policy: 
            <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer">
              https://www.mapbox.com/legal/privacy
            </a>
          </p>

          <h3>Supabase (Database & Authentication)</h3>
          <p>
            We use Supabase for secure data storage and user authentication. Provider: 
            Supabase Inc., San Francisco, CA, USA.
          </p>
          <p>
            Privacy Policy: 
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
              https://supabase.com/privacy
            </a>
          </p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>You have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Right to information (Art. 15 GDPR):</strong> You can request information about your stored data.</li>
            <li><strong>Right to rectification (Art. 16 GDPR):</strong> You can request the correction of incorrect data.</li>
            <li><strong>Right to erasure (Art. 17 GDPR):</strong> You can request the deletion of your data.</li>
            <li><strong>Right to restriction of processing (Art. 18 GDPR):</strong> You can request the restriction of processing.</li>
            <li><strong>Right to object (Art. 21 GDPR):</strong> You can object to the processing.</li>
            <li><strong>Right to data portability (Art. 20 GDPR):</strong> You can receive your data in a structured format.</li>
            <li><strong>Right to lodge a complaint:</strong> You can file a complaint with a data protection supervisory authority.</li>
          </ul>
          <p>
            To exercise your rights, please contact us at: 
            <a href="mailto:privacy@jetopti.com">privacy@jetopti.com</a>
          </p>
        </section>

        <section>
          <h2>6. Data Security</h2>
          <p>
            We use the widespread SSL (Secure Socket Layer) method in connection with the highest 
            encryption level supported by your browser when visiting the website.
          </p>
        </section>

        <section>
          <h2>7. Changes to This Privacy Policy</h2>
          <p>
            We reserve the right to adapt this privacy policy so that it always complies with current 
            legal requirements or to implement changes to our services in the privacy policy.
          </p>
          <p>
            <strong>Last updated:</strong> December 2024
          </p>
        </section>

        <div className="back-link">
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
