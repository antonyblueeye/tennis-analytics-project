'use client';

import { useEffect, useState } from 'react';

import { API_BASE } from '@/lib/api';

type LastMatch = {
  date: string;
  tournament: string;
  round: string;
  opponent: string;
  result: 'W' | 'L';
  score: string;
  surface: string;
};

type SurfaceRow = {
  key: string;
  label: string;
  wins: number;
  matches: number;
  pct: number;
  color: string;
};

type BucketRow = { bucket: string; wins: number; losses: number; pct: number };

type ServeBlock = { avg: number; total: number; bySurface: { label: string; avg: number }[] };

type OverviewData = {
  lastMatches: LastMatch[];
  winRate: { pct: number; wins: number; losses: number; total: number };
  surfaces: SurfaceRow[];
  duration: { avg: string; longest: string; shortest: string };
  aces: ServeBlock;
  doubleFaults: ServeBlock;
  vsAge: BucketRow[];
  vsHeight: BucketRow[];
  highlights: { icon: string; label: string; value: string }[];
};

function OpponentTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: BucketRow[];
}) {
  if (!rows.length) return null;
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
  if (!total && !avg) return null;
  const maxAvg = Math.max(...bySurface.map((s) => s.avg), avg, 1);
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
      {bySurface.length > 0 && (
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
      )}
    </div>
  );
}

interface Props {
  playerId: number;
}

export default function PlayerOverviewStubs({ playerId }: Props) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/players/${playerId}/overview`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<OverviewData>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  if (loading) {
    return (
      <div className="overview-stubs">
        <p className="overview-stub-badge">Loading overview…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="overview-stubs">
        <p className="overview-stub-badge" style={{ color: 'var(--danger, #ef4444)' }}>
          {error ? `Failed to load: ${error}` : 'No data'}
        </p>
      </div>
    );
  }

  const { lastMatches, winRate, surfaces, duration, aces, doubleFaults, vsAge, vsHeight, highlights } =
    data;

  return (
    <div className="overview-stubs">
      {lastMatches.length > 0 && (
        <section className="overview-section">
          <h3 className="overview-section-title">Last matches</h3>
          <div className="overview-last-matches">
            {lastMatches.map((m, i) => (
              <div
                key={`${m.date}-${m.tournament}-${i}`}
                className={`overview-match-card overview-match-${m.result.toLowerCase()}`}
              >
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
      )}

      <section className="overview-section">
        <div className="overview-hero-grid">
          <div className="overview-card overview-win-card">
            <p className="overview-card-label">Career win rate</p>
            <div className="overview-win-hero">
              <span className="overview-win-pct">{winRate.pct}%</span>
              <div className="overview-win-ring">
                <svg viewBox="0 0 36 36">
                  <path
                    className="overview-ring-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="overview-ring-fill"
                    strokeDasharray={`${winRate.pct}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
            <div className="overview-win-meta">
              <span><strong>{winRate.wins}</strong> wins</span>
              <span><strong>{winRate.losses}</strong> losses</span>
              <span><strong>{winRate.total}</strong> matches</span>
            </div>
          </div>

          {surfaces.length > 0 && (
            <div className="overview-card overview-surface-card">
              <div className="overview-card-head">
                <h4 className="overview-card-title">By surface</h4>
                <p className="overview-card-sub">Win rate & match count</p>
              </div>
              <div className="overview-surface-list">
                {surfaces.map((s) => (
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
          )}

          <div className="overview-card overview-duration-card">
            <span className="overview-stat-icon">⏱️</span>
            <p className="overview-card-label">Avg. match duration</p>
            <p className="overview-duration-main">{duration.avg}</p>
            <div className="overview-duration-extra">
              <div>
                <span className="overview-duration-sub-lbl">Longest</span>
                <span className="overview-duration-sub-val">{duration.longest}</span>
              </div>
              <div>
                <span className="overview-duration-sub-lbl">Shortest</span>
                <span className="overview-duration-sub-val">{duration.shortest}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(aces.total > 0 || doubleFaults.total > 0) && (
        <section className="overview-section">
          <div className="overview-two-col">
            <ServeStatCard
              title="Aces"
              icon="🎾"
              avg={aces.avg}
              total={aces.total}
              bySurface={aces.bySurface}
              accentClass="overview-accent-green"
            />
            <ServeStatCard
              title="Double faults"
              icon="⚠️"
              avg={doubleFaults.avg}
              total={doubleFaults.total}
              bySurface={doubleFaults.bySurface}
              accentClass="overview-accent-orange"
            />
          </div>
        </section>
      )}

      {(vsAge.length > 0 || vsHeight.length > 0) && (
        <section className="overview-section">
          <div className="overview-two-col">
            <OpponentTable
              title="vs opponent age"
              subtitle="Win rate by age bracket at match date"
              rows={vsAge}
            />
            <OpponentTable
              title="vs opponent height"
              subtitle="Win rate by opponent height category"
              rows={vsHeight}
            />
          </div>
        </section>
      )}

      {highlights.length > 0 && (
        <section className="overview-section">
          <h3 className="overview-section-title">Career highlights</h3>
          <div className="overview-extras-grid">
            {highlights.map((e) => (
              <div key={e.label} className="overview-extra-card">
                <span className="overview-extra-icon">{e.icon}</span>
                <span className="overview-extra-value">{e.value}</span>
                <span className="overview-extra-label">{e.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
