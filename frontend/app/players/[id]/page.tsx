'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactCountryFlag from 'react-country-flag';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { iocToAlpha2, iocToName } from '../../lib/ioc';
import { getWikiImage } from '../../lib/wiki';

countries.registerLocale(enLocale);

interface Player {
  player_id: number | string;
  name_first: string;
  name_last: string;
  hand: string | null;
  height: number | string | null;
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

function formatHeight(height: number | string | null) {
  if (height == null || height === '') return '—';
  const n = Number(height);
  return Number.isFinite(n) ? `${Math.round(n)} cm` : `${height} cm`;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = Number(params.id);

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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

        const fullName = `${data.name_first} ${data.name_last}`;
        const img = await getWikiImage(fullName);
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

        <div className="player-profile-analytics" />
      </article>
    </div>
  );
}
