'use client';

import { useState, useEffect } from 'react';
import ReactCountryFlag from 'react-country-flag';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { iocToAlpha2, iocToName } from './lib/ioc';
import { getWikiImage } from './lib/wiki';

countries.registerLocale(enLocale);

interface Player {
  player_id: number;
  name_first: string;
  name_last: string;
  hand: string | null;
  height: number | null;
  ioc: string | null;
}

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

function pluralResults(n: number) {
  return n === 1 ? '1 player found' : `${n} players found`;
}

const STATS = [
  { value: '500K+', label: 'Matches' },
  { value: '60+',   label: 'Years of Data' },
  { value: '50K+',  label: 'Players' },
  { value: '200+',  label: 'Tournaments' },
];

export default function Home() {
  const [query, setQuery]               = useState('');
  const [players, setPlayers]           = useState<Player[]>([]);
  const [loading, setLoading]           = useState(false);
  const [searched, setSearched]         = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  // Кэш для хранения URL фотографий игроков с Wikipedia
  const [images, setImages] = useState<Record<number, string>>({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res  = await fetch(`http://127.0.0.1:8000/api/players/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results: Player[] = data.results || [];
      setPlayers(results);
      
      // Начинаем асинхронно загружать фотки для найденных игроков
      results.forEach(async (player) => {
        const fullName = `${player.name_first} ${player.name_last}`;
        const imgUrl = await getWikiImage(fullName);
        if (imgUrl) {
          setImages(prev => ({ ...prev, [player.player_id]: imgUrl }));
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
      {/* Hero */}
      <section className="hero">
        <div className="hero-tag">🎾 ATP · WTA · ITF</div>
        <h1 className="hero-title">
          Tennis Analytics<br />
          <span>at the next level</span>
        </h1>
        <p className="hero-subtitle">
          Stats on 50,000+ professional players spanning 60 years.
          Search by name, browse tournaments and rankings.
        </p>

        {/* Search */}
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

        {/* Stats — hidden after first search */}
        {!searched && (
          <div className="stats-row">
            {STATS.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-value">
                  {s.value.replace(/\+/, '')}<span>+</span>
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Results */}
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
                  const imageUrl = images[player.player_id];
                  
                  return (
                    <li
                      key={player.player_id}
                      className="player-item"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedPlayer(player)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedPlayer(player)}
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
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      )}

      {/* Modal */}
      {selectedPlayer && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Profile of ${selectedPlayer.name_first} ${selectedPlayer.name_last}`}
          onClick={(e) => e.target === e.currentTarget && setSelectedPlayer(null)}
        >
          <div className="modal" style={{ padding: '24px', overflow: 'hidden' }}>
            <button
              className="modal-close"
              onClick={() => setSelectedPlayer(null)}
              aria-label="Close"
              style={{ zIndex: 10 }}
            >
              ✕
            </button>

            {/* Карточка-баннер с фотографией */}
            {images[selectedPlayer.player_id] ? (
              <div 
                style={{ 
                  position: 'relative', 
                  width: 'calc(100% + 48px)', 
                  height: '240px', 
                  margin: '-24px -24px 20px -24px',
                  background: '#f8fafc',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Размытый задний фон для заполнения пустот */}
                <div 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${images[selectedPlayer.player_id]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(20px) brightness(0.95)',
                    opacity: 0.45,
                    transform: 'scale(1.1)'
                  }}
                />
                
                {/* Оригинальное изображение без обрезки */}
                <img 
                  src={images[selectedPlayer.player_id]} 
                  alt={`${selectedPlayer.name_first} ${selectedPlayer.name_last}`}
                  style={{ 
                    position: 'relative',
                    maxHeight: '100%', 
                    maxWidth: '100%',
                    objectFit: 'contain',
                    zIndex: 2
                  }}
                />
              </div>
            ) : (
              <div 
                className="modal-avatar" 
                style={{ 
                  margin: '0 auto 20px auto',
                  width: '72px',
                  height: '72px',
                  fontSize: '28px'
                }}
              >
                {getInitials(selectedPlayer.name_first, selectedPlayer.name_last)}
              </div>
            )}

            <h2 className="modal-name" style={{ textAlign: 'center', marginBottom: '20px' }}>
              {selectedPlayer.name_first} {selectedPlayer.name_last}
            </h2>

            <div className="modal-divider" />

            <div className="modal-fields">
              <div className="modal-field">
                <span className="modal-field-icon">🖐</span>
                <span className="modal-field-label">Playing hand</span>
                <span className="modal-field-value">
                  {selectedPlayer.hand
                    ? handLabel[selectedPlayer.hand] || selectedPlayer.hand
                    : '—'}
                </span>
              </div>
              <div className="modal-field">
                <span className="modal-field-icon">📏</span>
                <span className="modal-field-label">Height</span>
                <span className="modal-field-value">
                  {selectedPlayer.height ? `${selectedPlayer.height} cm` : '—'}
                </span>
              </div>
              <div className="modal-field">
                <span className="modal-field-icon">🌍</span>
                <span className="modal-field-label">Country</span>
                <span className="modal-field-value">
                  {iocToName(selectedPlayer.ioc, countries.getName.bind(countries)) || '—'}
                  {iocToAlpha2(selectedPlayer.ioc) && (
                    <ReactCountryFlag
                      countryCode={iocToAlpha2(selectedPlayer.ioc)!}
                      svg
                      style={{ width: '1.4em', height: '1.4em', borderRadius: '3px' }}
                      title={selectedPlayer.ioc || ''}
                    />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}