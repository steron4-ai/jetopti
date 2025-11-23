import React from 'react';
import './Legal.css';

function Datenschutz() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Datenschutzerklärung</h1>
        
        <section>
          <h2>1. Datenschutz auf einen Blick</h2>
          <h3>Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
            personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene 
            Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
          </p>
        </section>

        <section>
          <h2>2. Verantwortliche Stelle</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br /><br />
            <strong>[Dein Firmenname]</strong><br />
            [Straße und Hausnummer]<br />
            [PLZ und Ort]<br />
            Deutschland<br /><br />
            Telefon: [+49 XXX XXXXXXX]<br />
            E-Mail: <a href="mailto:datenschutz@jetopti.de">datenschutz@jetopti.de</a>
          </p>
        </section>

        <section>
          <h2>3. Datenerfassung auf dieser Website</h2>
          
          <h3>Kontaktformular & Buchungsanfragen</h3>
          <p>
            Wenn Sie uns per Kontaktformular oder E-Mail Anfragen zukommen lassen, werden Ihre 
            Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten 
            zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
          </p>
          <p>
            <strong>Verarbeitete Daten bei Buchungsanfragen:</strong>
          </p>
          <ul>
            <li>Name und Vorname</li>
            <li>E-Mail-Adresse</li>
            <li>Abflugort und Zielort</li>
            <li>Reisedatum(en)</li>
            <li>Anzahl der Passagiere</li>
            <li>Weitere optionale Angaben</li>
          </ul>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung)<br />
            <strong>Speicherdauer:</strong> Bis zur vollständigen Bearbeitung Ihrer Anfrage, 
            danach gemäß gesetzlicher Aufbewahrungsfristen.
          </p>

          <h3>Server-Log-Dateien</h3>
          <p>
            Der Provider der Seiten erhebt und speichert automatisch Informationen in 
            Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt:
          </p>
          <ul>
            <li>Browsertyp und Browserversion</li>
            <li>Verwendetes Betriebssystem</li>
            <li>Referrer URL</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
            <li>IP-Adresse</li>
          </ul>
          <p>
            Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
          </p>
        </section>

        <section>
          <h2>4. Externe Dienste</h2>
          
          <h3>Mapbox (Kartendienst)</h3>
          <p>
            Wir nutzen den Kartendienst Mapbox zur Darstellung interaktiver Karten. Anbieter ist 
            Mapbox Inc., 740 15th Street NW, 5th Floor, Washington, DC 20005, USA.
          </p>
          <p>
            Bei Nutzung der Kartenfunktion werden Daten an Mapbox übertragen, insbesondere Ihre 
            IP-Adresse und Standortdaten. Mehr Informationen finden Sie in der Datenschutzerklärung 
            von Mapbox: 
            <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer">
              https://www.mapbox.com/legal/privacy
            </a>
          </p>

          <h3>EmailJS (E-Mail-Versand)</h3>
          <p>
            Zur Verarbeitung Ihrer Buchungsanfragen nutzen wir EmailJS. Dabei werden Ihre Angaben 
            (Name, E-Mail, Reisedaten) über diesen Dienst versendet.
          </p>
          <p>
            Anbieter: EmailJS (https://www.emailjs.com/)<br />
            Datenschutz: 
            <a href="https://www.emailjs.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">
              https://www.emailjs.com/legal/privacy-policy/
            </a>
          </p>
        </section>

        <section>
          <h2>5. Ihre Rechte</h2>
          <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
          <ul>
            <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen.</li>
            <li><strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger Daten verlangen.</li>
            <li><strong>Löschungsrecht (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen.</li>
            <li><strong>Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können die Einschränkung der Verarbeitung verlangen.</li>
            <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung widersprechen.</li>
            <li><strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem strukturierten Format erhalten.</li>
            <li><strong>Beschwerderecht:</strong> Sie können sich bei einer Datenschutzaufsichtsbehörde beschweren.</li>
          </ul>
          <p>
            Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte unter: 
            <a href="mailto:datenschutz@jetopti.de">datenschutz@jetopti.de</a>
          </p>
        </section>

        <section>
          <h2>6. Datensicherheit</h2>
          <p>
            Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket Layer) 
            in Verbindung mit der jeweils höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt wird.
          </p>
        </section>

        <section>
          <h2>7. Änderungen dieser Datenschutzerklärung</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen 
            rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen umzusetzen.
          </p>
          <p>
            <strong>Stand:</strong> Oktober 2024
          </p>
        </section>

        <div className="back-link">
          <a href="/">← Zurück zur Startseite</a>
        </div>
      </div>
    </div>
  );
}

export default Datenschutz;