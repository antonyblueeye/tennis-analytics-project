'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
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
import { iocToAlpha2 } from '../lib/ioc';
import { API_BASE } from '@/lib/api';
import {
  enrichTournament,
  hasMapLocation,
  type ApiTournament,
  type DashboardTournament,
} from '../lib/tournamentLocations';

const SURFACE_COLORS: Record<string, string> = {
  Hard: '#3b82f6',
  Clay: '#ea580c',
  Grass: '#22c55e',
  Carpet: '#8b5cf6',
};

const MOCK_SURFACES_FALLBACK = [
  { name: 'Hard', value: 0, pct: 0 },
  { name: 'Clay', value: 0, pct: 0 },
  { name: 'Grass', value: 0, pct: 0 },
];

type DashboardSummary = {
  matches_played: number;
  tournaments_played: number;
  by_surface: { name: string; value: number; pct: number }[];
};

type TitleLeader = {
  player_id: number | null;
  player_name: string;
  player_ioc: string | null;
  titles: number;
};

type DashboardHighlight = {
  icon: string;
  label: string;
  value: string;
  sub?: string | null;
};

type HoverSource = 'map' | 'timeline' | null;

function levelClass(level: string) {
  if (level === 'GS') return 'dash-timeline-level-gs';
  if (level === 'M1000') return 'dash-timeline-level-m1000';
  if (level === '500') return 'dash-timeline-level-500';
  return 'dash-timeline-level-250';
}

function formatApiDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
    const lane = sorted.findIndex((x) => x.logicalId === item.logicalId);
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
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [tournaments, setTournaments] = useState<DashboardTournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [titleLeaders, setTitleLeaders] = useState<TitleLeader[]>([]);
  const [titlesLoading, setTitlesLoading] = useState(true);
  const [highlights, setHighlights] = useState<DashboardHighlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);

  useEffect(() => {
    fetch('/world.geojson')
      .then((res) => res.json())
      .then(setWorldGeo)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const from = formatApiDate(range.from);
    const to = formatApiDate(range.to);

    setSummaryLoading(true);
    fetch(
      `${API_BASE}/api/dashboard/summary?from=${from}&to=${to}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DashboardSummary) => setSummary(data))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(err);
          setSummary(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSummaryLoading(false);
      });

    return () => controller.abort();
  }, [range.from, range.to]);

  useEffect(() => {
    const controller = new AbortController();
    const from = formatApiDate(range.from);
    const to = formatApiDate(range.to);

    setTournamentsLoading(true);
    setTitlesLoading(true);
    setHighlightsLoading(true);

    fetch(
      `${API_BASE}/api/dashboard/tournaments?from=${from}&to=${to}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { results: ApiTournament[] }) => {
        setTournaments(data.results.map(enrichTournament));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(err);
          setTournaments([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setTournamentsLoading(false);
      });

    fetch(
      `${API_BASE}/api/dashboard/titles?from=${from}&to=${to}&limit=15`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { results: TitleLeader[] }) => setTitleLeaders(data.results))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(err);
          setTitleLeaders([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setTitlesLoading(false);
      });

    fetch(
      `${API_BASE}/api/dashboard/highlights?from=${from}&to=${to}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { results: DashboardHighlight[] }) => setHighlights(data.results))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(err);
          setHighlights([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setHighlightsLoading(false);
      });

    return () => controller.abort();
  }, [range.from, range.to]);

  const surfaceData =
    summary?.by_surface.length
      ? summary.by_surface
      : summaryLoading
        ? MOCK_SURFACES_FALLBACK
        : [];

  const maxTitles = titleLeaders[0]?.titles ?? 1;

  const mapTournaments = useMemo(
    () => tournaments.filter(hasMapLocation),
    [tournaments]
  );

  const mapHovered =
    hoveredTourney && hasMapLocation(hoveredTourney) ? hoveredTourney : null;

  const timelineItems = useMemo(() => layoutTimeline(tournaments, range), [tournaments, range]);
  const maxCluster = useMemo(
    () => Math.max(1, ...timelineItems.map((t) => t.clusterSize)),
    [timelineItems]
  );

  return (
    <div className="dash-stubs">

      <section className="dash-summary-grid">
        <div className="dash-stat-card dash-stat-card-kpi">
          <span className="dash-stat-icon">🎾</span>
          <p className="dash-stat-label">Matches played</p>
          <p className="dash-stat-value">
            {summaryLoading ? '…' : (summary?.matches_played ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="dash-stat-card dash-stat-card-kpi">
          <span className="dash-stat-icon">🏆</span>
          <p className="dash-stat-label">Tournaments held</p>
          <p className="dash-stat-value">
            {summaryLoading ? '…' : (summary?.tournaments_played ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="dash-stat-card dash-stat-card-chart">
          <div className="dash-stat-chart-head">
            <p className="dash-stat-label">Matches by surface</p>
          </div>
          <div className="dash-surface-split">
            {surfaceData.length === 0 && !summaryLoading ? (
              <p className="dash-surface-empty">No matches in this period</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={surfaceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={52}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {surfaceData.map((s) => (
                        <Cell key={s.name} fill={SURFACE_COLORS[s.name] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="dash-surface-legend">
                  {surfaceData.map((s) => (
                    <li key={s.name}>
                      <span className="dash-surface-dot" style={{ background: SURFACE_COLORS[s.name] ?? '#94a3b8' }} />
                      <span>{s.name}</span>
                      <span className="dash-surface-pct">
                        {summaryLoading ? '…' : `${s.pct}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
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
          {tournamentsLoading ? (
            <p className="dash-surface-empty">Loading tournaments…</p>
          ) : timelineItems.length === 0 ? (
            <p className="dash-surface-empty">No completed tournaments in this period</p>
          ) : (
          <div
            className="dash-timeline-track"
            style={{ height: `${Math.max(96, 56 + maxCluster * 22)}px` }}
          >
            <div className="dash-timeline-line" />
            {timelineItems.map((t) => {
              const top = laneTopPercent(t.lane, t.clusterSize);
              const isHovered = hoveredTourney?.logicalId === t.logicalId;
              return (
                <div key={t.logicalId} className="dash-timeline-node">
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
              const item = timelineItems.find((t) => t.logicalId === hoveredTourney.logicalId);
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
          )}
          <div className="dash-timeline-legend">
            <span><i className="dash-timeline-dot dash-timeline-level-gs" /> Grand Slam</span>
            <span><i className="dash-timeline-dot dash-timeline-level-m1000" /> Masters</span>
            <span><i className="dash-timeline-dot dash-timeline-level-500" /> ATP 500</span>
            <span><i className="dash-timeline-dot dash-timeline-level-250" /> ATP 250</span>
          </div>

          <div className="dash-map-section">
            <p className="dash-map-title">Host cities</p>
            {worldGeo && !tournamentsLoading && mapTournaments.length > 0 ? (
              <TournamentWorldMap
                tournaments={mapTournaments}
                hovered={mapHovered}
                showTooltip={hoverSource === 'map'}
                onHover={(t) => {
                  setHoveredTourney(t);
                  setHoverSource(t ? 'map' : null);
                }}
                worldGeo={worldGeo}
              />
            ) : worldGeo && tournamentsLoading ? (
              <div className="dash-map-loading">
                <div className="spinner" />
                <span>Loading map…</span>
              </div>
            ) : !worldGeo ? (
              <div className="dash-map-loading">
                <div className="spinner" />
                <span>Loading map…</span>
              </div>
            ) : (
              <p className="dash-surface-empty">
                {!tournamentsLoading && tournaments.length > 0 && mapTournaments.length === 0
                  ? 'No map coordinates for these events'
                  : 'No host cities to display'}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="overview-section">
        <h3 className="overview-section-title">Tournament titles</h3>
        <p className="dash-section-sub">Players ranked by titles won in the period</p>
        <div className="overview-card dash-titles-card">
          {titlesLoading ? (
            <p className="dash-surface-empty">Loading titles…</p>
          ) : titleLeaders.length === 0 ? (
            <p className="dash-surface-empty">No titles in this period</p>
          ) : (
          <ul className="dash-titles-list">
            {titleLeaders.map((p, i) => {
              const countryCode = iocToAlpha2(p.player_ioc);
              return (
              <li key={p.player_id ?? p.player_name} className="dash-titles-row">
                <span className="dash-titles-rank">#{i + 1}</span>
                <span className="dash-titles-flag">
                  {countryCode ? (
                    <ReactCountryFlag
                      countryCode={countryCode}
                      svg
                      style={{ width: '1.25em', height: '1.25em' }}
                      title={p.player_ioc ?? ''}
                    />
                  ) : null}
                </span>
                <span className="dash-titles-name">{p.player_name}</span>
                <span className="dash-titles-bar-wrap">
                  <span
                    className="dash-titles-bar"
                    style={{ width: `${(p.titles / maxTitles) * 100}%` }}
                  />
                </span>
                <span className="dash-titles-count">{p.titles}</span>
              </li>
            );
            })}
          </ul>
          )}
        </div>
      </section>

      <section className="overview-section">
        <h3 className="overview-section-title">Period highlights</h3>
        {highlightsLoading ? (
          <p className="dash-surface-empty">Loading highlights…</p>
        ) : highlights.length === 0 ? (
          <p className="dash-surface-empty">No highlights for this period</p>
        ) : (
        <div className="overview-extras-grid dash-insights-grid">
          {highlights.map((item) => (
            <div key={item.label} className="overview-extra-card dash-insight-card">
              <span className="overview-extra-icon">{item.icon}</span>
              <span className="overview-extra-value">{item.value}</span>
              <span className="overview-extra-label">{item.label}</span>
              {item.sub && <span className="dash-insight-sub">{item.sub}</span>}
            </div>
          ))}
        </div>
        )}
      </section>
    </div>
  );
}
