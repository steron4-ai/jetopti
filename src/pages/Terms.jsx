// src/pages/Terms.jsx
import React from 'react';
import '../styles/Legal.css';

function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        
        <section>
          <p className="note">
            <em><strong>Note:</strong> JetOpti is currently in Beta/MVP phase. These Terms apply to 
            the testing phase where we operate as a lead generation platform only. Updated terms will 
            be provided before full commercial launch.</em>
          </p>
        </section>

        <section>
          <h2>1. Scope of Application</h2>
          <p>
            These Terms of Service ("Terms") govern the use of the JetOpti platform ("Platform"), 
            operated by Ronny Stephan, Chemnitz, Germany ("we", "us", "our"). By using the Platform, 
            you agree to these Terms.
          </p>
          <p>
            <strong>Current Status:</strong> JetOpti is currently in Beta/MVP phase. The Platform 
            operates as a lead generation service, connecting customers with charter companies. We do 
            not provide aviation services directly.
          </p>
        </section>

        <section>
          <h2>2. Services</h2>
          <h3>2.1 For Customers</h3>
          <p>
            JetOpti provides a platform to search for private jet charters and submit booking requests. 
            We forward your request to suitable charter companies who will contact you directly.
          </p>
          <ul>
            <li>Search and compare available jets</li>
            <li>View real-time locations and availability</li>
            <li>Submit booking requests</li>
            <li>Receive offers from charter companies</li>
          </ul>
          <p className="note">
            <em>During Beta: All features are provided "as is" for testing purposes. No binding 
            contracts are created through the platform at this stage.</em>
          </p>

          <h3>2.2 For Charter Companies</h3>
          <p>
            Charter companies can register their fleet on the Platform and receive customer inquiries.
          </p>
          <ul>
            <li>List aircraft with specifications</li>
            <li>Manage availability and pricing</li>
            <li>Create Hot Deals (empty leg flights)</li>
            <li>Receive and manage booking requests</li>
          </ul>
          <p className="note">
            <em>During Beta: Charter companies undergo verification before listings become active. 
            Beta participation is free of charge.</em>
          </p>
        </section>

        <section>
          <h2>3. User Registration</h2>
          <p>
            To use certain features, registration is required. You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Keep your login credentials confidential</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be responsible for all activities under your account</li>
          </ul>
          <p>
            Charter companies must undergo verification before their listings become active. We reserve 
            the right to reject registrations or suspend accounts at our discretion during Beta phase.
          </p>
        </section>

        <section>
          <h2>4. Booking Process & Contract Formation</h2>
          <p>
            <strong>Important:</strong> JetOpti is a marketplace platform. We do not provide aviation 
            services directly. The contract for charter flights is formed directly between the customer 
            and the charter company.
          </p>
          <h3>4.1 Booking Requests (Beta Phase)</h3>
          <p>
            When you submit a booking request through the Platform:
          </p>
          <ol>
            <li>Your request is forwarded to suitable charter companies</li>
            <li>Charter companies review and may respond with offers</li>
            <li>You negotiate and finalize terms directly with the charter company</li>
            <li>Any contract is formed between you and the charter company, not with JetOpti</li>
          </ol>

          <h3>4.2 Our Role</h3>
          <p>
            JetOpti acts solely as an intermediary/lead generator. We are not party to any charter 
            contract and are not responsible for the execution of charter services. We do not guarantee 
            that charter companies will respond to requests or that bookings will be completed.
          </p>
        </section>

        <section>
          <h2>5. Pricing & Payments</h2>
          <h3>5.1 Displayed Prices</h3>
          <p>
            Prices displayed on the Platform are indicative estimates only, based on:
          </p>
          <ul>
            <li>Distance and route</li>
            <li>Aircraft type and specifications</li>
            <li>Charter company pricing</li>
            <li>Seasonal and demand factors</li>
          </ul>
          <p>
            <strong>Final prices are determined solely by the charter company and may vary significantly.</strong> 
            Always confirm the final price directly with the charter company before booking.
          </p>

          <h3>5.2 Payment Processing (Beta Phase)</h3>
          <p>
            During Beta phase: JetOpti does not process any payments. All payments are handled directly 
            between customer and charter company. We are not responsible for payment disputes or refunds.
          </p>
        </section>

        <section>
          <h2>6. Cancellation & Refunds</h2>
          <p>
            Cancellation policies are set by the individual charter company. Please review the specific 
            terms provided by the charter company before booking.
          </p>
          <p>
            JetOpti is not responsible for cancellation disputes, refunds, or any financial matters 
            between customers and charter companies. These matters must be resolved directly with the 
            charter company.
          </p>
        </section>

        <section>
          <h2>7. Liability & Disclaimer</h2>
          <h3>7.1 Platform Availability (Beta)</h3>
          <p>
            We strive for continuous availability but cannot guarantee uninterrupted access. The Platform 
            is provided "as is" and "as available" during Beta phase, without warranties of any kind, 
            either express or implied.
          </p>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the Platform at any time 
            during Beta phase, with or without notice.
          </p>

          <h3>7.2 Aviation Services</h3>
          <p>
            <strong>JetOpti is not responsible for any aspect of aviation services, including but not limited to:</strong>
          </p>
          <ul>
            <li>Flight safety or aircraft maintenance</li>
            <li>Pilot qualifications or crew performance</li>
            <li>Flight delays, cancellations, or route changes</li>
            <li>Loss or damage to luggage or personal property</li>
            <li>Any incidents, accidents, or injuries during charter flights</li>
            <li>Compliance with aviation regulations</li>
            <li>Insurance coverage</li>
          </ul>
          <p>
            Charter companies are solely responsible for all aviation services and compliance with 
            applicable aviation regulations (including EASA, national aviation authorities, etc.).
          </p>

          <h3>7.3 Accuracy of Information</h3>
          <p>
            While we strive for accuracy, we do not guarantee that all information (aircraft 
            specifications, availability, prices, locations) is always current, complete, or accurate. 
            Users should verify all critical information directly with charter companies.
          </p>

          <h3>7.4 Third-Party Content</h3>
          <p>
            Information provided by charter companies (listings, prices, descriptions) is their 
            responsibility. We do not verify or endorse such content and are not liable for its accuracy.
          </p>

          <h3>7.5 Limitation of Liability</h3>
          <p>
            To the maximum extent permitted by law, JetOpti and its operators shall not be liable for 
            any indirect, incidental, special, consequential, or punitive damages, or any loss of profits 
            or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or 
            other intangible losses resulting from:
          </p>
          <ul>
            <li>Your use of or inability to use the Platform</li>
            <li>Any conduct or content of third parties on the Platform</li>
            <li>Any content obtained from the Platform</li>
            <li>Unauthorized access to or alteration of your data</li>
          </ul>
        </section>

        <section>
          <h2>8. User Conduct</h2>
          <p>
            Users agree not to:
          </p>
          <ul>
            <li>Provide false or misleading information</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Interfere with the Platform's operation or security</li>
            <li>Attempt unauthorized access to systems or data</li>
            <li>Use the Platform for fraudulent purposes</li>
            <li>Harass or harm other users or charter companies</li>
            <li>Scrape or copy content without permission</li>
            <li>Use automated systems to access the Platform</li>
            <li>Impersonate any person or entity</li>
          </ul>
          <p>
            Violations may result in immediate account suspension or termination without notice.
          </p>
        </section>

        <section>
          <h2>9. Intellectual Property</h2>
          <p>
            All content, features, functionality, trademarks, logos, and data on the Platform are owned 
            by JetOpti or licensed to us and are protected by international copyright, trademark, and 
            other intellectual property laws.
          </p>
          <p>
            Users may not copy, modify, distribute, sell, or commercially use any Platform content 
            without our prior written permission. Limited use for personal, non-commercial purposes 
            is permitted.
          </p>
        </section>

        <section>
          <h2>10. Data Protection</h2>
          <p>
            Your use of the Platform is also governed by our Privacy Policy. By using the Platform, 
            you agree to our data processing practices as described in the Privacy Policy.
          </p>
          <p>
            We process personal data in accordance with the EU General Data Protection Regulation (GDPR) 
            and German data protection laws.
          </p>
        </section>

        <section>
          <h2>11. Beta Testing Provisions</h2>
          <p>
            During the Beta phase, you acknowledge and agree that:
          </p>
          <ul>
            <li>The Platform may contain bugs, errors, or incomplete features</li>
            <li>Your feedback helps us improve the Platform</li>
            <li>Features may change without notice</li>
            <li>Data may be lost during updates or maintenance</li>
            <li>Beta access may be terminated at any time</li>
            <li>No service level agreements (SLAs) apply during Beta</li>
          </ul>
        </section>

        <section>
          <h2>12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Significant changes will be 
            communicated via email or Platform notification at least 7 days before they take effect.
          </p>
          <p>
            Continued use of the Platform after changes constitutes acceptance of the new Terms. If you 
            do not agree to the changes, you must stop using the Platform and may delete your account.
          </p>
        </section>

        <section>
          <h2>13. Termination</h2>
          <h3>13.1 By Users</h3>
          <p>
            Users may terminate their account at any time by contacting us at info@jetopti.com or using 
            the account deletion function in the Platform.
          </p>

          <h3>13.2 By Us</h3>
          <p>
            We reserve the right to suspend or terminate accounts immediately for:
          </p>
          <ul>
            <li>Violations of these Terms</li>
            <li>Fraudulent or illegal activity</li>
            <li>Providing false information</li>
            <li>At our discretion during Beta phase</li>
          </ul>
          <p>
            Upon termination, your right to use the Platform ceases immediately. We may delete your 
            data according to our Privacy Policy and retention requirements.
          </p>
        </section>

        <section>
          <h2>14. Governing Law & Jurisdiction</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the Federal 
            Republic of Germany, without regard to its conflict of law provisions.
          </p>
          <p>
            Any disputes arising from or relating to these Terms or the use of the Platform shall be 
            subject to the exclusive jurisdiction of the courts of Chemnitz, Germany.
          </p>
          <p>
            If you are a consumer within the European Union, you also have the right to bring proceedings 
            in the courts of your country of residence.
          </p>
        </section>

        <section>
          <h2>15. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision will 
            be limited or eliminated to the minimum extent necessary, and the remaining provisions will 
            remain in full force and effect.
          </p>
        </section>

        <section>
          <h2>16. Contact</h2>
          <p>
            For questions about these Terms, please contact us at:<br />
            Email: <a href="mailto:info@jetopti.com">info@jetopti.com</a>
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

export default Terms;
