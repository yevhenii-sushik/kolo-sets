import '/about.css';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="container">
      <Link to="/" className="back-link">← Tilbake til applikasjonen</Link><br /><br />

      <div className="header">
        <h1>🇳🇴 Kolo Sets</h1>
        <p>Lær norsk med flashcards basert på Spaced Repetition System</p>
      </div>
              
        <div className="about-section">
            <h2>Om applikasjonen</h2>
            <p><strong>Kolo — Norsk Læring</strong> er et minimalistisk flashcard-verktøy designet for å hjelpe deg med å lære norsk vokabular effektivt.</p>
            <p>Applikasjonen bruker et enkelt, men kraftig system for å organisere ord i samlinger og teste kunnskapen din gjennom interaktive flashcards.</p>
            <p><strong>Utviklet av:</strong> Euphoria Software</p>
            <p><strong>Status:</strong> Beta-testing fase</p>
        </div>

        <h2 style={{ marginBottom: '30px', fontSize: '2em' }}>Versjonsoversikt</h2>
        <h2 style={{ marginBottom: '30px', fontSize: '1.6em' }}>V.0.1 — forproduksjon</h2>
            
        <div className="timeline">
            
            <div className="version-block beta">
                <div className="version-header">
                    <span className="version-number">0.1.0-alpha</span>
                    <span className="version-badge badge-beta">beta-test</span>
                </div>
                <div className="version-date">Januar 2026 — Nåværende versjon</div>
                <div className="changes">
                    <ul>
                        <li>Beta-testing fase startet med utvalgte brukere</li>
                        <li>Stabilitetsforbedringer og feilrettinger</li>
                        <li>Forbedret brukergrensesnitt for bedre lesbarhet</li>
                        <li>Optimalisert ytelse for flashcard-animasjoner</li>
                        <li>Lagt til støtte for flerbrukertest</li>
                    </ul>
                </div>
            </div>

            <div className="version-block alpha">
                <div className="version-header">
                    <span className="version-number">0.1.0-alpha</span>
                    <span className="version-badge badge-alpha">alpha</span>
                </div>
                <div className="version-date">Januar 2026</div>
                <div className="changes">
                    <ul>
                        <li>Første offentlige alpha-versjon</li>
                        <li>Grunnleggende samlingssystem implementert</li>
                        <li>Flashcard-funksjonalitet med flip-animasjon</li>
                        <li>Import av ord i Quizlet-format</li>
                        <li>Enkel spored repetisjonssystem (husker/glemte)</li>
                        <li>Minimalistisk brukergrensesnitt</li>
                    </ul>
                </div>
            </div>

            <div className="version-block alpha">
                <div className="version-header">
                    <span className="version-number">0.1</span>
                    <span className="version-badge badge-alpha">pre-alpha</span>
                </div>
                <div className="version-date">Januar 2026</div>
                <div className="changes">
                    <ul>
                        <li>Prosjekt initialisert</li>
                        <li>Grunnleggende arkitektur etablert</li>
                        <li>Første prototype av brukergrensesnitt</li>
                        <li>Lokal lagring implementert (localStorage)</li>
                    </ul>
                </div>
                
                <div className="branch">
                    <div className="branch-label">↳ Planlagt for fremtidige versjoner:</div>
                    <ul style={{ listStyle: 'none', padding: '0' }}>
                        <li style={{ padding: '4px 0', color: 'var(--text-muted)', fontSize: '0.95em' }}>• Spaced Repetition Algorithm (SRS)</li>
                        <li style={{ padding: '4px 0', color: 'var(--text-muted)', fontSize: '0.95em' }}>• Statistikk og fremgangsrapporter</li>
                        <li style={{ padding: '4px 0', color: 'var(--text-muted)', fontSize: '0.95em' }}>• Lyduttalelser for norske ord</li>
                        <li style={{ padding: '4px 0', color: 'var(--text-muted)', fontSize: '0.95em' }}>• Mørk modus</li>
                        <li style={{ padding: '4px 0', color: 'var(--text-muted)', fontSize: '0.95em' }}>• Eksport og backup-funksjonalitet</li>
                        <li style={{ padding: '4px 0', color: 'var(--text-muted)', fontSize: '0.95em' }}>• Flere importformater</li>
                    </ul>
                </div>
            </div>

        </div>

        <a href="/" className="back-link">← Tilbake til applikasjonen</a>
    </div>
  );
}