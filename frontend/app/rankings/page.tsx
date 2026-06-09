'use client';

export default function RankingsPage() {
  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-tag">📈 Rankings</div>
        <h1 className="hero-title">
          ATP & WTA <span>Rankings</span>
        </h1>
        <p className="hero-subtitle">
          View official current single and double standings, historical rankings, and rank progressions.
        </p>

        <div className="empty-state" style={{ marginTop: '40px' }}>
          <span className="empty-icon" style={{ fontSize: '48px' }}>📈</span>
          <p className="empty-title">Rankings Database Coming Soon</p>
          <p className="empty-sub">Weekly standings updates and charts are being integrated.</p>
        </div>
      </section>
    </div>
  );
}
