'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import type { DateRange } from './DateRangePicker';
import TournamentWorldMap, { type GeoCollection } from './TournamentWorldMap';
import TournamentTooltip from './TournamentTooltip';
import {
  DASHBOARD_TOURNAMENTS,
  type DashboardTournament,
} from '../lib/dashboardTournaments';

const SURFACE_COLORS: Record<string, string> = {
  Hard: '#3b82f6',
  Clay: '#ea580c',
  Grass: '#22c55e',
  Carpet: '#8b5cf6',
};

const MOCK_SUMMARY = {
  matches: 2847,
  tournaments: 62,
};

const MOCK_SURFACES = [
  { name: 'Hard', value: 1420, pct: 49.9 },
  { name: 'Clay', value: 892, pct: 31.3 },
  { name: 'Grass', value: 412, pct: 14.5 },
  { name: 'Carpet', value: 123, pct: 4.3 },
];

const MOCK_TOURNAMENTS = DASHBOARD_TOURNAMENTS;

type HoverSource = 'map' | 'timeline' | null;

const MOCK_TITLE_LEADERS = [
  { name: 'Carlos Alcaraz', titles: 5, flag: '🇪🇸' },
  { name: 'Jannik Sinner', titles: 3, flag: '🇮🇹' },
  { name: 'Stefanos Tsitsipas', titles: 2, flag: '🇬🇷' },
  { name: 'Andrey Rublev', titles: 2, flag: '🇷🇺' },
  { name: 'Alexander Zverev', titles: 1, flag: '🇩🇪' },
  { name: 'Holger Rune', titles: 1, flag: '🇩🇰' },
  { name: 'Taylor Fritz', titles: 1, flag: '🇺🇸' },
];

const MOCK_INSIGHTS = [
  { icon: '🔥', label: 'Longest win streak', value: 'Carlos Alcaraz', sub: '14 matches · Feb–Apr 2026' },
  { icon: '📈', label: 'Best ranking jump', value: 'Holger Rune', sub: '+47 places in 6 weeks' },
  { icon: '⏱️', label: 'Longest match', value: '5h 53m', sub: 'Musetti vs Cerundolo · RG 2025' },
  { icon: '⚡', label: 'Fastest completed match', value: '32 min', sub: 'Fritz vs Tiafoe · Miami 2026' },
  { icon: '🎾', label: 'Most aces in one match', value: '38', sub: 'Opelka vs Nakashima · Dallas' },
  { icon: '💥', label: 'Biggest upset', value: '#112 → #3', sub: 'Mensik def. Zverev · Madrid QF' },
  { icon: '🏟️', label: 'Most tiebreaks played', value: 'Holger Rune', sub: '18 tiebreak sets in period' },
  { icon: '🌍', label: 'Most countries represented', value: '34 nations', sub: 'Across all tournament fields' },
];

function levelClass(level: string) {
  if (level === 'GS') return 'dash-timeline-level-gs';
  if (level === 'M1000') return 'dash-timeline-level-m1000';
  if (level === '500') return 'dash-timeline-level-500';
  return 'dash-timeline-level-250';
}

function formatPeriod(range: DateRange) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${range.from.toLocaleDateString('en-GB', opts)} – ${range.to.toLocaleDateString('en-GB', opts)}`;
}

function dateToPosition(dateStr: string, range: DateRange) {
  const d = new Date(dateStr);
  const start = range.from.getTime();
  const end = range.to.getTime();
  const t = d.getTime();
  if (end <= start) return 50;
  return Math.max(2, Math.min(98, ((t - start) / (end - start)) * 100));
}

function getWeekKey(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay() || 7;
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${thursday.getFullYear()}-W${weekNo}`;
}

type TimelineItem = DashboardTournament & {
  left: number;
  lane: number;
  clusterSize: number;
};

function layoutTimeline(tournaments: DashboardTournament[], range: DateRange): TimelineItem[] {
  const withPos = tournaments.map((t) => ({
    ...t,
    left: dateToPosition(t.date, range),
    weekKey: getWeekKey(t.date),
  }));

  const byWeek = new Map<string, typeof withPos>();
  for (const item of withPos) {
    const list = byWeek.get(item.weekKey) ?? [];
    list.push(item);
    byWeek.set(item.weekKey, list);
  }

  return withPos.map((item) => {
    const cluster = byWeek.get(item.weekKey)!;
    const sorted = [...cluster].sort((a, b) => a.date.localeCompare(b.date));
    const lane = sorted.findIndex((x) => x.name === item.name && x.date === item.date);
    const clusterLeft =
      cluster.length > 1
        ? cluster.reduce((sum, c) => sum + c.left, 0) / cluster.length
        : item.left;

    return {
      ...item,
      left: clusterLeft,
      lane,
      clusterSize: cluster.length,
    };
  });
}

function laneTopPercent(lane: number, clusterSize: number) {
  if (clusterSize <= 1) return 50;
  const topPad = 18;
  const bottomPad = 82;
  if (clusterSize === 2) return lane === 0 ? 32 : 68;
  const span = bottomPad - topPad;
  return topPad + (lane / (clusterSize - 1)) * span;
}

interface Props {
  range: DateRange;
}

export default function DashboardStubs({ range }: Props) {
  const [hoveredTourney, setHoveredTourney] = useState<DashboardTournament | null>(null);
  const [hoverSource, setHoverSource] = useState<HoverSource>(null);
  const [worldGeo, setWorldGeo] = useState<GeoCollection | null>(null);

  useEffect(() => {
    fetch('/world.geojson')
      .then((res) => res.json())
      .then(setWorldGeo)
      .catch(console.error);
  }, []);

  const scaleFactor = useMemo(() => {
    const days = Math.max(
      1,
      (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.min(1, days / 365);
  }, [range]);

  const summary = useMemo(
    () => ({
      matches: Math.round(MOCK_SUMMARY.matches * scaleFactor),
      tournaments: Math.max(1, Math.round(MOCK_SUMMARY.tournaments * scaleFactor)),
    }),
    [scaleFactor]
  );

  const maxTitles = MOCK_TITLE_LEADERS[0]?.titles ?? 1;

  const timelineItems = useMemo(() => layoutTimeline(MOCK_TOURNAMENTS, range), [range]);
  const maxCluster = useMemo(
    () => Math.max(1, ...timelineItems.map((t) => t.clusterSize)),
    [timelineItems]
  );

  return (
    <div className="dash-stubs">
      <p className="overview-stub-badge">Preview · sample data · {formatPeriod(range)}</p>

      <section className="dash-summary-grid">
        <div className="dash-stat-card dash-stat-card-kpi">
          <span className="dash-stat-icon">🎾</span>
          <p className="dash-stat-label">Matches played</p>
          <p className="dash-stat-value">{summary.matches.toLocaleString()}</p>
        </div>
        <div className="dash-stat-card dash-stat-card-kpi">
          <span className="dash-stat-icon">🏆</span>
          <p className="dash-stat-label">Tournaments held</p>
          <p className="dash-stat-value">{summary.tournaments}</p>
        </div>
        <div className="dash-stat-card dash-stat-card-chart">
          <div className="dash-stat-chart-head">
            <p className="dash-stat-label">Matches by surface</p>
          </div>
          <div className="dash-surface-split">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={MOCK_SURFACES}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {MOCK_SURFACES.map((s) => (
                    <Cell key={s.name} fill={SURFACE_COLORS[s.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ul className="dash-surface-legend">
              {MOCK_SURFACES.map((s) => (
                <li key={s.name}>
                  <span className="dash-surface-dot" style={{ background: SURFACE_COLORS[s.name] }} />
                  <span>{s.name}</span>
                  <span className="dash-surface-pct">{s.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="overview-section">
        <h3 className="overview-section-title">Tournament timeline</h3>
        <p className="dash-section-sub">Completed events in the selected period — hover for the champion</p>
        <div className="overview-card dash-timeline-card">
          <div className="dash-timeline-axis">
            <span>{range.from.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}</span>
            <span>{range.to.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}</span>
          </div>
          <div
            className="dash-timeline-track"
            style={{ height: `${Math.max(96, 56 + maxCluster * 22)}px` }}
          >
            <div className="dash-timeline-line" />
            {timelineItems.map((t) => {
              const top = laneTopPercent(t.lane, t.clusterSize);
              const isHovered =
                hoveredTourney?.name === t.name && hoveredTourney?.date === t.date;
              return (
                <div key={t.name + t.date} className="dash-timeline-node">
                  {t.clusterSize > 1 && t.lane === 0 && (
                    <span
                      className="dash-timeline-cluster-badge"
                      style={{ left: `${t.left}%` }}
                    >
                      {t.clusterSize} events
                    </span>
                  )}
                  {top !== 50 && (
                    <span
                      className="dash-timeline-stem"
                      style={{
                        left: `${t.left}%`,
                        top: `${Math.min(top, 50)}%`,
                        height: `${Math.abs(top - 50)}%`,
                      }}
                      aria-hidden
                    />
                  )}
                  <button
                    type="button"
                    className={`dash-timeline-marker ${levelClass(t.level)} ${isHovered ? 'dash-timeline-marker-active' : ''}`}
                    style={{ left: `${t.left}%`, top: `${top}%` }}
                    onMouseEnter={() => {
                      setHoveredTourney(t);
                      setHoverSource('timeline');
                    }}
                    onMouseLeave={() => {
                      setHoveredTourney(null);
                      setHoverSource(null);
                    }}
                    onFocus={() => {
                      setHoveredTourney(t);
                      setHoverSource('timeline');
                    }}
                    onBlur={() => {
                      setHoveredTourney(null);
                      setHoverSource(null);
                    }}
                    aria-label={`${t.name}, winner ${t.winner}`}
                  />
                </div>
              );
            })}
            {hoveredTourney && hoverSource === 'timeline' && (() => {
              const item = timelineItems.find(
                (t) => t.name === hoveredTourney.name && t.date === hoveredTourney.date
              );
              const top = item ? laneTopPercent(item.lane, item.clusterSize) : 50;
              return (
                <div
                  className="dash-timeline-tooltip"
                  style={{
                    left: `${item?.left ?? dateToPosition(hoveredTourney.date, range)}%`,
                    top: `${top}%`,
                  }}
                >
                  <TournamentTooltip
                    t={hoveredTourney}
                    extra={
                      item && item.clusterSize > 1
                        ? `${item.clusterSize} events this week`
                        : undefined
                    }
                  />
                </div>
              );
            })()}
          </div>
          <div className="dash-timeline-legend">
            <span><i className="dash-timeline-dot dash-timeline-level-gs" /> Grand Slam</span>
            <span><i className="dash-timeline-dot dash-timeline-level-m1000" /> Masters</span>
            <span><i className="dash-timeline-dot dash-timeline-level-500" /> ATP 500</span>
            <span><i className="dash-timeline-dot dash-timeline-level-250" /> ATP 250</span>
          </div>

          <div className="dash-map-section">
            <p className="dash-map-title">Host cities</p>
            {worldGeo ? (
              <TournamentWorldMap
                tournaments={MOCK_TOURNAMENTS}
                hovered={hoveredTourney}
                showTooltip={hoverSource === 'map'}
                onHover={(t) => {
                  setHoveredTourney(t);
                  setHoverSource(t ? 'map' : null);
                }}
                worldGeo={worldGeo}
              />
            ) : (
              <div className="dash-map-loading">
                <div className="spinner" />
                <span>Loading map…</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="overview-section">
        <h3 className="overview-section-title">Tournament titles</h3>
        <p className="dash-section-sub">Players ranked by titles won in the period</p>
        <div className="overview-card dash-titles-card">
          <ul className="dash-titles-list">
            {MOCK_TITLE_LEADERS.map((p, i) => (
              <li key={p.name} className="dash-titles-row">
                <span className="dash-titles-rank">#{i + 1}</span>
                <span className="dash-titles-flag">{p.flag}</span>
                <span className="dash-titles-name">{p.name}</span>
                <span className="dash-titles-bar-wrap">
                  <span
                    className="dash-titles-bar"
                    style={{ width: `${(p.titles / maxTitles) * 100}%` }}
                  />
                </span>
                <span className="dash-titles-count">{p.titles}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="overview-section">
        <h3 className="overview-section-title">Period highlights</h3>
        <div className="overview-extras-grid dash-insights-grid">
          {MOCK_INSIGHTS.map((item) => (
            <div key={item.label} className="overview-extra-card dash-insight-card">
              <span className="overview-extra-icon">{item.icon}</span>
              <span className="overview-extra-value">{item.value}</span>
              <span className="overview-extra-label">{item.label}</span>
              {item.sub && <span className="dash-insight-sub">{item.sub}</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
