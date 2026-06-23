'use client';

import type { ReactNode } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';

const COHORT_DATA = [
  { age: '≤17', top10Prob: 42, eliteYears: 9.2, n: 38 },
  { age: '18', top10Prob: 38, eliteYears: 8.1, n: 64 },
  { age: '19', top10Prob: 31, eliteYears: 6.8, n: 89 },
  { age: '20', top10Prob: 24, eliteYears: 5.4, n: 112 },
  { age: '21', top10Prob: 18, eliteYears: 4.1, n: 98 },
  { age: '22+', top10Prob: 9, eliteYears: 2.6, n: 156 },
];

const PEAK_AGE_DATA = [
  { milestone: 'Top 100', median: 20.1, p25: 18.4, p75: 21.8 },
  { milestone: 'Top 10', median: 22.4, p25: 20.6, p75: 24.1 },
  { milestone: 'World #1', median: 24.8, p25: 22.9, p75: 26.5 },
  { milestone: 'Grand Slam', median: 23.6, p25: 21.2, p75: 25.9 },
];

const PEAK_DISTRIBUTION = [
  { age: 18, top100: 8, top10: 1, slam: 0 },
  { age: 19, top100: 14, top10: 3, slam: 1 },
  { age: 20, top100: 22, top10: 8, slam: 2 },
  { age: 21, top100: 18, top10: 12, slam: 4 },
  { age: 22, top100: 15, top10: 18, slam: 8 },
  { age: 23, top100: 12, top10: 22, slam: 14 },
  { age: 24, top100: 9, top10: 20, slam: 18 },
  { age: 25, top100: 6, top10: 14, slam: 16 },
  { age: 26, top100: 4, top10: 8, slam: 12 },
  { age: '27+', top100: 2, top10: 4, slam: 9 },
];

const SERVE_BUCKETS = [
  { bucket: '<55%', firstServe: 52, winRate: 48.2, matches: 1240 },
  { bucket: '55–60%', firstServe: 57, winRate: 52.8, matches: 3180 },
  { bucket: '60–65%', firstServe: 62, winRate: 58.4, matches: 5420 },
  { bucket: '65%+', firstServe: 68, winRate: 60.1, matches: 2890 },
];

const SERVE_CURVE = [
  { pct: 48, winRate: 46.5 },
  { pct: 52, winRate: 49.1 },
  { pct: 55, winRate: 51.8 },
  { pct: 58, winRate: 55.2 },
  { pct: 60, winRate: 57.1 },
  { pct: 62, winRate: 58.3 },
  { pct: 64, winRate: 59.2 },
  { pct: 66, winRate: 59.8 },
  { pct: 68, winRate: 60.2 },
  { pct: 72, winRate: 60.4 },
];

const COHORT_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

function StatusPill({ status }: { status: 'draft' | 'testing' | 'supported' }) {
  const labels = { draft: 'Draft', testing: 'In review', supported: 'Supported' };
  return <span className={`hyp-status hyp-status-${status}`}>{labels[status]}</span>;
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="hyp-kpi">
      <p className="hyp-kpi-label">{label}</p>
      <p className="hyp-kpi-value">{value}</p>
      {sub && <p className="hyp-kpi-sub">{sub}</p>}
    </div>
  );
}

function HypothesisHeader({
  rank,
  title,
  status,
  children,
}: {
  rank: string;
  title: string;
  status: 'draft' | 'testing' | 'supported';
  children: ReactNode;
}) {
  return (
    <div className="hyp-header">
      <div className="hyp-header-top">
        <span className="hyp-rank">{rank}</span>
        <h2 className="hyp-title">{title}</h2>
        <StatusPill status={status} />
      </div>
      <p className="hyp-statement">{children}</p>
    </div>
  );
}

export default function HypothesisStubs() {
  return (
    <div className="hyp-stubs">
      <p className="overview-stub-badge">Preview · sample data · exploratory analysis</p>

      {/* ── H1: Early success ── */}
      <section className="hyp-block overview-card">
        <HypothesisHeader rank="🥇" title="Early success → career trajectory" status="testing">
          The earlier a player enters the Top-100, the higher the probability of reaching the Top-10
          and the longer they tend to stay in the elite tier.
        </HypothesisHeader>

        <div className="hyp-kpi-row">
          <Kpi label="Median age at Top-100 (Top-10 achievers)" value="18.4 yrs" sub="vs 20.9 yrs for non–Top-10" />
          <Kpi label="P(Top-10 | Top-100 by 19)" value="34%" sub="2.4× vs late bloomers" />
          <Kpi label="Avg years in Top-100" value="7.8 yrs" sub="early cohort (≤19)" />
          <Kpi label="Sample size" value="557 players" sub="ATP 2000–2025" />
        </div>

        <div className="hyp-charts-grid">
          <div className="hyp-chart-card">
            <p className="hyp-chart-title">Top-10 probability by age at first Top-100 entry</p>
            <p className="hyp-chart-sub">Cohort analysis · Kaplan-Meier style preview</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={COHORT_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 50]} />
                <Tooltip />
                <Bar dataKey="top10Prob" name="top10Prob" radius={[4, 4, 0, 0]}>
                  {COHORT_DATA.map((_, i) => (
                    <Cell key={i} fill={COHORT_COLORS[i] ?? '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="hyp-chart-card">
            <p className="hyp-chart-title">Years spent in Top-100 by entry-age cohort</p>
            <p className="hyp-chart-sub">Elite tenure · expected survival curve</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={COHORT_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" yrs" domain={[0, 12]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="eliteYears"
                  stroke="#059669"
                  fill="rgba(5, 150, 105, 0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hyp-method">
          <strong>Planned method:</strong> join <code>atp_rankings</code> first Top-100 date per player →
          cohort by age → logistic regression for P(Top-10) and survival analysis for elite tenure.
        </div>
      </section>

      {/* ── H2: Peak career age ── */}
      <section className="hyp-block overview-card">
        <HypothesisHeader rank="🥈" title="Peak career age & milestone timing" status="draft">
          Career milestones cluster at predictable ages — when do players typically break into the Top-100,
          Top-10, reach world #1, and win their first Grand Slam?
        </HypothesisHeader>

        <div className="hyp-kpi-row">
          <Kpi label="Youngest Slam champion (2000+)" value="19.0 yrs" sub="Rafael Nadal · RG 2005" />
          <Kpi label="Median age at first Slam" value="23.6 yrs" sub="IQR 21.2 – 25.9" />
          <Kpi label="Peak window (Top-10)" value="22 – 25" sub="highest density" />
          <Kpi label="Late peak rate (#1 after 28)" value="11%" sub="Djokovic-type outliers" />
        </div>

        <div className="hyp-charts-grid">
          <div className="hyp-chart-card">
            <p className="hyp-chart-title">Median age at career milestones</p>
            <p className="hyp-chart-sub">Vertical bars · interquartile range shaded in tooltip</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={PEAK_AGE_DATA}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[17, 28]} tick={{ fontSize: 11 }} unit=" yrs" />
                <YAxis type="category" dataKey="milestone" width={72} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="median" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="hyp-chart-card">
            <p className="hyp-chart-title">Age distribution at milestone (density preview)</p>
            <p className="hyp-chart-sub">Stacked frequency by age · Top-100 vs Top-10 vs Slam</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={PEAK_DISTRIBUTION} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="top100" name="Top 100" stackId="a" fill="#94a3b8" />
                <Bar dataKey="top10" name="Top 10" stackId="a" fill="#3b82f6" />
                <Bar dataKey="slam" name="Slam win" stackId="a" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hyp-method">
          <strong>Planned method:</strong> first occurrence dates from rankings + Slam finals →
          kernel density by age; compare generations (2000s / 2010s / 2020s).
        </div>
      </section>

      {/* ── H3: Serve saturation ── */}
      <section className="hyp-block overview-card">
        <HypothesisHeader rank="🥉" title="First serve → match win (saturation threshold)" status="draft">
          First-serve percentage improves match win rate only up to a point — beyond ~62% the marginal
          gain flattens (non-linear / threshold effect).
        </HypothesisHeader>

        <div className="hyp-kpi-row">
          <Kpi label="Estimated saturation point" value="~62%" sub="marginal Δ win rate &lt; 0.5pp" />
          <Kpi label="Win rate lift (55% → 65%)" value="+7.3 pp" sub="diminishing above 65%" />
          <Kpi label="Matches with serve stats" value="12.7k" sub="2015–2025 sample" />
          <Kpi label="R² (quadratic fit preview)" value="0.71" sub="vs 0.64 linear" />
        </div>

        <div className="hyp-charts-grid">
          <div className="hyp-chart-card">
            <p className="hyp-chart-title">Match win rate by 1st-serve % bucket</p>
            <p className="hyp-chart-sub">Aggregated player-match rows · n per bucket in tooltip</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SERVE_BUCKETS} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[40, 70]} />
                <Tooltip />
                <Bar dataKey="winRate" name="winRate" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="hyp-chart-card">
            <p className="hyp-chart-title">Win rate vs 1st-serve % (saturation curve)</p>
            <p className="hyp-chart-sub">Loess-smoothed preview · threshold ~62%</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={SERVE_CURVE} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="pct"
                  tick={{ fontSize: 11 }}
                  label={{ value: '1st serve %', position: 'insideBottom', offset: -2, fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[44, 64]} />
                <Tooltip />
                <ReferenceLine x={62} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Saturation ~62%', fontSize: 10, position: 'top' }} />
                <Line
                  type="monotone"
                  dataKey="winRate"
                  stroke="#ea580c"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#ea580c' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hyp-method">
          <strong>Planned method:</strong> bucket <code>player_1stIn / player_svpt</code> from match stats →
          compare win rate per bucket; test piecewise linear vs quadratic fit for threshold.
        </div>
      </section>
    </div>
  );
}
