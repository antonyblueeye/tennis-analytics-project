'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactCountryFlag from 'react-country-flag';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { API_BASE } from '@/lib/api';
import { iocToAlpha2, iocToName } from '../lib/ioc';
import { getPlayerImage } from '../lib/wiki';

countries.registerLocale(enLocale);

interface Player {
  player_id: number | string;
  name_first: string;
  name_last: string;
  hand: string | null;
  height: number | null;
  ioc: string | null;
  wikidata_id: string | null;
}

interface TopPlayer {
  player_id: number | string;
  name_first: string;
  name_last: string;
  wikidata_id: string | null;
  rank: number;
  points: number;
}

const BUBBLE_COUNT = 20;

function shufflePick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function getInitials(first: string | null, last: string | null) {
  const f = first ? first.charAt(0) : '';
  const l = last ? last.charAt(0) : '';
  return `${f}${l}`.toUpperCase() || '🎾';
}

function pluralResults(n: number) {
  return n === 1 ? '1 player found' : `${n} players found`;
}

export default function PlayersPage() {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});

  const [featured, setFeatured] = useState<TopPlayer[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [bubbleImages, setBubbleImages] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch(`${API_BASE}/api/players/rankings/top?limit=100`);
        if (!res.ok) throw new Error('Failed to fetch top rankings');
        const data = await res.json();
        const top: TopPlayer[] = data.results || [];
        const picked = shufflePick(top, BUBBLE_COUNT);
        setFeatured(picked);

        picked.forEach(async (player) => {
          const fullName = `${player.name_first} ${player.name_last}`;
          const imgUrl = await getPlayerImage(player.wikidata_id, fullName);
          if (imgUrl) {
            setBubbleImages((prev) => ({ ...prev, [String(player.player_id)]: imgUrl }));
          }
        });
      } catch (err) {
        console.error(err);
        setFeatured([]);
      } finally {
        setFeaturedLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_BASE}/api/players/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results: Player[] = data.results || [];
      setPlayers(results);

      results.forEach(async (player) => {
        const fullName = `${player.name_first} ${player.name_last}`;
        const imgUrl = await getPlayerImage(player.wikidata_id, fullName);
        if (imgUrl) {
          setImages((prev) => ({ ...prev, [String(player.player_id)]: imgUrl }));
        }
      });
    } catch (err) {
      console.error(err);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-tag">Database Search</div>
        <h1 className="hero-title">
          Search <span>Players</span>
        </h1>
        <p className="hero-subtitle">
          Search by first name, last name, or nationality. Browse bios, stats and historical metrics.
        </p>

        <div className="search-wrap">
          <span className="search-icon" aria-hidden>🔍</span>
          <input
            id="player-search-input"
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a player's name..."
            autoComplete="off"
          />
          <button
            id="player-search-btn"
            className="search-btn"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        <div className="player-bubbles-section">
          <p className="player-bubbles-label">Quick picks from the top 100</p>
          {featuredLoading ? (
            <div className="player-bubbles player-bubbles-loading">
              {Array.from({ length: BUBBLE_COUNT }).map((_, i) => (
                <div key={i} className="player-bubble player-bubble-skeleton" aria-hidden />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="player-bubbles">
              {featured.map((player) => {
                const fullName = `${player.name_first} ${player.name_last}`;
                const imgUrl = bubbleImages[String(player.player_id)];
                return (
                  <Link
                    key={player.player_id}
                    href={`/players/${player.player_id}`}
                    className="player-bubble"
                    title={`${fullName} · #${player.rank}`}
                  >
                    <div className="player-bubble-avatar-wrap">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={fullName}
                          className="player-bubble-avatar"
                        />
                      ) : (
                        <div className="player-bubble-avatar player-bubble-avatar-fallback">
                          {getInitials(player.name_first, player.name_last)}
                        </div>
                      )}
                      <span className="player-bubble-rank">#{player.rank}</span>
                    </div>
                    <span className="player-bubble-name">{player.name_last}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      {(loading || searched) && (
        <section className="results-section">
          {loading ? (
            <div className="loading-wrap">
              <div className="spinner" />
              <span>Searching players…</span>
            </div>
          ) : players.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎾</span>
              <p className="empty-title">No players found</p>
              <p className="empty-sub">Try a different name or spelling</p>
            </div>
          ) : (
            <>
              <div className="results-header">
                <span className="results-title">Search results</span>
                <span className="results-count">{pluralResults(players.length)}</span>
              </div>
              <ul className="player-list" role="list">
                {players.map((player) => {
                  const countryName = iocToName(player.ioc, countries.getName.bind(countries));
                  const countryCode = iocToAlpha2(player.ioc);
                  const imageUrl = images[String(player.player_id)];

                  return (
                    <li key={player.player_id}>
                      <Link
                        href={`/players/${player.player_id}`}
                        className="player-item"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${player.name_first} ${player.name_last}`}
                            className="player-avatar"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="player-avatar">
                            {getInitials(player.name_first, player.name_last)}
                          </div>
                        )}

                        <div className="player-info">
                          <div className="player-name">
                            {player.name_first} {player.name_last}
                          </div>
                          <div className="player-meta">
                            {countryName || 'Country unknown'}
                            {player.height ? ` · ${player.height} cm` : ''}
                          </div>
                        </div>
                        {countryCode && (
                          <ReactCountryFlag
                            countryCode={countryCode}
                            svg
                            style={{ width: '1.4em', height: '1.4em', borderRadius: '3px' }}
                            title={player.ioc || ''}
                          />
                        )}
                        <span className="player-arrow" aria-hidden>›</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}
