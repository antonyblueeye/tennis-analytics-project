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

countries.registerLocale(enLocale);

const GRAND_SLAM_ICONS = {
  ao: '/australian-open.png',
  rg: '/roland-garros.png',
  w: '/wimbledon.png',
  us: '/us-open.svg',
} as const;

type SlamKey = keyof typeof GRAND_SLAM_ICONS;

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

const GRAND_SLAMS: { key: SlamKey; label: string; icon: string }[] = [
  { key: 'ao', label: 'Australian Open', icon: GRAND_SLAM_ICONS.ao },
  { key: 'rg', label: 'Roland Garros', icon: GRAND_SLAM_ICONS.rg },
  { key: 'w', label: 'Wimbledon', icon: GRAND_SLAM_ICONS.w },
  { key: 'us', label: 'US Open', icon: GRAND_SLAM_ICONS.us },
];

const handLabel: Record<string, string> = {
  R: 'Right',
  L: 'Left',
  U: 'Unknown',
};

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

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = Number(params.id);

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([]);
  const [grandSlamData, setGrandSlamData] = useState<GrandSlamResult[]>([]);

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
        }

        const slamRes = await fetch(
          `http://127.0.0.1:8000/api/players/${playerId}/grand-slams`
        );
        if (slamRes.ok) {
          const slamData = await slamRes.json();
          setGrandSlamData(slamData.results || []);
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
        <div className="player-profile-header">
          <div className="player-profile-photo">
            {imageUrl ? (
              <img src={imageUrl} alt={fullName} />
            ) : (
              <div className="player-profile-photo-fallback">
                {getInitials(player.name_first, player.name_last)}
              </div>
            )}
          </div>

          <div className="player-profile-info">
            <h1 className="player-profile-name">{fullName}</h1>
            <p className="player-profile-id">ATP ID · {player.player_id}</p>

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

        <div className="player-profile-analytics">
          {rankingHistory.length > 0 && (
            <RankingHistoryChart data={rankingHistory} />
          )}

          <div className="analytics-card">
            <h3 className="analytics-title">Grand Slam Results</h3>

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
            </div>

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
                        <div
                          key={slam.key}
                          className={`slam-cell ${getSlamResultClass(result)}`}
                        >
                          {result}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
