// src/pages/Terms.jsx
import React from 'react';
import '../styles/Legal.css';

function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        
        <section>
          <h2>1. Scope of Application</h2>
          <p>
            These Terms of Service ("Terms") govern the use of the JetOpti platform ("Platform"), 
            operated by JetOpti ("we", "us", "our"). By using the Platform, you agree to these Terms.
          </p>
          <p>
            <strong>Current Status:</strong> JetOpti is currently in Beta/MVP phase. The Platform 
            operates as a lead generation service, connecting customers with charter companies.
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
            Charter companies must undergo verification before their listings become active.
          </p>
        </section>

        <section>
          <h2>4. Booking Process & Contract Formation</h2>
          <p>
            <strong>Important:</strong> JetOpti is a marketplace platform. We do not provide aviation 
            services directly. The contract for charter flights is formed directly between the customer 
            and the charter company.
          </p>
          <h3>4.1 Booking Requests</h3>
          <p>
            When you submit a booking request through the Platform:
          </p>
          <ol>
            <li>Your request is forwarded to suitable charter companies</li>
            <li>Charter companies review and respond with offers</li>
            <li>You negotiate and finalize terms directly with the charter company</li>
            <li>The contract is formed between you and the charter company</li>
          </ol>

          <h3>4.2 Our Role</h3>
          <p>
            JetOpti acts solely as an intermediary. We are not party to the charter contract and are 
            not responsible for the execution of charter services.
          </p>
        </section>

        <section>
          <h2>5. Pricing & Payments</h2>
          <h3>5.1 Displayed Prices</h3>
          <p>
            Prices displayed on the Platform are indicative estimates based on:
          </p>
          <ul>
            <li>Distance and route</li>
            <li>Aircraft type and specifications</li>
            <li>Charter company pricing</li>
            <li>Seasonal and demand factors</li>
          </ul>
          <p>
            Final prices are determined by the charter company and may vary. Always confirm the final 
            price before booking.
          </p>

          <h3>5.2 Payment Processing</h3>
          <p>
            During Beta phase: Payments are processed directly between customer and charter company. 
            JetOpti does not handle payments.
          </p>
        </section>

        <section>
          <h2>6. Cancellation & Refunds</h2>
          <p>
            Cancellation policies are set by the individual charter company. Please review the specific 
            terms provided by the charter company before booking.
          </p>
          <p>
            JetOpti is not responsible for cancellation disputes or refunds. These matters must be 
            resolved directly with the charter company.
          </p>
        </section>

        <section>
          <h2>7. Liability & Disclaimer</h2>
          <h3>7.1 Platform Availability</h3>
          <p>
            We strive for continuous availability but cannot guarantee uninterrupted access. The Platform 
            is provided "as is" during Beta phase.
          </p>

          <h3>7.2 Aviation Services</h3>
          <p>
            JetOpti is not responsible for:
          </p>
          <ul>
            <li>Flight safety or aircraft maintenance</li>
            <li>Pilot qualifications or crew performance</li>
            <li>Flight delays, cancellations, or route changes</li>
            <li>Loss or damage to luggage or personal property</li>
            <li>Any incidents during the charter flight</li>
          </ul>
          <p>
            Charter companies are solely responsible for all aviation services and compliance with 
            applicable aviation regulations.
          </p>

          <h3>7.3 Accuracy of Information</h3>
          <p>
            While we strive for accuracy, we cannot guarantee that all information (aircraft specs, 
            availability, prices) is always current and complete.
          </p>
        </section>

        <section>
          <h2>8. User Conduct</h2>
          <p>
            Users agree not to:
          </p>
          <ul>
            <li>Provide false or misleading information</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Interfere with the Platform's operation</li>
            <li>Attempt unauthorized access to systems or data</li>
            <li>Use the Platform for fraudulent purposes</li>
            <li>Harass or harm other users or charter companies</li>
          </ul>
          <p>
            Violations may result in account suspension or termination.
          </p>
        </section>

        <section>
          <h2>9. Intellectual Property</h2>
          <p>
            All content, trademarks, and data on the Platform are owned by JetOpti or licensed to us. 
            Users may not copy, modify, distribute, or commercially use any Platform content without 
            our written permission.
          </p>
        </section>

        <section>
          <h2>10. Data Protection</h2>
          <p>
            Your use of the Platform is also governed by our Privacy Policy. By using the Platform, 
            you agree to our data processing practices as described in the Privacy Policy.
          </p>
        </section>

        <section>
          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Significant changes will be 
            communicated via email or Platform notification. Continued use after changes constitutes 
            acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2>12. Termination</h2>
          <p>
            Users may terminate their account at any time by contacting us. We reserve the right to 
            suspend or terminate accounts for violations of these Terms.
          </p>
        </section>

        <section>
          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by German law. Place of jurisdiction is [City], Germany.
          </p>
        </section>

        <section>
          <h2>14. Contact</h2>
          <p>
            For questions about these Terms, please contact us at:<br />
            Email: <a href="mailto:legal@jetopti.com">legal@jetopti.com</a>
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
