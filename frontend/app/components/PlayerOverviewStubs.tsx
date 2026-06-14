'use client';

/** UI-заглушки для Overview. Данные моковые — расчёты подключишь позже. */

const MOCK_WIN_RATE = { pct: 73.4, wins: 892, losses: 322, total: 1214 };

const MOCK_LAST_MATCHES = [
  { date: '28 May 2026', tournament: 'Roland Garros', round: 'SF', opponent: 'Carlos Alcaraz', result: 'W' as const, score: '6-4 7-6', surface: 'Clay' },
  { date: '26 May 2026', tournament: 'Roland Garros', round: 'QF', opponent: 'Alexander Zverev', result: 'W' as const, score: '6-3 6-2', surface: 'Clay' },
  { date: '24 May 2026', tournament: 'Roland Garros', round: 'R16', opponent: 'Holger Rune', result: 'W' as const, score: '4-6 6-1 6-4 6-2', surface: 'Clay' },
  { date: '10 May 2026', tournament: 'Rome Masters', round: 'F', opponent: 'Stefanos Tsitsipas', result: 'L' as const, score: '6-7 4-6', surface: 'Clay' },
  { date: '08 May 2026', tournament: 'Rome Masters', round: 'SF', opponent: 'Jannik Sinner', result: 'W' as const, score: '7-6 6-4', surface: 'Clay' },
];

const MOCK_SURFACES = [
  { key: 'hard', label: 'Hard', wins: 312, matches: 410, pct: 76.1, color: '#3b82f6' },
  { key: 'clay', label: 'Clay', wins: 285, matches: 327, pct: 87.2, color: '#ea580c' },
  { key: 'grass', label: 'Grass', wins: 98, matches: 142, pct: 69.0, color: '#22c55e' },
  { key: 'carpet', label: 'Carpet', wins: 12, matches: 18, pct: 66.7, color: '#8b5cf6' },
];

const MOCK_ACES = { avg: 5.8, total: 6842, bySurface: [
  { label: 'Hard', avg: 6.2 }, { label: 'Clay', avg: 4.9 }, { label: 'Grass', avg: 7.1 },
]};

const MOCK_DF = { avg: 2.1, total: 2476, bySurface: [
  { label: 'Hard', avg: 2.0 }, { label: 'Clay', avg: 2.4 }, { label: 'Grass', avg: 1.8 },
]};

const MOCK_DURATION = { avg: '2h 14m', longest: '5h 53m', shortest: '0h 48m' };

const MOCK_VS_AGE = [
  { bucket: 'Under 21', wins: 48, losses: 12, pct: 80.0 },
  { bucket: '21 – 25', wins: 186, losses: 54, pct: 77.5 },
  { bucket: '26 – 30', wins: 312, losses: 98, pct: 76.1 },
  { bucket: '31 – 35', wins: 218, losses: 92, pct: 70.3 },
  { bucket: '36+', wins: 128, losses: 66, pct: 66.0 },
];

const MOCK_VS_HEIGHT = [
  { bucket: 'Under 180 cm', wins: 42, losses: 18, pct: 70.0 },
  { bucket: '180 – 190 cm', wins: 398, losses: 142, pct: 73.7 },
  { bucket: '191 – 200 cm', wins: 312, losses: 108, pct: 74.3 },
  { bucket: '200 cm+', wins: 140, losses: 54, pct: 72.2 },
];

const MOCK_EXTRAS = [
  { icon: '🔥', label: 'Best win streak', value: '41 matches' },
  { icon: '🎯', label: 'Tiebreak win rate', value: '68.2%' },
  { icon: '⏱️', label: 'Deciding set record', value: '24 – 11' },
  { icon: '🌙', label: 'Night session W%', value: '71.4%' },
  { icon: '🏆', label: 'Vs top-10 record', value: '156 – 89' },
  { icon: '💪', label: 'Comebacks from 0–2 sets', value: '12' },
];

function OpponentTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: { bucket: string; wins: number; losses: number; pct: number }[];
}) {
  return (
    <div className="overview-card">
      <div className="overview-card-head">
        <h4 className="overview-card-title">{title}</h4>
        <p className="overview-card-sub">{subtitle}</p>
      </div>
      <div className="overview-opp-table">
        <div className="overview-opp-header">
          <span>Category</span>
          <span>W – L</span>
          <span>Win %</span>
        </div>
        {rows.map((row) => (
          <div key={row.bucket} className="overview-opp-row">
            <span className="overview-opp-bucket">{row.bucket}</span>
            <span className="overview-opp-wl">{row.wins} – {row.losses}</span>
            <span className="overview-opp-pct">
              <span className="overview-opp-bar-wrap">
                <span className="overview-opp-bar" style={{ width: `${row.pct}%` }} />
              </span>
              {row.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServeStatCard({
  title,
  icon,
  avg,
  total,
  bySurface,
  accentClass,
}: {
  title: string;
  icon: string;
  avg: number;
  total: number;
  bySurface: { label: string; avg: number }[];
  accentClass: string;
}) {
  const maxAvg = Math.max(...bySurface.map((s) => s.avg), 1);
  return (
    <div className="overview-card">
      <div className="overview-card-head overview-card-head-inline">
        <span className="overview-stat-icon">{icon}</span>
        <div>
          <h4 className="overview-card-title">{title}</h4>
          <p className="overview-card-sub">Per match average & total career</p>
        </div>
      </div>
      <div className="overview-serve-hero">
        <div>
          <span className={`overview-serve-big ${accentClass}`}>{avg}</span>
          <span className="overview-serve-unit">avg / match</span>
        </div>
        <div className="overview-serve-total">
          <span className="overview-serve-total-val">{total.toLocaleString()}</span>
          <span className="overview-serve-total-lbl">total</span>
        </div>
      </div>
      <div className="overview-mini-bars">
        {bySurface.map((s) => (
          <div key={s.label} className="overview-mini-bar-row">
            <span className="overview-mini-bar-label">{s.label}</span>
            <div className="overview-mini-bar-track">
              <div
                className={`overview-mini-bar-fill ${accentClass}`}
                style={{ width: `${(s.avg / maxAvg) * 100}%` }}
              />
            </div>
            <span className="overview-mini-bar-val">{s.avg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlayerOverviewStubs() {
  return (
    <div className="overview-stubs">
      <p className="overview-stub-badge">Preview · sample data</p>

      {/* Last matches */}
      <section className="overview-section">
        <h3 className="overview-section-title">Last matches</h3>
        <div className="overview-last-matches">
          {MOCK_LAST_MATCHES.map((m, i) => (
            <div key={i} className={`overview-match-card overview-match-${m.result.toLowerCase()}`}>
              <div className="overview-match-top">
                <span className={`overview-match-result overview-match-result-${m.result.toLowerCase()}`}>
                  {m.result}
                </span>
                <span className="overview-match-surface">{m.surface}</span>
              </div>
              <p className="overview-match-tourney">{m.tournament}</p>
              <p className="overview-match-round">{m.round}</p>
              <p className="overview-match-opponent">vs {m.opponent}</p>
              <p className="overview-match-score">{m.score}</p>
              <p className="overview-match-date">{m.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Win rate + surfaces */}
      <section className="overview-section">
        <div className="overview-hero-grid">
          <div className="overview-card overview-win-card">
            <p className="overview-card-label">Career win rate</p>
            <div className="overview-win-hero">
              <span className="overview-win-pct">{MOCK_WIN_RATE.pct}%</span>
              <div className="overview-win-ring">
                <svg viewBox="0 0 36 36">
                  <path
                    className="overview-ring-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="overview-ring-fill"
                    strokeDasharray={`${MOCK_WIN_RATE.pct}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
            <div className="overview-win-meta">
              <span><strong>{MOCK_WIN_RATE.wins}</strong> wins</span>
              <span><strong>{MOCK_WIN_RATE.losses}</strong> losses</span>
              <span><strong>{MOCK_WIN_RATE.total}</strong> matches</span>
            </div>
          </div>

          <div className="overview-card overview-surface-card">
            <div className="overview-card-head">
              <h4 className="overview-card-title">By surface</h4>
              <p className="overview-card-sub">Win rate & match count</p>
            </div>
            <div className="overview-surface-list">
              {MOCK_SURFACES.map((s) => (
                <div key={s.key} className="overview-surface-row">
                  <div className="overview-surface-info">
                    <span className="overview-surface-dot" style={{ background: s.color }} />
                    <span className="overview-surface-name">{s.label}</span>
                    <span className="overview-surface-matches">{s.matches} matches</span>
                  </div>
                  <div className="overview-surface-bar-wrap">
                    <div
                      className="overview-surface-bar"
                      style={{ width: `${s.pct}%`, background: s.color }}
                    />
                  </div>
                  <span className="overview-surface-pct">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overview-card overview-duration-card">
            <span className="overview-stat-icon">⏱️</span>
            <p className="overview-card-label">Avg. match duration</p>
            <p className="overview-duration-main">{MOCK_DURATION.avg}</p>
            <div className="overview-duration-extra">
              <div>
                <span className="overview-duration-sub-lbl">Longest</span>
                <span className="overview-duration-sub-val">{MOCK_DURATION.longest}</span>
              </div>
              <div>
                <span className="overview-duration-sub-lbl">Shortest</span>
                <span className="overview-duration-sub-val">{MOCK_DURATION.shortest}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aces & DF */}
      <section className="overview-section">
        <div className="overview-two-col">
          <ServeStatCard
            title="Aces"
            icon="🎾"
            avg={MOCK_ACES.avg}
            total={MOCK_ACES.total}
            bySurface={MOCK_ACES.bySurface}
            accentClass="overview-accent-green"
          />
          <ServeStatCard
            title="Double faults"
            icon="⚠️"
            avg={MOCK_DF.avg}
            total={MOCK_DF.total}
            bySurface={MOCK_DF.bySurface}
            accentClass="overview-accent-orange"
          />
        </div>
      </section>

      {/* vs age & height */}
      <section className="overview-section">
        <div className="overview-two-col">
          <OpponentTable
            title="vs opponent age"
            subtitle="Win rate by age bracket at match date"
            rows={MOCK_VS_AGE}
          />
          <OpponentTable
            title="vs opponent height"
            subtitle="Win rate by opponent height category"
            rows={MOCK_VS_HEIGHT}
          />
        </div>
      </section>

      {/* Extras */}
      <section className="overview-section">
        <h3 className="overview-section-title">Career highlights</h3>
        <div className="overview-extras-grid">
          {MOCK_EXTRAS.map((e) => (
            <div key={e.label} className="overview-extra-card">
              <span className="overview-extra-icon">{e.icon}</span>
              <span className="overview-extra-value">{e.value}</span>
              <span className="overview-extra-label">{e.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
