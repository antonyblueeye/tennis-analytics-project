'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from 'recharts';
import type { PickedPlayer } from './PlayerSearchPicker';

const COLOR_A = '#22c55e';
const COLOR_B = '#3b82f6';
const API = 'http://127.0.0.1:8000';

type MatchupRow = { label: string; wins: number; losses: number; pct: number };
type ProfileSide = {
  rank: number | null;
  rankStatus?: 'active' | 'inactive';
  lastRank?: number | null;
  age: number | null;
  height: number | null;
  hand: string;
  bestSurface: string;
};
type StyleRow = {
  label: string;
  a: number | null;
  b: number | null;
  max: number;
  pct?: boolean;
  invert?: boolean;
};
type H2HData = {
  summary: { winsA: number; winsB: number; setsA: number; setsB: number };
  meetings: {
    date: string;
    tournament: string;
    round: string;
    surface: string;
    winner: 'a' | 'b';
    score: string;
  }[];
  profile: { a: ProfileSide; b: ProfileSide };
  bySurface: { surface: string; a: number; b: number }[];
  tourneyLevels: { name: string; value: number; color: string }[];
  byRound: { round: string; a: number; b: number }[];
  style: StyleRow[];
  radar: { stat: string; a: number; b: number }[];
  insights: { icon: string; label: string; value: string }[];
  matchup: {
    vsHeight: { a: MatchupRow; b: MatchupRow };
    vsRank: { a: MatchupRow; b: MatchupRow };
    vsCountry: { a: MatchupRow; b: MatchupRow };
    vsAge: { a: MatchupRow; b: MatchupRow };
    vsHand: { a: MatchupRow; b: MatchupRow };
  };
};

function playerName(p: PickedPlayer) {
  return `${p.name_first} ${p.name_last}`.trim();
}

function initials(p: PickedPlayer) {
  return `${p.name_first?.charAt(0) ?? ''}${p.name_last?.charAt(0) ?? ''}`.toUpperCase() || '?';
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRank(side: ProfileSide) {
  if (side.rankStatus === 'active' && side.rank != null) return `#${side.rank}`;
  if (side.rankStatus === 'inactive') return 'Inactive';
  return side.rank != null ? `#${side.rank}` : '—';
}

function formatVal(val: number | null | string, suffix = '') {
  if (val == null || val === '') return '—';
  return `${val}${suffix}`;
}

function DualBar({
  label,
  a,
  b,
  max,
  pct,
  invert,
}: {
  label: string;
  a: number | null;
  b: number | null;
  max: number;
  pct?: boolean;
  invert?: boolean;
}) {
  const aNum = a ?? 0;
  const bNum = b ?? 0;
  const aLead = a != null && b != null && (invert ? aNum < bNum : aNum > bNum);
  const bLead = a != null && b != null && (invert ? bNum < aNum : bNum > aNum);
  const fmt = (v: number | null) => {
    if (v == null) return '—';
    return pct ? `${v}%` : String(v);
  };

  return (
    <div className="h2h-dual-bar">
      <div className="h2h-dual-bar-label">{label}</div>
      <div className="h2h-dual-bar-track">
        <div className="h2h-dual-bar-side h2h-dual-bar-side-a">
          <div
            className={`h2h-dual-bar-fill ${aLead ? 'h2h-dual-bar-fill-lead' : ''}`}
            style={{ width: `${max ? (aNum / max) * 100 : 0}%`, background: COLOR_A }}
          />
          <span className={`h2h-dual-bar-val ${aLead ? 'h2h-dual-bar-val-lead' : ''}`}>{fmt(a)}</span>
        </div>
        <div className="h2h-dual-bar-side h2h-dual-bar-side-b">
          <span className={`h2h-dual-bar-val ${bLead ? 'h2h-dual-bar-val-lead' : ''}`}>{fmt(b)}</span>
          <div
            className={`h2h-dual-bar-fill ${bLead ? 'h2h-dual-bar-fill-lead' : ''}`}
            style={{ width: `${max ? (bNum / max) * 100 : 0}%`, background: COLOR_B }}
          />
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ label, a, b }: { label: string; a: string | number; b: string | number }) {
  return (
    <div className="h2h-profile-stat">
      <span className="h2h-profile-stat-a">{a}</span>
      <span className="h2h-profile-stat-label">{label}</span>
      <span className="h2h-profile-stat-b">{b}</span>
    </div>
  );
}

function MatchupCard({
  title,
  subtitle,
  rowA,
  rowB,
  nameA,
  nameB,
}: {
  title: string;
  subtitle: string;
  rowA: MatchupRow;
  rowB: MatchupRow;
  nameA: string;
  nameB: string;
}) {
  return (
    <div className="overview-card h2h-matchup-card">
      <div className="overview-card-head">
        <h4 className="overview-card-title">{title}</h4>
        <p className="overview-card-sub">{subtitle}</p>
      </div>
      <div className="h2h-matchup-rows">
        <div className="h2h-matchup-row">
          <span className="h2h-matchup-player h2h-matchup-player-a">{nameA}</span>
          <span className="h2h-matchup-cat">{rowA.label}</span>
          <span className="h2h-matchup-wl">{rowA.wins} – {rowA.losses}</span>
          <span className="h2h-matchup-pct" style={{ color: COLOR_A }}>{rowA.pct}%</span>
        </div>
        <div className="h2h-matchup-row">
          <span className="h2h-matchup-player h2h-matchup-player-b">{nameB}</span>
          <span className="h2h-matchup-cat">{rowB.label}</span>
          <span className="h2h-matchup-wl">{rowB.wins} – {rowB.losses}</span>
          <span className="h2h-matchup-pct" style={{ color: COLOR_B }}>{rowB.pct}%</span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  playerA: PickedPlayer;
  playerB: PickedPlayer;
}

export default function HeadToHeadStubs({ playerA, playerB }: Props) {
  const [data, setData] = useState<H2HData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nameA = playerName(playerA);
  const nameB = playerName(playerB);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/h2h?player_a=${playerA.player_id}&player_b=${playerB.player_id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<H2HData>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setData(null);
          setError(e.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [playerA.player_id, playerB.player_id]);

  if (loading) {
    return (
      <div className="h2h-stubs">
        <p className="overview-stub-badge">Loading head-to-head…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h2h-stubs">
        <p className="overview-stub-badge" style={{ color: 'var(--danger, #ef4444)' }}>
          Failed to load: {error}
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, meetings, profile, bySurface, tourneyLevels, byRound, style, radar, insights, matchup } = data;
  const totalH2H = summary.winsA + summary.winsB;
  const pctA = totalH2H ? Math.round((summary.winsA / totalH2H) * 100) : 50;

  const donutData = [
    { name: nameA, value: summary.winsA, color: COLOR_A },
    { name: nameB, value: summary.winsB, color: COLOR_B },
  ];

  return (
    <div className="h2h-stubs">
      {/* Scoreboard */}
      <section className="h2h-scoreboard">
        <div className="h2h-scoreboard-player h2h-scoreboard-player-a">
          <div className="h2h-scoreboard-avatar">{initials(playerA)}</div>
          <h2 className="h2h-scoreboard-name">{nameA}</h2>
          <span className="h2h-scoreboard-wins" style={{ color: COLOR_A }}>
            {summary.winsA} wins
          </span>
        </div>

        <div className="h2h-scoreboard-center">
          <div className="h2h-scoreboard-record">
            <span className="h2h-scoreboard-num" style={{ color: COLOR_A }}>{summary.winsA}</span>
            <span className="h2h-scoreboard-sep">–</span>
            <span className="h2h-scoreboard-num" style={{ color: COLOR_B }}>{summary.winsB}</span>
          </div>
          <p className="h2h-scoreboard-label">
            {totalH2H} meetings · {summary.setsA}–{summary.setsB} sets
          </p>
          {totalH2H > 0 && (
            <div className="h2h-donut-wrap">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${value} wins (${Math.round(((value as number) / totalH2H) * 100)}%)`,
                      (props.payload as { name: string }).name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="h2h-donut-center">
                <span className="h2h-donut-pct">{pctA}%</span>
                <span className="h2h-donut-lbl">lead</span>
              </div>
            </div>
          )}
        </div>

        <div className="h2h-scoreboard-player h2h-scoreboard-player-b">
          <div className="h2h-scoreboard-avatar h2h-scoreboard-avatar-b">{initials(playerB)}</div>
          <h2 className="h2h-scoreboard-name">{nameB}</h2>
          <span className="h2h-scoreboard-wins" style={{ color: COLOR_B }}>
            {summary.winsB} wins
          </span>
        </div>
      </section>

      {/* Meeting history */}
      <section className="overview-section">
        <h3 className="overview-section-title">Direct meetings</h3>
        {meetings.length === 0 ? (
          <p className="overview-card-sub">No direct meetings found in the database.</p>
        ) : (
          <div className="overview-last-matches h2h-meetings-scroll">
            {meetings.map((m, i) => (
              <div
                key={`${m.date}-${m.tournament}-${i}`}
                className={`overview-match-card h2h-meeting-card overview-match-${m.winner === 'a' ? 'w' : 'l'}`}
              >
                <div className="overview-match-top">
                  <span className={`overview-match-result overview-match-result-${m.winner === 'a' ? 'w' : 'l'}`}>
                    {m.winner === 'a' ? nameA.split(' ').pop() : nameB.split(' ').pop()} W
                  </span>
                  <span className="overview-match-surface">{m.surface}</span>
                </div>
                <p className="overview-match-tourney">{m.tournament}</p>
                <p className="overview-match-round">{m.round}</p>
                <p className="overview-match-score">{m.score}</p>
                <p className="overview-match-date">{formatDate(m.date)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Profile comparison */}
      <section className="overview-section">
        <h3 className="overview-section-title">Profile comparison</h3>
        <div className="overview-card h2h-profile-card">
          <div className="h2h-profile-header">
            <span className="h2h-profile-name-a">{nameA}</span>
            <span className="h2h-profile-vs">vs</span>
            <span className="h2h-profile-name-b">{nameB}</span>
          </div>
          <ProfileStat label="ATP rank" a={formatRank(profile.a)} b={formatRank(profile.b)} />
          <ProfileStat label="Age" a={formatVal(profile.a.age)} b={formatVal(profile.b.age)} />
          <ProfileStat
            label="Height"
            a={formatVal(profile.a.height, ' cm')}
            b={formatVal(profile.b.height, ' cm')}
          />
          <ProfileStat label="Hand" a={profile.a.hand} b={profile.b.hand} />
          <ProfileStat label="Best surface" a={profile.a.bestSurface} b={profile.b.bestSurface} />
        </div>
      </section>

      {/* Radar + surface */}
      {(radar.length > 0 || bySurface.length > 0) && (
        <section className="overview-section">
          <div className="h2h-charts-grid">
            {radar.length > 0 && (
              <div className="overview-card h2h-chart-card">
                <div className="overview-card-head">
                  <h4 className="overview-card-title">Style profile</h4>
                  <p className="overview-card-sub">H2H serve stats index (0–100)</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radar} cx="50%" cy="50%" outerRadius="72%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Radar name={nameA} dataKey="a" stroke={COLOR_A} fill={COLOR_A} fillOpacity={0.25} strokeWidth={2} />
                    <Radar name={nameB} dataKey="b" stroke={COLOR_B} fill={COLOR_B} fillOpacity={0.2} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {bySurface.length > 0 && (
              <div className="overview-card h2h-chart-card">
                <div className="overview-card-head">
                  <h4 className="overview-card-title">H2H by surface</h4>
                  <p className="overview-card-sub">Match wins on each surface</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={bySurface} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <XAxis dataKey="surface" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="a" name={nameA} fill={COLOR_A} radius={[4, 4, 0, 0]} barSize={22} />
                    <Bar dataKey="b" name={nameB} fill={COLOR_B} radius={[4, 4, 0, 0]} barSize={22} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Serve style */}
      {style.length > 0 && (
        <section className="overview-section">
          <h3 className="overview-section-title">Serve & return style</h3>
          <div className="overview-card h2h-style-card">
            {style.map((s) => (
              <DualBar key={s.label} {...s} />
            ))}
          </div>
        </section>
      )}

      {/* Matchup context */}
      <section className="overview-section">
        <h3 className="overview-section-title">How they fare vs similar opponents</h3>
        <div className="overview-two-col">
          <MatchupCard
            title="vs opponent height"
            subtitle="Career record in the opponent's height bracket"
            nameA={nameA}
            nameB={nameB}
            rowA={matchup.vsHeight.a}
            rowB={matchup.vsHeight.b}
          />
          <MatchupCard
            title="vs opponent ranking"
            subtitle="Record against similarly ranked opponents"
            nameA={nameA}
            nameB={nameB}
            rowA={matchup.vsRank.a}
            rowB={matchup.vsRank.b}
          />
        </div>
        <div className="overview-two-col h2h-matchup-spaced">
          <MatchupCard
            title="vs opponent nationality"
            subtitle={`How each performs vs ${playerB.ioc ?? 'opponent'} / ${playerA.ioc ?? 'opponent'} players`}
            nameA={nameA}
            nameB={nameB}
            rowA={matchup.vsCountry.a}
            rowB={matchup.vsCountry.b}
          />
          <MatchupCard
            title="vs opponent age"
            subtitle="Career win rate in the opponent's age bracket"
            nameA={nameA}
            nameB={nameB}
            rowA={matchup.vsAge.a}
            rowB={matchup.vsAge.b}
          />
        </div>
        <div className="overview-two-col h2h-matchup-spaced">
          <MatchupCard
            title="vs opponent handedness"
            subtitle="Record vs opponents with the same hand"
            nameA={nameA}
            nameB={nameB}
            rowA={matchup.vsHand.a}
            rowB={matchup.vsHand.b}
          />
          {tourneyLevels.length > 0 && (
            <div className="overview-card h2h-chart-card">
              <div className="overview-card-head">
                <h4 className="overview-card-title">Where they meet</h4>
                <p className="overview-card-sub">Meetings by tournament level</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={tourneyLevels}
                    cx="50%"
                    cy="50%"
                    outerRadius={78}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                    stroke="none"
                  >
                    {tourneyLevels.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Round depth */}
      {byRound.length > 0 && (
        <section className="overview-section">
          <h3 className="overview-section-title">Round depth in H2H</h3>
          <div className="overview-card h2h-chart-card">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byRound} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="round" width={36} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="a" name={nameA} fill={COLOR_A} radius={[0, 4, 4, 0]} stackId="stack" />
                <Bar dataKey="b" name={nameB} fill={COLOR_B} radius={[0, 4, 4, 0]} stackId="stack" />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <section className="overview-section">
          <h3 className="overview-section-title">H2H insights</h3>
          <div className="overview-extras-grid">
            {insights.map((e) => (
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
