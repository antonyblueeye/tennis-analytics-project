'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ReactCountryFlag from 'react-country-flag';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { iocToAlpha2 } from '../lib/ioc';

countries.registerLocale(enLocale);

interface Match {
  id: number;
  tourney_id: string;
  tourney_name: string;
  surface: string | null;
  draw_size: string | null;
  tourney_level: string | null;
  tourney_date: string;
  match_num: string | null;
  round: string | null;
  score: string | null;
  best_of: string | null;
  minutes: string | null;
  winner_id: string | null;
  winner_seed: string | null;
  winner_entry: string | null;
  winner_name: string | null;
  winner_hand: string | null;
  winner_ht: string | null;
  winner_ioc: string | null;
  winner_age: string | null;
  winner_rank: string | null;
  winner_rank_points: string | null;
  loser_id: string | null;
  loser_seed: string | null;
  loser_entry: string | null;
  loser_name: string | null;
  loser_hand: string | null;
  loser_ht: string | null;
  loser_ioc: string | null;
  loser_age: string | null;
  loser_rank: string | null;
  loser_rank_points: string | null;
  w_ace: string | null;
  w_df: string | null;
  w_svpt: string | null;
  w_1stIn: string | null;
  w_1stWon: string | null;
  w_2ndWon: string | null;
  w_SvGms: string | null;
  w_bpSaved: string | null;
  w_bpFaced: string | null;
  l_ace: string | null;
  l_df: string | null;
  l_svpt: string | null;
  l_1stIn: string | null;
  l_1stWon: string | null;
  l_2ndWon: string | null;
  l_SvGms: string | null;
  l_bpSaved: string | null;
  l_bpFaced: string | null;
}

const SERVE_STATS: { key: keyof Match; label: string; wKey: keyof Match; lKey: keyof Match }[] = [
  { key: 'w_ace', label: 'Aces', wKey: 'w_ace', lKey: 'l_ace' },
  { key: 'w_df', label: 'Double faults', wKey: 'w_df', lKey: 'l_df' },
  { key: 'w_svpt', label: 'Serve points', wKey: 'w_svpt', lKey: 'l_svpt' },
  { key: 'w_1stIn', label: '1st serves in', wKey: 'w_1stIn', lKey: 'l_1stIn' },
  { key: 'w_1stWon', label: '1st serve pts won', wKey: 'w_1stWon', lKey: 'l_1stWon' },
  { key: 'w_2ndWon', label: '2nd serve pts won', wKey: 'w_2ndWon', lKey: 'l_2ndWon' },
  { key: 'w_SvGms', label: 'Serve games', wKey: 'w_SvGms', lKey: 'l_SvGms' },
  { key: 'w_bpSaved', label: 'Break points saved', wKey: 'w_bpSaved', lKey: 'l_bpSaved' },
  { key: 'w_bpFaced', label: 'Break points faced', wKey: 'w_bpFaced', lKey: 'l_bpFaced' },
];

function formatDate(raw: string | null) {
  if (!raw) return '—';
  const s = String(raw).replace(/\.0$/, '');
  if (s.length === 8) {
    const y = s.slice(0, 4);
    const m = s.slice(4, 6);
    const d = s.slice(6, 8);
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    if (!Number.isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return s;
}

function isMissing(val: string | null | undefined): boolean {
  if (val == null || val === '') return true;
  const s = String(val).trim().toLowerCase();
  return s === 'nan' || s === 'null' || s === 'undefined' || s === 'none';
}

function fmt(val: string | null) {
  if (isMissing(val)) return '—';
  const n = Number(val);
  return Number.isFinite(n) ? String(Math.round(n)) : '—';
}

function fmtMin(val: string | null) {
  if (isMissing(val)) return '—';
  const n = Number(val);
  return Number.isFinite(n) ? `${Math.round(n)}′` : '—';
}

function formatSeed(seed: string | null): string | null {
  if (isMissing(seed)) return null;
  const n = Number(seed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(Math.round(n));
}

function playerLabel(name: string | null, seed: string | null, entry: string | null) {
  if (!name) return '—';
  const parts = [name];
  const seedStr = formatSeed(seed);
  if (seedStr) parts.push(`[${seedStr}]`);
  if (entry && !isMissing(entry)) parts.push(`(${entry})`);
  return parts.join(' ');
}

function formatDateShort(raw: string | null) {
  if (!raw) return '—';
  const s = String(raw).replace(/\.0$/, '');
  if (s.length === 8) {
    const dt = new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)));
    if (!Number.isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return formatDate(raw);
}

function surfaceLetter(surface: string | null) {
  if (!surface) return '—';
  return surface.charAt(0).toUpperCase();
}

function surfaceClass(surface: string | null) {
  if (!surface) return '';
  return `match-surface-${surface.toLowerCase()}`;
}

function MatchModal({ match, onClose }: { match: Match; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal match-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="match-modal-head">
          <div>
            <p className="match-modal-tourney">{match.tourney_name}</p>
            <p className="match-modal-meta">
              {formatDate(match.tourney_date)}
              {match.round && <> · {match.round}</>}
              {match.surface && <> · {match.surface}</>}
              {match.minutes && <> · {fmtMin(match.minutes)}</>}
            </p>
          </div>
          {match.score && <p className="match-modal-score">{match.score}</p>}
        </div>

        <div className="match-modal-players">
          <div className="match-modal-player match-modal-player-winner">
            <span className="match-modal-player-badge">Winner</span>
            <div className="match-modal-player-row">
              {match.winner_ioc && iocToAlpha2(match.winner_ioc) && (
                <ReactCountryFlag
                  countryCode={iocToAlpha2(match.winner_ioc)!}
                  svg
                  style={{ width: '1.2em', height: '1.2em', borderRadius: '2px' }}
                />
              )}
              {match.winner_id ? (
                <Link href={`/players/${match.winner_id}`} className="match-modal-player-name">
                  {playerLabel(match.winner_name, match.winner_seed, match.winner_entry)}
                </Link>
              ) : (
                <span className="match-modal-player-name">
                  {playerLabel(match.winner_name, match.winner_seed, match.winner_entry)}
                </span>
              )}
            </div>
            {!isMissing(match.winner_rank) && (
              <p className="match-modal-player-sub">
                Rank #{fmt(match.winner_rank)}
                {!isMissing(match.winner_rank_points) && (
                  <> · {fmt(match.winner_rank_points)} pts</>
                )}
              </p>
            )}
          </div>

          <div className="match-modal-vs">vs</div>

          <div className="match-modal-player">
            <span className="match-modal-player-badge match-modal-player-badge-loser">Loser</span>
            <div className="match-modal-player-row">
              {match.loser_ioc && iocToAlpha2(match.loser_ioc) && (
                <ReactCountryFlag
                  countryCode={iocToAlpha2(match.loser_ioc)!}
                  svg
                  style={{ width: '1.2em', height: '1.2em', borderRadius: '2px' }}
                />
              )}
              {match.loser_id ? (
                <Link href={`/players/${match.loser_id}`} className="match-modal-player-name">
                  {playerLabel(match.loser_name, match.loser_seed, match.loser_entry)}
                </Link>
              ) : (
                <span className="match-modal-player-name">
                  {playerLabel(match.loser_name, match.loser_seed, match.loser_entry)}
                </span>
              )}
            </div>
            {!isMissing(match.loser_rank) && (
              <p className="match-modal-player-sub">
                Rank #{fmt(match.loser_rank)}
                {!isMissing(match.loser_rank_points) && (
                  <> · {fmt(match.loser_rank_points)} pts</>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="modal-divider" />

        <h4 className="match-modal-stats-title">Serve statistics</h4>
        <div className="match-stats-table">
          <div className="match-stats-header">
            <span>Stat</span>
            <span>Winner</span>
            <span>Loser</span>
          </div>
          {SERVE_STATS.map((row) => (
            <div key={row.label} className="match-stats-row">
              <span className="match-stats-label">{row.label}</span>
              <span className="match-stats-val match-stats-val-w">{fmt(match[row.wKey] as string)}</span>
              <span className="match-stats-val">{fmt(match[row.lKey] as string)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Match | null>(null);

  const [dateFilter, setDateFilter] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('');
  const [playerFilter, setPlayerFilter] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [appliedTournament, setAppliedTournament] = useState('');
  const [appliedPlayer, setAppliedPlayer] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
      });
      if (appliedDate.trim()) params.set('date', appliedDate.trim());
      if (appliedTournament.trim()) params.set('tournament', appliedTournament.trim());
      if (appliedPlayer.trim()) params.set('player', appliedPlayer.trim());

      const res = await fetch(`http://127.0.0.1:8000/api/matches?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setMatches(json.results || []);
      setTotal(json.total ?? 0);
      setTotalPages(json.total_pages ?? 0);
    } catch (err) {
      console.error(err);
      setError(true);
      setMatches([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedDate, appliedTournament, appliedPlayer]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleSearch = () => {
    setPage(1);
    setAppliedDate(dateFilter);
    setAppliedTournament(tournamentFilter);
    setAppliedPlayer(playerFilter);
  };

  const handleClear = () => {
    setDateFilter('');
    setTournamentFilter('');
    setPlayerFilter('');
    setAppliedDate('');
    setAppliedTournament('');
    setAppliedPlayer('');
    setPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const hasFilters = appliedDate || appliedTournament || appliedPlayer;

  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-tag">🎾 Matches</div>
        <h1 className="hero-title">
          Recent <span>Matches</span>
        </h1>
        <p className="hero-subtitle">
          Latest ATP tour results with serve stats. Click a row for the full breakdown.
        </p>

        <div className="matches-search">
          <div className="matches-search-field">
            <label htmlFor="match-date">Date</label>
            <input
              id="match-date"
              type="text"
              className="matches-search-input"
              placeholder="2024 or 2024-06-10"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <div className="matches-search-field">
            <label htmlFor="match-tournament">Tournament</label>
            <input
              id="match-tournament"
              type="text"
              className="matches-search-input"
              placeholder="Wimbledon, Indian Wells…"
              value={tournamentFilter}
              onChange={(e) => setTournamentFilter(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <div className="matches-search-field">
            <label htmlFor="match-player">Player</label>
            <input
              id="match-player"
              type="text"
              className="matches-search-input"
              placeholder="Djokovic, Alcaraz…"
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <div className="matches-search-actions">
            <button type="button" className="matches-search-btn" onClick={handleSearch}>
              Search
            </button>
            {hasFilters && (
              <button type="button" className="matches-search-clear" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading matches…</span>
        </div>
      ) : error ? (
        <div className="empty-state">
          <span className="empty-icon">🎾</span>
          <p className="empty-title">Could not load matches</p>
          <p className="empty-sub">Make sure the backend is running on port 8000</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎾</span>
          <p className="empty-title">No matches found</p>
          {hasFilters && (
            <p className="empty-sub">Try adjusting your search filters</p>
          )}
        </div>
      ) : (
        <div className="matches-results">
        <div className="matches-table-wrap">
          <table className="matches-table">
            <thead>
              <tr>
                <th className="col-date">Date</th>
                <th className="col-tourney">Tournament</th>
                <th className="col-rd">Rd</th>
                <th className="col-player">Winner</th>
                <th className="col-score">Score</th>
                <th className="col-player">Loser</th>
                <th className="col-surf">S</th>
                <th className="col-min">′</th>
                <th className="col-stat">Ace</th>
                <th className="col-stat">DF</th>
                <th className="col-stat">1st</th>
                <th className="col-stat">BP</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr
                  key={m.id}
                  className="matches-row"
                  onClick={() => setSelected(m)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelected(m)}
                >
                  <td className="matches-date col-date">{formatDateShort(m.tourney_date)}</td>
                  <td className="matches-tourney col-tourney">
                    <span title={m.tourney_name ?? ''}>{m.tourney_name}</span>
                    {m.tourney_level && (
                      <span className="matches-level">{m.tourney_level}</span>
                    )}
                  </td>
                  <td className="col-rd">{m.round ?? '—'}</td>
                  <td className="matches-player matches-winner col-player" title={m.winner_name ?? ''}>
                    {playerLabel(m.winner_name, m.winner_seed, null)}
                  </td>
                  <td className="matches-score col-score">{m.score ?? '—'}</td>
                  <td className="matches-player col-player" title={m.loser_name ?? ''}>
                    {playerLabel(m.loser_name, m.loser_seed, null)}
                  </td>
                  <td className="col-surf">
                    <span
                      className={`match-surface-pill ${surfaceClass(m.surface)}`}
                      title={m.surface ?? ''}
                    >
                      {surfaceLetter(m.surface)}
                    </span>
                  </td>
                  <td className="col-min">{fmtMin(m.minutes)}</td>
                  <td className="matches-pair col-stat">{fmt(m.w_ace)}–{fmt(m.l_ace)}</td>
                  <td className="matches-pair col-stat">{fmt(m.w_df)}–{fmt(m.l_df)}</td>
                  <td className="matches-pair col-stat">{fmt(m.w_1stIn)}–{fmt(m.l_1stIn)}</td>
                  <td className="matches-pair col-stat">{fmt(m.w_bpSaved)}–{fmt(m.l_bpSaved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="matches-pagination">
          <p className="matches-pagination-info">
            {total === 0
              ? 'No matches'
              : `${rangeStart}–${rangeEnd} of ${total.toLocaleString()} matches`}
          </p>
          <div className="matches-pagination-controls">
            <button
              type="button"
              className="matches-page-btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </button>
            <span className="matches-page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="matches-page-btn"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
        </div>
      )}

      {selected && <MatchModal match={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
