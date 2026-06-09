'use client';

export default function HeadToHeadPage() {
  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-tag">⚔️ H2H</div>
        <h1 className="hero-title">
          Head-to-Head <span>Comparison</span>
        </h1>
        <p className="hero-subtitle">
          Compare stats, surface records, and direct match history between any two professional players.
        </p>

        <div className="empty-state" style={{ marginTop: '40px' }}>
          <span className="empty-icon" style={{ fontSize: '48px' }}>⚔️</span>
          <p className="empty-title">Head-to-Head Engine Coming Soon</p>
          <p className="empty-sub">We are developing a comprehensive matchup comparison simulator.</p>
        </div>
      </section>
    </div>
  );
}
