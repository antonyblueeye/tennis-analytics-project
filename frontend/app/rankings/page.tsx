'use client';

import { useEffect, useState } from 'react';
import { getPlayerImage } from '../lib/wiki';

type RankingPlayer = {
  player_id: number | string;
  rank: number;
  name_first: string;
  name_last: string;
  points: number;
  ranking_date: string;
  wikidata_id: string | null;
};

function getInitials(first: string, last: string) {
  const f = first?.charAt(0) ?? '';
  const l = last?.charAt(0) ?? '';
  return `${f}${l}`.toUpperCase() || '?';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function rankBadgeClass(rank: number) {
  if (rank === 1) return 'rank-badge top-1';
  if (rank === 2) return 'rank-badge top-2';
  if (rank === 3) return 'rank-badge top-3';
  return 'rank-badge';
}

export default function RankingsPage() {
  const [data, setData] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchRankings() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/players/rankings/top?limit=100');
        if (!res.ok) throw new Error('Failed to fetch rankings');
        const json = await res.json();
        const results: RankingPlayer[] = json?.results ?? [];
        setData(results);

        results.forEach(async (player) => {
          const fullName = `${player.name_first} ${player.name_last}`;
          const imgUrl = await getPlayerImage(player.wikidata_id, fullName);
          if (imgUrl) {
            setImages((prev) => ({ ...prev, [String(player.player_id)]: imgUrl }));
          }
        });
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchRankings();
  }, []);

  const snapshotDate = data[0]?.ranking_date;

  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-tag">Rankings</div>
        <h1 className="hero-title">
          ATP <span>Top 100</span>
        </h1>
        <p className="hero-subtitle">
          Official singles standings for the latest available ranking week.
          {snapshotDate && !loading && (
            <> Updated as of {formatDate(snapshotDate)}.</>
          )}
        </p>
      </section>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading rankings…</span>
        </div>
      ) : error ? (
        <div className="empty-state">
          <span className="empty-icon">📈</span>
          <p className="empty-title">Could not load rankings</p>
          <p className="empty-sub">Make sure the backend is running on port 8000</p>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📈</span>
          <p className="empty-title">No ranking data yet</p>
          <p className="empty-sub">Import ATP rankings into the database first</p>
        </div>
      ) : (
        <section className="results-section rankings-section">
          <div className="results-header">
            <span className="results-title">Singles — Top {data.length}</span>
            <span className="results-count">{formatDate(snapshotDate)}</span>
          </div>

          <div className="rankings-table-wrap">
            <table className="rankings-table">
              <thead>
                <tr>
                  <th className="col-rank">Rank</th>
                  <th>Player</th>
                  <th className="col-points">Points</th>
                  <th className="col-date">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => {
                  const fullName = `${p.name_first} ${p.name_last}`;
                  const imageUrl = images[String(p.player_id)];

                  return (
                    <tr key={p.player_id}>
                      <td>
                        <span className={rankBadgeClass(p.rank)}>{p.rank}</span>
                      </td>
                      <td>
                        <div className="rankings-player-cell">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={fullName}
                              className="player-avatar"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="player-avatar">
                              {getInitials(p.name_first, p.name_last)}
                            </div>
                          )}
                          <span className="rankings-player-name">{fullName}</span>
                        </div>
                      </td>
                      <td className="rankings-points">
                        {p.points.toLocaleString()}
                      </td>
                      <td className="rankings-date col-date">
                        {formatDate(p.ranking_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
