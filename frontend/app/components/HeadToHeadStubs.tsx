'use client';

import { useMemo } from 'react';
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

const MOCK_H2H = { winsA: 15, winsB: 8, setsA: 34, setsB: 26 };

const MOCK_MEETINGS = [
  { date: '10 Jul 2025', tournament: 'Wimbledon', round: 'SF', surface: 'Grass', winner: 'a' as const, score: '6-4 6-7 7-6' },
  { date: '08 Jun 2025', tournament: 'Roland Garros', round: 'QF', surface: 'Clay', winner: 'b' as const, score: '6-3 6-4 6-2' },
  { date: '15 Mar 2025', tournament: 'Indian Wells', round: 'F', surface: 'Hard', winner: 'a' as const, score: '7-6 6-4' },
  { date: '02 Sep 2024', tournament: 'US Open', round: 'SF', surface: 'Hard', winner: 'a' as const, score: '4-6 6-4 6-3 6-4' },
  { date: '12 Nov 2023', tournament: 'ATP Finals', round: 'RR', surface: 'Hard', winner: 'b' as const, score: '6-7 7-6 6-3' },
];

const MOCK_PROFILE = {
  a: { rank: 2, age: 28, height: 188, hand: 'Right', bestSurface: 'Hard' },
  b: { rank: 3, age: 22, height: 183, hand: 'Right', bestSurface: 'Clay' },
};

const MOCK_RADAR = [
  { stat: 'Serve', a: 88, b: 82 },
  { stat: 'Return', a: 76, b: 84 },
  { stat: 'Forehand', a: 91, b: 88 },
  { stat: 'Backhand', a: 78, b: 85 },
  { stat: 'Movement', a: 85, b: 92 },
  { stat: 'Mental', a: 90, b: 86 },
];

const MOCK_SURFACE = [
  { surface: 'Hard', a: 8, b: 4 },
  { surface: 'Clay', a: 4, b: 3 },
  { surface: 'Grass', a: 3, b: 1 },
];

const MOCK_STYLE = [
  { label: 'Aces / match', a: 6.2, b: 4.8, max: 8 },
  { label: '1st serve %', a: 68, b: 64, max: 75, pct: true },
  { label: '1st serve won %', a: 74, b: 71, max: 80, pct: true },
  { label: 'BP saved %', a: 62, b: 58, max: 70, pct: true },
  { label: 'DF / match', a: 2.1, b: 2.8, max: 4, invert: true },
];

const MOCK_VS_HEIGHT = {
  aVsBHeight: { label: 'vs 180–190 cm opponents', wins: 142, losses: 48, pct: 74.7 },
  bVsAHeight: { label: 'vs 185–195 cm opponents', wins: 98, losses: 42, pct: 70.0 },
};

const MOCK_VS_RANK = {
  aVsBRank: { label: 'vs top-5 ranked', wins: 28, losses: 22, pct: 56.0 },
  bVsARank: { label: 'vs top-5 ranked', wins: 24, losses: 26, pct: 48.0 },
};

const MOCK_VS_COUNTRY = {
  aVsBCountry: { label: 'vs Spanish players', wins: 18, losses: 6, pct: 75.0 },
  bVsACountry: { label: 'vs Serbian players', wins: 12, losses: 14, pct: 46.2 },
};

const MOCK_VS_AGE = {
  aVsBAge: { wins: 86, losses: 32, pct: 72.9 },
  bVsAAge: { wins: 64, losses: 38, pct: 62.7 },
};

const MOCK_VS_HAND = {
  aVsBHand: { wins: 124, losses: 44, pct: 73.8 },
  bVsAHand: { wins: 118, losses: 52, pct: 69.4 },
};

const MOCK_TOURNEY_LEVEL = [
  { name: 'Grand Slam', value: 9, color: '#eab308' },
  { name: 'Masters', value: 7, color: '#8b5cf6' },
  { name: 'ATP 500', value: 4, color: '#06b6d4' },
  { name: 'Other', value: 3, color: '#94a3b8' },
];

const MOCK_ROUNDS = [
  { round: 'F', a: 3, b: 2 },
  { round: 'SF', a: 4, b: 3 },
  { round: 'QF', a: 3, b: 1 },
  { round: 'R16', a: 3, b: 1 },
  { round: 'RR', a: 2, b: 1 },
];

const MOCK_INSIGHTS = [
  { icon: '⏱️', label: 'Avg. H2H duration', value: '2h 38m' },
  { icon: '🎯', label: 'Tiebreak record', value: '12 – 8' },
  { icon: '💪', label: 'Deciding set record', value: '9 – 5' },
  { icon: '🔥', label: 'Longest win streak (H2H)', value: '4 matches' },
  { icon: '🌡️', label: 'Most common surface', value: 'Hard (12)' },
  { icon: '🏆', label: 'Biggest stage win', value: 'Wimbledon SF' },
];

function playerName(p: PickedPlayer) {
  return `${p.name_first} ${p.name_last}`.trim();
}

function formatHand(hand: string | null): string {
  if (!hand) return 'unknown-hand';
  const h = hand.trim().toUpperCase();
  if (h === 'R' || h.startsWith('RIGHT')) return 'right-handed';
  if (h === 'L' || h.startsWith('LEFT')) return 'left-handed';
  if (h === 'U') return 'ambidextrous';
  return hand.toLowerCase();
}

function ageBracket(age: number): string {
  if (age < 21) return 'under 21';
  if (age <= 25) return '21–25';
  if (age <= 30) return '26–30';
  if (age <= 35) return '31–35';
  return '36+';
}

function initials(p: PickedPlayer) {
  return `${p.name_first?.charAt(0) ?? ''}${p.name_last?.charAt(0) ?? ''}`.toUpperCase() || '?';
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
  a: number;
  b: number;
  max: number;
  pct?: boolean;
  invert?: boolean;
}) {
  const aLead = invert ? a < b : a > b;
  const bLead = invert ? b < a : b > a;
  return (
    <div className="h2h-dual-bar">
      <div className="h2h-dual-bar-label">{label}</div>
      <div className="h2h-dual-bar-track">
        <div className="h2h-dual-bar-side h2h-dual-bar-side-a">
          <div
            className={`h2h-dual-bar-fill ${aLead ? 'h2h-dual-bar-fill-lead' : ''}`}
            style={{ width: `${(a / max) * 100}%`, background: COLOR_A }}
          />
          <span className={`h2h-dual-bar-val ${aLead ? 'h2h-dual-bar-val-lead' : ''}`}>
            {pct ? `${a}%` : a}
          </span>
        </div>
        <div className="h2h-dual-bar-side h2h-dual-bar-side-b">
          <span className={`h2h-dual-bar-val ${bLead ? 'h2h-dual-bar-val-lead' : ''}`}>
            {pct ? `${b}%` : b}
          </span>
          <div
            className={`h2h-dual-bar-fill ${bLead ? 'h2h-dual-bar-fill-lead' : ''}`}
            style={{ width: `${(b / max) * 100}%`, background: COLOR_B }}
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
  rowA: { wins: number; losses: number; pct: number; label: string };
  rowB: { wins: number; losses: number; pct: number; label: string };
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
  const nameA = playerName(playerA);
  const nameB = playerName(playerB);
  const totalH2H = MOCK_H2H.winsA + MOCK_H2H.winsB;
  const pctA = Math.round((MOCK_H2H.winsA / totalH2H) * 100);

  const donutData = [
    { name: nameA, value: MOCK_H2H.winsA, color: COLOR_A },
    { name: nameB, value: MOCK_H2H.winsB, color: COLOR_B },
  ];

  const vsAgeRows = useMemo(
    () => ({
      a: {
        ...MOCK_VS_AGE.aVsBAge,
        label: `vs age ${ageBracket(MOCK_PROFILE.b.age)} opponents`,
      },
      b: {
        ...MOCK_VS_AGE.bVsAAge,
        label: `vs age ${ageBracket(MOCK_PROFILE.a.age)} opponents`,
      },
    }),
    []
  );

  const vsHandRows = useMemo(
    () => ({
      a: {
        ...MOCK_VS_HAND.aVsBHand,
        label: `vs ${formatHand(playerB.hand)} opponents`,
      },
      b: {
        ...MOCK_VS_HAND.bVsAHand,
        label: `vs ${formatHand(playerA.hand)} opponents`,
      },
    }),
    [playerA.hand, playerB.hand]
  );

  return (
    <div className="h2h-stubs">
      <p className="overview-stub-badge">Preview · sample data</p>

      {/* Scoreboard */}
      <section className="h2h-scoreboard">
        <div className="h2h-scoreboard-player h2h-scoreboard-player-a">
          <div className="h2h-scoreboard-avatar">{initials(playerA)}</div>
          <h2 className="h2h-scoreboard-name">{nameA}</h2>
          <span className="h2h-scoreboard-wins" style={{ color: COLOR_A }}>
            {MOCK_H2H.winsA} wins
          </span>
        </div>

        <div className="h2h-scoreboard-center">
          <div className="h2h-scoreboard-record">
            <span className="h2h-scoreboard-num" style={{ color: COLOR_A }}>{MOCK_H2H.winsA}</span>
            <span className="h2h-scoreboard-sep">–</span>
            <span className="h2h-scoreboard-num" style={{ color: COLOR_B }}>{MOCK_H2H.winsB}</span>
          </div>
          <p className="h2h-scoreboard-label">{totalH2H} meetings · {MOCK_H2H.setsA}–{MOCK_H2H.setsB} sets</p>
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
        </div>

        <div className="h2h-scoreboard-player h2h-scoreboard-player-b">
          <div className="h2h-scoreboard-avatar h2h-scoreboard-avatar-b">{initials(playerB)}</div>
          <h2 className="h2h-scoreboard-name">{nameB}</h2>
          <span className="h2h-scoreboard-wins" style={{ color: COLOR_B }}>
            {MOCK_H2H.winsB} wins
          </span>
        </div>
      </section>

      {/* Meeting history */}
      <section className="overview-section">
        <h3 className="overview-section-title">Direct meetings</h3>
        <div className="overview-last-matches h2h-meetings-scroll">
          {MOCK_MEETINGS.map((m, i) => (
            <div
              key={i}
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
              <p className="overview-match-date">{m.date}</p>
            </div>
          ))}
        </div>
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
          <ProfileStat label="ATP rank" a={`#${MOCK_PROFILE.a.rank}`} b={`#${MOCK_PROFILE.b.rank}`} />
          <ProfileStat label="Age" a={MOCK_PROFILE.a.age} b={MOCK_PROFILE.b.age} />
          <ProfileStat label="Height" a={`${MOCK_PROFILE.a.height} cm`} b={`${MOCK_PROFILE.b.height} cm`} />
          <ProfileStat label="Hand" a={MOCK_PROFILE.a.hand} b={MOCK_PROFILE.b.hand} />
          <ProfileStat label="Best surface" a={MOCK_PROFILE.a.bestSurface} b={MOCK_PROFILE.b.bestSurface} />
        </div>
      </section>

      {/* Radar + surface */}
      <section className="overview-section">
        <div className="h2h-charts-grid">
          <div className="overview-card h2h-chart-card">
            <div className="overview-card-head">
              <h4 className="overview-card-title">Style profile</h4>
              <p className="overview-card-sub">Relative strengths (mock index 0–100)</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={MOCK_RADAR} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Radar name={nameA} dataKey="a" stroke={COLOR_A} fill={COLOR_A} fillOpacity={0.25} strokeWidth={2} />
                <Radar name={nameB} dataKey="b" stroke={COLOR_B} fill={COLOR_B} fillOpacity={0.2} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="overview-card h2h-chart-card">
            <div className="overview-card-head">
              <h4 className="overview-card-title">H2H by surface</h4>
              <p className="overview-card-sub">Match wins on each surface</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={MOCK_SURFACE} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="surface" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="a" name={nameA} fill={COLOR_A} radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="b" name={nameB} fill={COLOR_B} radius={[4, 4, 0, 0]} barSize={22} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Serve style */}
      <section className="overview-section">
        <h3 className="overview-section-title">Serve & return style</h3>
        <div className="overview-card h2h-style-card">
          {MOCK_STYLE.map((s) => (
            <DualBar key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* Matchup context: height, rank, country */}
      <section className="overview-section">
        <h3 className="overview-section-title">How they fare vs similar opponents</h3>
        <div className="overview-two-col">
          <MatchupCard
            title="vs opponent height"
            subtitle="Career record in the opponent's height bracket"
            nameA={nameA}
            nameB={nameB}
            rowA={MOCK_VS_HEIGHT.aVsBHeight}
            rowB={MOCK_VS_HEIGHT.bVsAHeight}
          />
          <MatchupCard
            title="vs opponent ranking"
            subtitle="Record against similarly ranked opponents"
            nameA={nameA}
            nameB={nameB}
            rowA={MOCK_VS_RANK.aVsBRank}
            rowB={MOCK_VS_RANK.bVsARank}
          />
        </div>
        <div className="overview-two-col h2h-matchup-spaced">
          <MatchupCard
            title="vs opponent nationality"
            subtitle={`How each performs vs ${playerB.ioc ?? 'opponent'} / ${playerA.ioc ?? 'opponent'} players`}
            nameA={nameA}
            nameB={nameB}
            rowA={MOCK_VS_COUNTRY.aVsBCountry}
            rowB={MOCK_VS_COUNTRY.bVsACountry}
          />
          <MatchupCard
            title="vs opponent age"
            subtitle="Career win rate in the opponent's age bracket at match date"
            nameA={nameA}
            nameB={nameB}
            rowA={vsAgeRows.a}
            rowB={vsAgeRows.b}
          />
        </div>
        <div className="overview-two-col h2h-matchup-spaced">
          <MatchupCard
            title="vs opponent handedness"
            subtitle={`Record vs ${formatHand(playerB.hand)} / ${formatHand(playerA.hand)} players`}
            nameA={nameA}
            nameB={nameB}
            rowA={vsHandRows.a}
            rowB={vsHandRows.b}
          />
          <div className="overview-card h2h-chart-card">
            <div className="overview-card-head">
              <h4 className="overview-card-title">Where they meet</h4>
              <p className="overview-card-sub">Meetings by tournament level</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={MOCK_TOURNEY_LEVEL}
                  cx="50%"
                  cy="50%"
                  outerRadius={78}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                  stroke="none"
                >
                  {MOCK_TOURNEY_LEVEL.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Round depth */}
      <section className="overview-section">
        <h3 className="overview-section-title">Round depth in H2H</h3>
        <div className="overview-card h2h-chart-card">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MOCK_ROUNDS} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
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

      {/* Insights grid */}
      <section className="overview-section">
        <h3 className="overview-section-title">H2H insights</h3>
        <div className="overview-extras-grid">
          {MOCK_INSIGHTS.map((e) => (
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
