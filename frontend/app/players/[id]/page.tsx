'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactCountryFlag from 'react-country-flag';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { iocToAlpha2, iocToName } from '../../lib/ioc';
import { getPlayerImage } from '../../lib/wiki';
import { formatDobWithAge } from '../../lib/player';
import RankingHistoryChart from '../../components/RankingHistoryChart';
import PlayerOverviewStubs from '../../components/PlayerOverviewStubs';
import TournamentResultPopover from '../../components/TournamentResultPopover';

countries.registerLocale(enLocale);

const GRAND_SLAM_ICONS = {
  ao: '/australian-open.png',
  rg: '/roland-garros.png',
  w: '/wimbledon.png',
  us: '/us-open.svg',
} as const;

type SlamKey = keyof typeof GRAND_SLAM_ICONS;
type PlayerTab = 'overview' | 'grand-slam' | 'masters';

interface Player {
  player_id: number | string;
  name_first: string;
  name_last: string;
  hand: string | null;
  height: number | string | null;
  ioc: string | null;
  dob: string | number | null;
  wikidata_id: string | null;
}

interface RankingHistory {
  ranking_date: string;
  rank: number;
  points: number;
}

interface RankingMeta {
  rankStatus: 'active' | 'inactive';
  currentRank: number | null;
  lastRank: number | null;
  lastRankDate: number | null;
}

interface GrandSlamResult {
  year: number;
  slam: SlamKey;
  result: string;
}

interface SlamYearRow {
  year: number;
  ao: string;
  rg: string;
  w: string;
  us: string;
}

interface MastersYearRow {
  year: number;
  results: Record<string, string>;
}

interface MastersEraGroup {
  startYear: number;
  endYear: number;
  tournaments: string[];
  rows: MastersYearRow[];
}

interface SlamSlamStat {
  key: SlamKey;
  label: string;
  icon: string;
  titles: number;
  best: string;
  appearances: number;
}

interface MastersTourneyStat {
  name: string;
  titles: number;
  best: string;
  appearances: number;
}

const GRAND_SLAMS: { key: SlamKey; label: string; icon: string }[] = [
  { key: 'ao', label: 'Australian Open', icon: GRAND_SLAM_ICONS.ao },
  { key: 'rg', label: 'Roland Garros', icon: GRAND_SLAM_ICONS.rg },
  { key: 'w', label: 'Wimbledon', icon: GRAND_SLAM_ICONS.w },
  { key: 'us', label: 'US Open', icon: GRAND_SLAM_ICONS.us },
];

const ROUND_RANK: Record<string, number> = {
  W: 8, F: 7, SF: 6, QF: 5, R16: 4, R32: 3, R64: 2, R128: 1,
};

const handLabel: Record<string, string> = {
  R: 'Right',
  L: 'Left',
  U: 'Unknown',
};

const TABS: { id: PlayerTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'grand-slam', label: 'Grand Slam' },
  { id: 'masters', label: 'Masters' },
];

function getInitials(first: string | null, last: string | null) {
  const f = first ? first.charAt(0) : '';
  const l = last ? last.charAt(0) : '';
  return `${f}${l}`.toUpperCase() || '🎾';
}

function formatHeight(height: number | string | null) {
  if (height == null || height === '') return '—';
  const n = Number(height);
  return Number.isFinite(n) ? `${Math.round(n)} cm` : `${height} cm`;
}

function isCountableResult(result: string) {
  return result !== '—' && result !== 'N/T' && result !== '···';
}

function getSlamResultClass(result: string) {
  switch (result) {
    case 'W':
      return 'slam-result-w';
    case 'F':
      return 'slam-result-f';
    case 'SF':
      return 'slam-result-sf';
    case 'QF':
      return 'slam-result-qf';
    case 'N/T':
      return 'slam-result-nth';
    case '···':
      return 'slam-result-upcoming';
    default:
      return '';
  }
}

function buildSlamGrid(results: GrandSlamResult[]): SlamYearRow[] {
  const gridMap = new Map<number, SlamYearRow>();

  for (const row of results) {
    const year = Number(row.year);
    if (!gridMap.has(year)) {
      gridMap.set(year, { year, ao: '—', rg: '—', w: '—', us: '—' });
    }
    const entry = gridMap.get(year)!;
    if (row.slam in entry) {
      entry[row.slam as SlamKey] = row.result;
    }
  }

  const sortedYears = Array.from(gridMap.values()).sort((a, b) => b.year - a.year);
  const filled: SlamYearRow[] = [];

  for (let i = 0; i < sortedYears.length; i++) {
    const current = sortedYears[i];
    const prev = sortedYears[i + 1];

    filled.push(current);

    if (prev) {
      for (let y = current.year - 1; y > prev.year; y--) {
        filled.push({ year: y, ao: '—', rg: '—', w: '—', us: '—' });
      }
    }
  }

  return filled;
}

function computeSlamStats(results: GrandSlamResult[]) {
  const playable = results.filter((r) => isCountableResult(r.result));
  const titles = playable.filter((r) => r.result === 'W').length;
  const finals = playable.filter((r) => r.result === 'W' || r.result === 'F').length;
  const semis = playable.filter((r) => ['W', 'F', 'SF'].includes(r.result)).length;
  const seasons = new Set(playable.map((r) => r.year)).size;

  const bySlam: SlamSlamStat[] = GRAND_SLAMS.map((slam) => {
    const slamResults = playable.filter((r) => r.slam === slam.key);
    const best = slamResults.reduce(
      (acc, r) => ((ROUND_RANK[r.result] ?? 0) > (ROUND_RANK[acc] ?? 0) ? r.result : acc),
      '—'
    );
    return {
      key: slam.key,
      label: slam.label,
      icon: slam.icon,
      titles: slamResults.filter((r) => r.result === 'W').length,
      best,
      appearances: slamResults.length,
    };
  });

  return { titles, finals, semis, seasons, bySlam };
}

function computeMastersStats(groups: MastersEraGroup[]) {
  const entries: { name: string; result: string }[] = [];

  for (const group of groups) {
    for (const row of group.rows) {
      for (const name of group.tournaments) {
        const result = row.results[name] ?? '—';
        if (isCountableResult(result)) {
          entries.push({ name, result });
        }
      }
    }
  }

  const titles = entries.filter((e) => e.result === 'W').length;
  const finals = entries.filter((e) => e.result === 'W' || e.result === 'F').length;
  const semis = entries.filter((e) => ['W', 'F', 'SF'].includes(e.result)).length;

  const tourneyMap = new Map<string, { titles: number; best: string; appearances: number }>();
  for (const { name, result } of entries) {
    const cur = tourneyMap.get(name) ?? { titles: 0, best: '—', appearances: 0 };
    cur.appearances += 1;
    if (result === 'W') cur.titles += 1;
    if ((ROUND_RANK[result] ?? 0) > (ROUND_RANK[cur.best] ?? 0)) cur.best = result;
    tourneyMap.set(name, cur);
  }

  const byTournament: MastersTourneyStat[] = Array.from(tourneyMap.entries())
    .map(([name, stats]) => ({ name: formatMastersLabel(name), ...stats }))
    .sort(
      (a, b) =>
        b.titles - a.titles ||
        (ROUND_RANK[b.best] ?? 0) - (ROUND_RANK[a.best] ?? 0) ||
        b.appearances - a.appearances
    );

  return { titles, finals, semis, totalEvents: entries.length, byTournament };
}

function mastersGridColumns(count: number) {
  return `44px repeat(${count}, minmax(0, 1fr))`;
}

function formatMastersLabel(name: string) {
  return name.replace(/ Masters$/, '');
}

function formatEraLabel(startYear: number, endYear: number) {
  return startYear === endYear ? `${startYear}` : `${startYear}–${endYear}`;
}

function ResultsLegend() {
  return (
    <div className="slam-legend">
      <div className="slam-legend-item">
        <span className="slam-legend-badge slam-result-w">W</span>
        <span>Winner</span>
      </div>
      <div className="slam-legend-item">
        <span className="slam-legend-badge slam-result-f">F</span>
        <span>Finalist</span>
      </div>
      <div className="slam-legend-item">
        <span className="slam-legend-badge slam-result-sf">SF</span>
        <span>Semi-final</span>
      </div>
      <div className="slam-legend-item">
        <span className="slam-legend-badge slam-result-qf">QF</span>
        <span>Quarter-final</span>
      </div>
      <div className="slam-legend-item">
        <span className="slam-legend-badge slam-result-nth">N/T</span>
        <span>Not held</span>
      </div>
      <div className="slam-legend-item">
        <span className="slam-legend-badge slam-result-upcoming">···</span>
        <span>Upcoming</span>
      </div>
    </div>
  );
}

function StatCards({
  items,
}: {
  items: { label: string; value: string | number; accent?: boolean }[];
}) {
  return (
    <div className="player-stat-grid">
      {items.map((item) => (
        <div key={item.label} className={`player-stat-card${item.accent ? ' player-stat-card-accent' : ''}`}>
          <span className="player-stat-value">{item.value}</span>
          <span className="player-stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = Number(params.id);

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([]);
  const [rankingMeta, setRankingMeta] = useState<RankingMeta | null>(null);
  const [grandSlamData, setGrandSlamData] = useState<GrandSlamResult[]>([]);
  const [mastersGroups, setMastersGroups] = useState<MastersEraGroup[]>([]);
  const [activeTab, setActiveTab] = useState<PlayerTab>('overview');

  useEffect(() => {
    if (!playerId || Number.isNaN(playerId)) {
      setError(true);
      setLoading(false);
      return;
    }

    async function fetchPlayer() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/players/${playerId}`);
        if (!res.ok) throw new Error('Player not found');
        const data: Player = await res.json();
        setPlayer(data);

        const rankingRes = await fetch(
          `http://127.0.0.1:8000/api/players/${playerId}/rankings-history`
        );
        if (rankingRes.ok) {
          const rankingData = await rankingRes.json();
          setRankingHistory(rankingData.results || []);
          setRankingMeta({
            rankStatus: rankingData.rankStatus ?? 'inactive',
            currentRank: rankingData.currentRank ?? null,
            lastRank: rankingData.lastRank ?? null,
            lastRankDate: rankingData.lastRankDate ?? null,
          });
        }

        const slamRes = await fetch(
          `http://127.0.0.1:8000/api/players/${playerId}/grand-slams`
        );
        if (slamRes.ok) {
          const slamData = await slamRes.json();
          setGrandSlamData(slamData.results || []);
        }

        const mastersRes = await fetch(
          `http://127.0.0.1:8000/api/players/${playerId}/masters`
        );
        if (mastersRes.ok) {
          const mastersData = await mastersRes.json();
          setMastersGroups(mastersData.groups || []);
        }

        const fullName = `${data.name_first} ${data.name_last}`;
        const img = await getPlayerImage(data.wikidata_id, fullName);
        if (img) setImageUrl(img);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [playerId]);

  const slamRows = useMemo(() => buildSlamGrid(grandSlamData), [grandSlamData]);
  const slamStats = useMemo(() => computeSlamStats(grandSlamData), [grandSlamData]);
  const mastersStats = useMemo(() => computeMastersStats(mastersGroups), [mastersGroups]);

  if (loading) {
    return (
      <div className="page-content">
        <Link href="/players" className="back-link">← Back to search</Link>
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading player…</span>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="page-content">
        <Link href="/players" className="back-link">← Back to search</Link>
        <div className="empty-state">
          <span className="empty-icon">🎾</span>
          <p className="empty-title">Player not found</p>
          <p className="empty-sub">Check the link or search again</p>
        </div>
      </div>
    );
  }

  const fullName = `${player.name_first} ${player.name_last}`;
  const countryName = iocToName(player.ioc, countries.getName.bind(countries));
  const countryCode = iocToAlpha2(player.ioc);

  return (
    <div className="page-content">
      <Link href="/players" className="back-link">← Back to search</Link>

      <article className="player-profile-card">
        <div className="player-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`player-tab${activeTab === tab.id ? ' player-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="player-tab-panel" role="tabpanel">
          {activeTab === 'overview' && (
            <>
              <div className="player-profile-header">
                <div className="player-profile-photo-col">
                  <div className="player-profile-photo">
                    {imageUrl ? (
                      <img src={imageUrl} alt={fullName} />
                    ) : (
                      <div className="player-profile-photo-fallback">
                        {getInitials(player.name_first, player.name_last)}
                      </div>
                    )}
                  </div>

                  {rankingMeta && (
                    <div
                      className={`player-current-rank${
                        rankingMeta.rankStatus === 'inactive' ? ' player-current-rank-inactive' : ''
                      }`}
                    >
                      {rankingMeta.rankStatus === 'active' && rankingMeta.currentRank != null ? (
                        <>
                          <span className="player-current-rank-num">#{rankingMeta.currentRank}</span>
                          <span className="player-current-rank-label">Current ranking</span>
                          {rankingHistory[0]?.points != null && (
                            <span className="player-current-rank-points">
                              {rankingHistory[0].points.toLocaleString()} pts
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="player-current-rank-num player-current-rank-inactive-label">
                            Inactive
                          </span>
                          <span className="player-current-rank-label">Not in current rankings</span>
                          {rankingMeta.lastRank != null && (
                            <span className="player-current-rank-points">
                              Last: #{rankingMeta.lastRank}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="player-profile-info">
                  <h1 className="player-profile-name">{fullName}</h1>

                  <div className="player-profile-fields">
                    <div className="profile-field">
                      <span className="profile-field-icon">🎂</span>
                      <span className="profile-field-label">Date of birth</span>
                      <span className="profile-field-value">
                        {formatDobWithAge(player.dob)}
                      </span>
                    </div>

                    <div className="profile-field">
                      <span className="profile-field-icon">🖐</span>
                      <span className="profile-field-label">Playing hand</span>
                      <span className="profile-field-value">
                        {player.hand ? handLabel[player.hand] || player.hand : '—'}
                      </span>
                    </div>

                    <div className="profile-field">
                      <span className="profile-field-icon">📏</span>
                      <span className="profile-field-label">Height</span>
                      <span className="profile-field-value">
                        {formatHeight(player.height)}
                      </span>
                    </div>

                    <div className="profile-field">
                      <span className="profile-field-icon">🌍</span>
                      <span className="profile-field-label">Country</span>
                      <span className="profile-field-value">
                        {countryName || '—'}
                        {countryCode && (
                          <ReactCountryFlag
                            countryCode={countryCode}
                            svg
                            style={{ width: '1.4em', height: '1.4em', borderRadius: '3px' }}
                            title={player.ioc || ''}
                          />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <PlayerOverviewStubs />

              {rankingHistory.length > 0 && (
                <div className="player-overview-chart">
                  <RankingHistoryChart data={rankingHistory} />
                </div>
              )}
            </>
          )}

          {activeTab === 'grand-slam' && (
              <>
                <section className="player-tab-block">
                  <h3 className="analytics-title">Grand Slam Results</h3>
                  <ResultsLegend />

                  {slamRows.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 16px' }}>
                      <p className="empty-sub">No Grand Slam results found</p>
                    </div>
                  ) : (
                    <div className="slam-table">
                      <div className="slam-row slam-header">
                        <div className="slam-cell year-cell">Year</div>
                        {GRAND_SLAMS.map((slam) => (
                          <div key={slam.key} className="slam-cell slam-header-cell">
                            <div className="slam-icon-circle">
                              <img src={slam.icon} alt={slam.label} />
                            </div>
                            <span>{slam.label}</span>
                          </div>
                        ))}
                      </div>

                      {slamRows.map((yearRow) => (
                        <div key={yearRow.year} className="slam-row">
                          <div className="slam-cell year-cell">{yearRow.year}</div>
                          {GRAND_SLAMS.map((slam) => {
                            const result = yearRow[slam.key];
                            return (
                              <TournamentResultPopover
                                key={slam.key}
                                playerId={playerId}
                                year={yearRow.year}
                                result={result}
                                slam={slam.key}
                                className={`slam-cell ${getSlamResultClass(result)}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="player-tab-block player-tab-block-secondary">
                  <h3 className="analytics-title">Grand Slam Analytics</h3>
                  <p className="player-tab-desc">
                    Career summary across all four majors — titles, deep runs and best result at each tournament.
                  </p>

                  <StatCards
                    items={[
                      { label: 'Titles', value: slamStats.titles, accent: true },
                      { label: 'Finals', value: slamStats.finals },
                      { label: 'Semi-finals+', value: slamStats.semis },
                      { label: 'Seasons played', value: slamStats.seasons },
                    ]}
                  />

                  <div className="player-breakdown-grid">
                    {slamStats.bySlam.map((slam) => (
                      <div key={slam.key} className="player-breakdown-card">
                        <div className="player-breakdown-header">
                          <div className="slam-icon-circle player-breakdown-icon">
                            <img src={slam.icon} alt={slam.label} />
                          </div>
                          <div>
                            <p className="player-breakdown-name">{slam.label}</p>
                            <p className="player-breakdown-meta">
                              {slam.appearances} appearances
                            </p>
                          </div>
                        </div>
                        <div className="player-breakdown-stats">
                          <div>
                            <span className="player-breakdown-stat-val">{slam.titles}</span>
                            <span className="player-breakdown-stat-lbl">Titles</span>
                          </div>
                          <div>
                            <span className={`player-breakdown-stat-val ${getSlamResultClass(slam.best)}`}>
                              {slam.best}
                            </span>
                            <span className="player-breakdown-stat-lbl">Best</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeTab === 'masters' && (
              <>
                <section className="player-tab-block">
                  <h3 className="analytics-title">ATP Masters 1000 Results</h3>
                  <ResultsLegend />

                  {mastersGroups.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 16px' }}>
                      <p className="empty-sub">No Masters 1000 results found</p>
                    </div>
                  ) : (
                    <div className="masters-groups">
                      {mastersGroups.map((group) => (
                        <div
                          key={`${group.startYear}-${group.endYear}`}
                          className="masters-era-block"
                        >
                          <p className="masters-era-label">
                            {formatEraLabel(group.startYear, group.endYear)}
                          </p>

                          <div className="slam-table masters-table">
                            <div
                              className="slam-row slam-header masters-row"
                              style={{ gridTemplateColumns: mastersGridColumns(group.tournaments.length) }}
                            >
                              <div className="slam-cell year-cell">Year</div>
                              {group.tournaments.map((name) => (
                                <div key={name} className="slam-cell masters-header-cell">
                                  {formatMastersLabel(name)}
                                </div>
                              ))}
                            </div>

                            {group.rows.map((yearRow) => (
                              <div
                                key={yearRow.year}
                                className="slam-row masters-row"
                                style={{ gridTemplateColumns: mastersGridColumns(group.tournaments.length) }}
                              >
                                <div className="slam-cell year-cell">{yearRow.year}</div>
                                {group.tournaments.map((name) => {
                                  const result = yearRow.results[name] ?? '—';
                                  return (
                                    <TournamentResultPopover
                                      key={name}
                                      playerId={playerId}
                                      year={yearRow.year}
                                      result={result}
                                      tourneyName={name}
                                      className={`slam-cell ${getSlamResultClass(result)}`}
                                    />
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="player-tab-block player-tab-block-secondary">
                  <h3 className="analytics-title">Masters Analytics</h3>
                  <p className="player-tab-desc">
                    Aggregated performance across ATP Masters 1000 events — titles, finals and breakdown by tournament.
                  </p>

                  <StatCards
                    items={[
                      { label: 'Titles', value: mastersStats.titles, accent: true },
                      { label: 'Finals', value: mastersStats.finals },
                      { label: 'Semi-finals+', value: mastersStats.semis },
                      { label: 'Events played', value: mastersStats.totalEvents },
                    ]}
                  />

                  {mastersStats.byTournament.length > 0 && (
                    <div className="player-tourney-list">
                      <p className="player-tourney-list-title">By tournament</p>
                      <div className="player-tourney-list-body">
                        {mastersStats.byTournament.map((t) => (
                          <div key={t.name} className="player-tourney-row">
                            <span className="player-tourney-name">{t.name}</span>
                            <span className="player-tourney-titles">
                              {t.titles > 0 ? `${t.titles}× W` : '—'}
                            </span>
                            <span className={`player-tourney-best ${getSlamResultClass(t.best)}`}>
                              {t.best}
                            </span>
                            <span className="player-tourney-apps">{t.appearances} apps</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
      </article>
    </div>
  );
}
