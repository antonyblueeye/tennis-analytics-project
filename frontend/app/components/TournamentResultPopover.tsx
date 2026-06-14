'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface TournamentMatch {
  round: string;
  opponent: string;
  score: string;
  won: boolean;
}

interface TournamentMatchesResponse {
  tournament: string;
  year: number;
  matches: TournamentMatch[];
}

const cache = new Map<string, TournamentMatchesResponse>();

export function isResultInteractive(result: string) {
  return result !== '—' && result !== 'N/T' && result !== '···';
}

interface Props {
  playerId: number;
  year: number;
  result: string;
  className?: string;
  slam?: string;
  tourneyName?: string;
}

interface PopoverPos {
  left: number;
  top: number;
  placement: 'above' | 'below';
}

function cacheKey(playerId: number, year: number, slam?: string, tourneyName?: string) {
  return `${playerId}:${year}:${slam ?? ''}:${tourneyName ?? ''}`;
}

export default function TournamentResultPopover({
  playerId,
  year,
  result,
  className = '',
  slam,
  tourneyName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TournamentMatchesResponse | null>(null);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PopoverPos>({ left: 0, top: 0, placement: 'above' });

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const interactive = isResultInteractive(result);

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const popoverH = popover?.offsetHeight ?? 320;
    const popoverW = popover?.offsetWidth ?? 480;
    const gap = 10;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement =
      spaceAbove >= popoverH + gap || spaceAbove >= spaceBelow ? 'above' : 'below';

    let left = rect.left + rect.width / 2;
    const halfW = popoverW / 2;
    left = Math.max(12 + halfW, Math.min(window.innerWidth - 12 - halfW, left));

    const top = placement === 'above' ? rect.top - gap : rect.bottom + gap;

    setPos({ left, top, placement });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, data, loading, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updatePosition]);

  const fetchMatches = useCallback(async () => {
    const key = cacheKey(playerId, year, slam, tourneyName);
    const cached = cache.get(key);
    if (cached) {
      setData(cached);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ year: String(year) });
      if (slam) params.set('slam', slam);
      if (tourneyName) params.set('tourney_name', tourneyName);

      const res = await fetch(
        `http://127.0.0.1:8000/api/players/${playerId}/tournament-matches?${params}`
      );
      if (!res.ok) throw new Error('fetch failed');
      const json: TournamentMatchesResponse = await res.json();
      cache.set(key, json);
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [playerId, year, slam, tourneyName]);

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    updatePosition();
    setOpen(true);
    if (!data && !loading) fetchMatches();
  };

  const hide = () => {
    hideTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const popoverContent = open ? (
    <div
      ref={popoverRef}
      className={`tourney-result-popover tourney-result-popover-portal tourney-result-popover-${pos.placement}`}
      style={{
        left: pos.left,
        top: pos.top,
      }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <div className="tourney-result-popover-head">
        <p className="tourney-result-popover-title">
          {data?.tournament ?? (tourneyName || slam?.toUpperCase())}
        </p>
        <p className="tourney-result-popover-year">{year}</p>
      </div>

      {loading && <p className="tourney-result-popover-msg">Loading…</p>}
      {error && <p className="tourney-result-popover-msg">Could not load matches</p>}
      {!loading && !error && data?.matches.length === 0 && (
        <p className="tourney-result-popover-msg">No match data</p>
      )}

      {data && data.matches.length > 0 && (
        <div className="tourney-result-popover-list">
          {data.matches.map((m, i) => (
            <div
              key={`${m.round}-${i}`}
              className={`tourney-result-popover-row${m.won ? '' : ' tourney-result-popover-row-loss'}`}
            >
              <span className="tourney-result-popover-round">{m.round}</span>
              <span className="tourney-result-popover-opponent">{m.opponent}</span>
              <span className="tourney-result-popover-score">{m.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;

  if (!interactive) {
    return <div className={className}>{result}</div>;
  }

  return (
    <>
      <div
        ref={anchorRef}
        className={`tourney-result-cell-wrap ${className}`}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <span className="tourney-result-cell">{result}</span>
      </div>

      {mounted && popoverContent
        ? createPortal(popoverContent, document.body)
        : null}
    </>
  );
}
