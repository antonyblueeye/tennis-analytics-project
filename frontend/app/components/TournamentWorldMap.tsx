'use client';

import { useMemo } from 'react';
import type { DashboardTournament } from '../lib/dashboardTournaments';
import TournamentTooltip from './TournamentTooltip';

const MAP_W = 1000;
const MAP_H = 500;

const SKIP_REGIONS = new Set(['Antarctica', 'French Southern and Antarctic Lands']);

type GeoFeature = {
  type: 'Feature';
  properties: { name?: string };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
};

export type GeoCollection = {
  type: 'FeatureCollection';
  features: GeoFeature[];
};

function project(lng: number, lat: number) {
  return {
    x: ((lng + 180) / 360) * MAP_W,
    y: ((90 - lat) / 180) * MAP_H,
  };
}

function ringToPath(ring: number[][]) {
  return ring
    .map(([lng, lat], i) => {
      const { x, y } = project(lng, lat);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ')
    .concat(' Z');
}

function featureToPaths(feature: GeoFeature): string[] {
  const { geometry } = feature;
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates as number[][][]).map(ringToPath);
  }
  return (geometry.coordinates as number[][][][]).flatMap((poly) => poly.map(ringToPath));
}

function levelClass(level: string) {
  if (level === 'GS') return 'dash-map-marker-gs';
  if (level === 'M1000') return 'dash-map-marker-m1000';
  if (level === '500') return 'dash-map-marker-500';
  return 'dash-map-marker-250';
}

interface Props {
  tournaments: DashboardTournament[];
  hovered: DashboardTournament | null;
  showTooltip: boolean;
  onHover: (t: DashboardTournament | null) => void;
  worldGeo: GeoCollection;
}

export default function TournamentWorldMap({
  tournaments,
  hovered,
  showTooltip,
  onHover,
  worldGeo,
}: Props) {
  const landPaths = useMemo(() => {
    return worldGeo.features
      .filter((f) => !SKIP_REGIONS.has(f.properties.name ?? ''))
      .flatMap(featureToPaths);
  }, [worldGeo]);

  const markers = useMemo(
    () =>
      tournaments.map((t) => ({
        ...t,
        ...project(t.lng, t.lat),
      })),
    [tournaments]
  );

  return (
    <div className="dash-world-map">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="dash-world-map-svg"
        role="img"
        aria-label="World map of tournament host cities"
      >
        <defs>
          <linearGradient id="dash-ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dce8f4" />
            <stop offset="100%" stopColor="#c5d6ea" />
          </linearGradient>
        </defs>

        <rect width={MAP_W} height={MAP_H} fill="url(#dash-ocean)" rx="12" />

        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = project(0, lat).y;
          return (
            <line
              key={`lat-${lat}`}
              x1={0}
              y1={y}
              x2={MAP_W}
              y2={y}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={0.8}
            />
          );
        })}
        {[-120, -60, 0, 60, 120].map((lng) => {
          const x = project(lng, 0).x;
          return (
            <line
              key={`lng-${lng}`}
              x1={x}
              y1={0}
              x2={x}
              y2={MAP_H}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={0.8}
            />
          );
        })}

        <g className="dash-world-land">
          {landPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {markers.map((t) => {
          const isActive = hovered?.name === t.name && hovered?.date === t.date;
          return (
            <g key={t.name + t.date}>
              {isActive && (
                <circle cx={t.x} cy={t.y} r={14} className="dash-map-pulse" />
              )}
              <circle
                cx={t.x}
                cy={t.y}
                r={isActive ? 7 : 5.5}
                className={`dash-map-marker ${levelClass(t.level)} ${isActive ? 'dash-map-marker-active' : ''}`}
                onMouseEnter={() => onHover(t)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(t)}
                onBlur={() => onHover(null)}
                tabIndex={0}
                role="button"
                aria-label={`${t.name}, ${t.city}, winner ${t.winner}`}
              />
            </g>
          );
        })}
      </svg>

      {showTooltip && hovered && (() => {
        const { x, y } = project(hovered.lng, hovered.lat);
        return (
          <div
            className="dash-map-pin-tooltip dash-timeline-tooltip"
            style={{
              left: `${(x / MAP_W) * 100}%`,
              top: `${(y / MAP_H) * 100}%`,
            }}
          >
            <TournamentTooltip t={hovered} />
          </div>
        );
      })()}
    </div>
  );
}
