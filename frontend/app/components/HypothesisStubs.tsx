'use client';

import { useEffect, useState, type ReactNode } from 'react';
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

const API = 'http://127.0.0.1:8000';

type CohortRow = { age: string; top10Prob: number; eliteYears: number; n: number };
type EarlySuccessData = {
  cohorts: CohortRow[];
  kpis: {
    medianAgeTop10: number;
    medianAgeNonTop10: number;
    pTop10By19: number;
    pTop10Late: number;
    top10Ratio: number | null;
    avgYearsEarly: number;
    sampleSize: number;
  };
  period: string;
  rankingsThrough?: number;
  sampleDefinition?: string;
};

type MilestoneRow = { milestone: string; median: number; p25: number; p75: number };
type DistributionRow = { age: number | string; top100: number; top10: number; slam: number };
type PeakAgeData = {
  milestones: MilestoneRow[];
  distribution: DistributionRow[];
  kpis: {
    youngestSlamAge: number;
    youngestSlamSub: string;
    medianFirstSlam: number;
    slamP25: number;
    slamP75: number;
    slamSampleSize: number;
    peakTop10Start: number;
    peakTop10End: number;
    lateNum1Rate: number;
    lateNum1Count: number;
    num1SampleSize: number;
  };
  period: string;
  sampleDefinition?: string;
};

type ServeBucketRow = { bucket: string; firstServe: number; winRate: number; matches: number };
type ServeCurveRow = { pct: number; winRate: number; matches: number };
type ServeSaturationData = {
  buckets: ServeBucketRow[];
  curve: ServeCurveRow[];
  kpis: {
    saturationPoint: number | null;
    winRateLift: number | null;
    matchCount: number;
    r2Linear: number | null;
    r2Quadratic: number | null;
  };
  period: string;
  sampleDefinition?: string;
};

const COHORT_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

function formatMatchCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

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

function EarlySuccessHypothesis() {
  const [data, setData] = useState<EarlySuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/hypotheses/early-success`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<EarlySuccessData>;
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
  }, []);

  const cohorts = data?.cohorts ?? [];
  const kpis = data?.kpis;
  const maxProb = Math.max(10, ...cohorts.map((c) => c.top10Prob));
  const maxYears = Math.max(5, ...cohorts.map((c) => c.eliteYears));

  return (
    <section className="hyp-block overview-card">
      <HypothesisHeader rank="🥇" title="Early success → career trajectory" status="supported">
        The earlier a player enters the Top-100, the higher the probability of reaching the Top-10
        and the longer they tend to stay in the elite tier.
      </HypothesisHeader>

      {loading && <p className="overview-stub-badge">Loading live data…</p>}
      {error && (
        <p className="overview-stub-badge" style={{ color: 'var(--danger, #ef4444)' }}>
          Failed to load: {error}
        </p>
      )}

      {kpis && (
        <>
          <div className="hyp-kpi-row">
            <Kpi
              label="Median age at Top-100 (Top-10 achievers)"
              value={`${kpis.medianAgeTop10} yrs`}
              sub={`vs ${kpis.medianAgeNonTop10} yrs for non–Top-10`}
            />
            <Kpi
              label="P(Top-10 | Top-100 before 20)"
              value={`${kpis.pTop10By19}%`}
              sub={
                kpis.top10Ratio != null
                  ? `${kpis.top10Ratio}× vs entry at 22+ (${kpis.pTop10Late}%)`
                  : undefined
              }
            />
            <Kpi
              label="Avg years in Top-100"
              value={`${kpis.avgYearsEarly} yrs`}
              sub="early cohort (before 20)"
            />
            <Kpi
              label="Sample size"
              value={`${kpis.sampleSize} players`}
              sub={
                data?.sampleDefinition
                  ? `${data.sampleDefinition} · through ${data.period}`
                  : `ATP ${data?.period ?? '2000–present'}`
              }
            />
          </div>

          <div className="hyp-charts-grid">
            <div className="hyp-chart-card">
              <p className="hyp-chart-title">Top-10 probability by age at first Top-100 entry</p>
              <p className="hyp-chart-sub">Share of cohort that ever reached Top-10 · n in tooltip</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={cohorts} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, Math.ceil(maxProb / 10) * 10]} />
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${value}%`,
                      `P(Top-10) · n=${(props.payload as CohortRow).n}`,
                    ]}
                  />
                  <Bar dataKey="top10Prob" name="P(Top-10)" radius={[4, 4, 0, 0]}>
                    {cohorts.map((_, i) => (
                      <Cell key={i} fill={COHORT_COLORS[i] ?? '#059669'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="hyp-chart-card">
              <p className="hyp-chart-title">Years spent in Top-100 by entry-age cohort</p>
              <p className="hyp-chart-sub">Ranking weeks in Top-100 ÷ 52</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={cohorts} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    unit=" yrs"
                    domain={[0, Math.ceil(maxYears / 2) * 2]}
                  />
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${value} yrs`,
                      `Avg tenure · n=${(props.payload as CohortRow).n}`,
                    ]}
                  />
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
            <strong>Method:</strong> from <code>atp_rankings</code> through the latest snapshot (
            {data?.rankingsThrough
              ? `${String(data.rankingsThrough).slice(0, 4)}-${String(data.rankingsThrough).slice(4, 6)}-${String(data.rankingsThrough).slice(6, 8)}`
              : 'latest'}
            ) — first-ever Top-100 week per player (full ranking history), debuts from 2000 only;
            joined with <code>atp_players.dob</code> for entry age; tenure = Top-100 weeks ÷ 52.
          </div>
        </>
      )}
    </section>
  );
}

function PeakAgeHypothesis() {
  const [data, setData] = useState<PeakAgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/hypotheses/peak-age`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<PeakAgeData>;
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
  }, []);

  const milestones = data?.milestones ?? [];
  const distribution = data?.distribution ?? [];
  const kpis = data?.kpis;
  const xMax = Math.max(28, ...milestones.map((m) => m.p75 ?? m.median ?? 0)) + 1;

  return (
    <section className="hyp-block overview-card">
      <HypothesisHeader rank="🥈" title="Peak career age & milestone timing" status="supported">
        Career milestones cluster at predictable ages — when do players typically break into the Top-100,
        Top-10, reach world #1, and win their first Grand Slam?
      </HypothesisHeader>

      {loading && <p className="overview-stub-badge">Loading live data…</p>}
      {error && (
        <p className="overview-stub-badge" style={{ color: 'var(--danger, #ef4444)' }}>
          Failed to load: {error}
        </p>
      )}

      {kpis && (
        <>
          <div className="hyp-kpi-row">
            <Kpi
              label="Youngest Slam champion (2000+)"
              value={`${kpis.youngestSlamAge} yrs`}
              sub={kpis.youngestSlamSub}
            />
            <Kpi
              label="Median age at first Slam"
              value={`${kpis.medianFirstSlam} yrs`}
              sub={`IQR ${kpis.slamP25} – ${kpis.slamP75} · n=${kpis.slamSampleSize}`}
            />
            <Kpi
              label="Peak window (Top-10)"
              value={`${kpis.peakTop10Start} – ${kpis.peakTop10End}`}
              sub="highest 4-year density"
            />
            <Kpi
              label="Late peak rate (#1 after 28)"
              value={`${kpis.lateNum1Rate}%`}
              sub={`${kpis.lateNum1Count} of ${kpis.num1SampleSize} #1 debuts since 2000`}
            />
          </div>

          <div className="hyp-charts-grid">
            <div className="hyp-chart-card">
              <p className="hyp-chart-title">Median age at career milestones</p>
              <p className="hyp-chart-sub">Vertical bars · interquartile range in tooltip</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={milestones}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[17, xMax]} tick={{ fontSize: 11 }} unit=" yrs" />
                  <YAxis type="category" dataKey="milestone" width={72} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, _name, props) => {
                      const row = props.payload as MilestoneRow;
                      return [`${value} yrs (IQR ${row.p25}–${row.p75})`, 'Median age'];
                    }}
                  />
                  <Bar dataKey="median" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="hyp-chart-card">
              <p className="hyp-chart-title">Age distribution at milestone</p>
              <p className="hyp-chart-sub">Frequency by integer age · Top-100 vs Top-10 vs Slam</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={distribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
            <strong>Method:</strong> Slam finals from <code>atp_player_matches</code> (
            <code>tourney_level='G'</code>, <code>round='F'</code>, <code>won_match='1'</code>,
            since 2000); ranking milestones from <code>atp_rankings</code> joined with{' '}
            <code>atp_players.dob</code>. {data?.sampleDefinition ?? `ATP ${data?.period ?? '2000–present'}`}.
          </div>
        </>
      )}
    </section>
  );
}

function ServeSaturationHypothesis() {
  const [data, setData] = useState<ServeSaturationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/hypotheses/serve-saturation`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<ServeSaturationData>;
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
  }, []);

  const buckets = data?.buckets ?? [];
  const curve = data?.curve ?? [];
  const kpis = data?.kpis;
  const yMin = Math.max(30, Math.floor(Math.min(...buckets.map((b) => b.winRate), ...curve.map((c) => c.winRate)) / 5) * 5 - 5);
  const yMax = Math.min(70, Math.ceil(Math.max(...buckets.map((b) => b.winRate), ...curve.map((c) => c.winRate)) / 5) * 5 + 5);
  const saturation = kpis?.saturationPoint;

  return (
    <section className="hyp-block overview-card">
      <HypothesisHeader rank="🥉" title="First serve → match win (saturation threshold)" status="supported">
        First-serve percentage improves match win rate only up to a point — beyond a certain threshold
        the marginal gain flattens (non-linear / threshold effect).
      </HypothesisHeader>

      {loading && <p className="overview-stub-badge">Loading live data…</p>}
      {error && (
        <p className="overview-stub-badge" style={{ color: 'var(--danger, #ef4444)' }}>
          Failed to load: {error}
        </p>
      )}

      {kpis && (
        <>
          <div className="hyp-kpi-row">
            <Kpi
              label="Estimated saturation point"
              value={saturation != null ? `~${saturation}%` : '—'}
              sub="5pp forward marginal win rate &lt; 0.5 pp per 1st-serve pp"
            />
            <Kpi
              label="Win rate lift (55% → 65%)"
              value={kpis.winRateLift != null ? `+${kpis.winRateLift} pp` : '—'}
              sub="interpolated from binned win rates"
            />
            <Kpi
              label="Matches with serve stats"
              value={formatMatchCount(kpis.matchCount)}
              sub={`${data?.period ?? '2015–present'} sample`}
            />
            <Kpi
              label="R² (quadratic vs linear)"
              value={kpis.r2Quadratic != null ? String(kpis.r2Quadratic) : '—'}
              sub={kpis.r2Linear != null ? `vs ${kpis.r2Linear} linear` : undefined}
            />
          </div>

          <div className="hyp-charts-grid">
            <div className="hyp-chart-card">
              <p className="hyp-chart-title">Match win rate by 1st-serve % bucket</p>
              <p className="hyp-chart-sub">Aggregated player-match rows · n per bucket in tooltip</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={buckets} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[yMin, yMax]} />
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${value}%`,
                      `Win rate · n=${(props.payload as ServeBucketRow).matches}`,
                    ]}
                  />
                  <Bar dataKey="winRate" name="Win rate" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="hyp-chart-card">
              <p className="hyp-chart-title">Win rate vs 1st-serve % (saturation curve)</p>
              <p className="hyp-chart-sub">Integer 1st-serve % bins · min 100 matches per point</p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={curve} margin={{ top: 28, right: 12, left: -16, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="pct"
                    tick={{ fontSize: 11 }}
                    label={{ value: '1st serve %', position: 'insideBottom', offset: -2, fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[yMin, yMax]} />
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${value}%`,
                      `Win rate · n=${(props.payload as ServeCurveRow).matches}`,
                    ]}
                  />
                  {saturation != null && (
                    <ReferenceLine
                      x={saturation}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{
                        value: `Saturation ~${saturation}%`,
                        fontSize: 10,
                        position: 'insideTop',
                        offset: 8,
                      }}
                    />
                  )}
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
            <strong>Method:</strong> bucket <code>100 × player_1stIn / player_svpt</code> from{' '}
            <code>atp_player_matches</code> ({data?.period ?? '2015–present'}); win rate = share of
            rows with <code>won_match = '1'</code>. {data?.sampleDefinition ?? ''}
          </div>
        </>
      )}
    </section>
  );
}

export default function HypothesisStubs() {
  return (
    <div className="hyp-stubs">
      <EarlySuccessHypothesis />

      <PeakAgeHypothesis />

      <ServeSaturationHypothesis />
    </div>
  );
}
