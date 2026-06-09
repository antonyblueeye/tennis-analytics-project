'use client';

export default function MatchesPage() {
  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-tag">🎾 Matches</div>
        <h1 className="hero-title">
          Matches <span>History</span>
        </h1>
        <p className="hero-subtitle">
          Explore complete match outcomes, serve/receive statistics, and performance analysis.
        </p>

        <div className="empty-state" style={{ marginTop: '40px' }}>
          <span className="empty-icon" style={{ fontSize: '48px' }}>🎾</span>
          <p className="empty-title">Matches Analytics Coming Soon</p>
          <p className="empty-sub">We are currently importing historic match logs. Stay tuned!</p>
        </div>
      </section>
    </div>
  );
}
