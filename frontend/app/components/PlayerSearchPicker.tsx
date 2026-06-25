'use client';

import { useEffect, useRef, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { API_BASE } from '@/lib/api';
import { iocToAlpha2 } from '../lib/ioc';

countries.registerLocale(enLocale);

export interface PickedPlayer {
  player_id: string | number;
  name_first: string;
  name_last: string;
  hand: string | null;
  height: number | null;
  ioc: string | null;
}

interface PlayerSearchPickerProps {
  label: string;
  accent: 'a' | 'b';
  value: PickedPlayer | null;
  onChange: (player: PickedPlayer | null) => void;
  excludeId?: string | number | null;
}

function fullName(p: PickedPlayer) {
  return `${p.name_first} ${p.name_last}`.trim();
}

export default function PlayerSearchPicker({
  label,
  accent,
  value,
  onChange,
  excludeId,
}: PlayerSearchPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickedPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/players/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        const list: PickedPlayer[] = (data.results || []).filter(
          (p: PickedPlayer) => String(p.player_id) !== String(excludeId ?? '')
        );
        setResults(list);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query, excludeId]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handlePick = (p: PickedPlayer) => {
    onChange(p);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
  };

  return (
    <div className={`h2h-picker h2h-picker-${accent}`} ref={wrapRef}>
      <label className="h2h-picker-label">{label}</label>

      {value ? (
        <div className="h2h-picker-selected">
          {value.ioc && iocToAlpha2(value.ioc) && (
            <ReactCountryFlag
              countryCode={iocToAlpha2(value.ioc)!}
              svg
              style={{ width: '1.25em', height: '1.25em', borderRadius: '2px', flexShrink: 0 }}
            />
          )}
          <span className="h2h-picker-name">{fullName(value)}</span>
          <button type="button" className="h2h-picker-clear" onClick={handleClear} aria-label="Clear">
            ✕
          </button>
        </div>
      ) : (
        <div className="h2h-picker-input-wrap">
          <input
            type="text"
            className="h2h-picker-input"
            placeholder="Search player…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            autoComplete="off"
          />
          {loading && <span className="h2h-picker-spinner" aria-hidden />}
          {open && results.length > 0 && (
            <ul className="h2h-picker-dropdown" role="listbox">
              {results.slice(0, 8).map((p) => (
                <li key={String(p.player_id)}>
                  <button
                    type="button"
                    className="h2h-picker-option"
                    onClick={() => handlePick(p)}
                  >
                    {p.ioc && iocToAlpha2(p.ioc) && (
                      <ReactCountryFlag
                        countryCode={iocToAlpha2(p.ioc)!}
                        svg
                        style={{ width: '1.1em', height: '1.1em', borderRadius: '2px' }}
                      />
                    )}
                    <span>{fullName(p)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
