// src/pages/Privacy.jsx
import React from 'react';
import '../styles/Legal.css';

function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        
        <section>
          <p className="note">
            <em><strong>Note:</strong> JetOpti is currently in Beta/MVP phase. This privacy policy 
            outlines how we handle your data during testing and will be updated before full launch.</em>
          </p>
        </section>

        <section>
          <h2>1. Privacy at a Glance</h2>
          <h3>General Information</h3>
          <p>
            The following information provides a simple overview of what happens to your personal data 
            when you visit this website. Personal data is any data that can be used to personally 
            identify you.
          </p>
          <h3>Data Collection on This Website</h3>
          <p>
            <strong>Who is responsible for data collection on this website?</strong>
          </p>
          <p>
            Data processing on this website is carried out by the website operator. You can find their 
            contact details in section 2 of this privacy policy.
          </p>
        </section>

        <section>
          <h2>2. Responsible Party</h2>
          <p>
            The party responsible for data processing on this website is:<br /><br />
            <strong>JetOpti</strong><br />
            Ronny Stephan<br />
            Blankenauer Straße 2<br />
            09113 Chemnitz<br />
            Germany<br /><br />
            Email: <a href="mailto:info@jetopti.com">info@jetopti.com</a>
          </p>
          <p>
            The responsible party is the natural or legal person who alone or jointly with others 
            determines the purposes and means of processing personal data (e.g., names, email addresses).
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
            <li>Phone number (optional)</li>
            <li>Additional optional information</li>
          </ul>
          <p>
            <strong>Legal basis:</strong> Art. 6 para. 1 lit. b GDPR (contract initiation) and Art. 6 para. 1 lit. f GDPR (legitimate interests)<br />
            <strong>Storage period:</strong> Until complete processing of your request, then according 
            to legal retention periods (generally 3 years for commercial correspondence).
          </p>

          <h3>User Registration & Authentication</h3>
          <p>
            When you create an account on our platform, we collect and process:
          </p>
          <ul>
            <li>Email address (for login and communication)</li>
            <li>Password (encrypted storage)</li>
            <li>User type (charter company or customer)</li>
            <li>Company name or personal name</li>
            <li>Phone number (optional)</li>
          </ul>
          <p>
            <strong>Legal basis:</strong> Art. 6 para. 1 lit. b GDPR (contract performance)<br />
            <strong>Storage period:</strong> Until account deletion or statutory retention requirements apply.
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
            This data is not combined with other data sources. The collection of this data is based on 
            Art. 6 para. 1 lit. f GDPR. The website operator has a legitimate interest in the technically 
            error-free presentation and optimization of their website.
          </p>
          <p>
            <strong>Storage period:</strong> Log files are automatically deleted after 14 days.
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
            and location data. Mapbox may also use cookies.
          </p>
          <p>
            <strong>Legal basis:</strong> Art. 6 para. 1 lit. f GDPR (legitimate interest in interactive map display)<br />
            More information: 
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
            Supabase processes user data on our behalf. All data is stored on secure servers with 
            encryption. We have concluded a data processing agreement with Supabase.
          </p>
          <p>
            <strong>Legal basis:</strong> Art. 6 para. 1 lit. b GDPR (contract performance)<br />
            Privacy Policy: 
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
              https://supabase.com/privacy
            </a>
          </p>

          <h3>Vercel (Hosting)</h3>
          <p>
            Our website is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
          </p>
          <p>
            Vercel processes technical data necessary for the delivery of our website (server logs, 
            IP addresses).
          </p>
          <p>
            <strong>Legal basis:</strong> Art. 6 para. 1 lit. f GDPR (legitimate interest in stable hosting)<br />
            Privacy Policy: 
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              https://vercel.com/legal/privacy-policy
            </a>
          </p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>You have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Right to information (Art. 15 GDPR):</strong> You can request information about your stored data.</li>
            <li><strong>Right to rectification (Art. 16 GDPR):</strong> You can request the correction of incorrect data.</li>
            <li><strong>Right to erasure (Art. 17 GDPR):</strong> You can request the deletion of your data, unless legal retention obligations exist.</li>
            <li><strong>Right to restriction of processing (Art. 18 GDPR):</strong> You can request the restriction of processing.</li>
            <li><strong>Right to object (Art. 21 GDPR):</strong> You can object to the processing based on legitimate interests.</li>
            <li><strong>Right to data portability (Art. 20 GDPR):</strong> You can receive your data in a structured, commonly used format.</li>
            <li><strong>Right to lodge a complaint:</strong> You can file a complaint with a data protection supervisory authority.</li>
            <li><strong>Right to withdraw consent:</strong> If processing is based on your consent, you can withdraw it at any time.</li>
          </ul>
          <p>
            To exercise your rights, please contact us at: 
            <a href="mailto:info@jetopti.com">info@jetopti.com</a>
          </p>
        </section>

        <section>
          <h2>6. Data Security</h2>
          <p>
            We use the widespread SSL/TLS (Secure Socket Layer/Transport Layer Security) encryption in 
            connection with the highest encryption level supported by your browser when visiting the website. 
            You can recognize an encrypted connection by the lock symbol in your browser's address bar and 
            the "https://" protocol.
          </p>
          <p>
            We also employ appropriate technical and organizational measures to protect your data against 
            accidental or intentional manipulation, partial or complete loss, destruction, or unauthorized 
            access by third parties.
          </p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>
            Unless a specific storage period is specified in this privacy policy, your personal data will 
            remain with us until the purpose for data processing no longer applies. If you assert a 
            legitimate deletion request or revoke consent to data processing, your data will be deleted 
            unless we have other legally permissible reasons for storing your personal data (e.g., tax or 
            commercial law retention periods).
          </p>
        </section>

        <section>
          <h2>8. Changes to This Privacy Policy</h2>
          <p>
            We reserve the right to adapt this privacy policy so that it always complies with current 
            legal requirements or to implement changes to our services in the privacy policy, e.g., when 
            introducing new services. The new privacy policy will then apply to your next visit.
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
