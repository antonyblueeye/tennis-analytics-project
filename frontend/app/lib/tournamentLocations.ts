export interface TournamentLocation {
  city: string;
  lat: number;
  lng: number;
}

/** Stable venue codes (YYYY-{code}) → host city coordinates. */
const BY_CODE: Record<string, TournamentLocation> = {
  '0301': { city: 'Auckland', lat: -36.8509, lng: 174.7645 },
  '0308': { city: 'Munich', lat: 48.1351, lng: 11.582 },
  '0311': { city: 'London', lat: 51.4872, lng: -0.2147 },
  '0314': { city: 'Gstaad', lat: 46.472, lng: 7.2865 },
  '0316': { city: 'Bastad', lat: 56.429, lng: 12.845 },
  '0319': { city: 'Kitzbuhel', lat: 47.446, lng: 12.391 },
  '0321': { city: 'Stuttgart', lat: 48.7758, lng: 9.1829 },
  '0322': { city: 'Geneva', lat: 46.2044, lng: 6.1432 },
  '0328': { city: 'Basel', lat: 47.5596, lng: 7.5886 },
  '0329': { city: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  '0337': { city: 'Vienna', lat: 48.2082, lng: 16.3738 },
  '0341': { city: 'Metz', lat: 49.1193, lng: 6.1757 },
  '0352': { city: 'Paris', lat: 48.8566, lng: 2.3522 },
  '0360': { city: 'Marrakech', lat: 31.6295, lng: -7.9811 },
  '0375': { city: 'Montpellier', lat: 43.6108, lng: 3.8767 },
  '0403': { city: 'Miami', lat: 25.7617, lng: -80.1918 },
  '0404': { city: 'Indian Wells', lat: 33.7206, lng: -116.3405 },
  '0407': { city: 'Rotterdam', lat: 51.9244, lng: 4.4777 },
  '0410': { city: 'Monte Carlo', lat: 43.7384, lng: 7.4246 },
  '0414': { city: 'Hamburg', lat: 53.5511, lng: 9.9937 },
  '0416': { city: 'Rome', lat: 41.9028, lng: 12.4964 },
  '0418': { city: 'Washington', lat: 38.9072, lng: -77.0369 },
  '0421': { city: 'Montreal', lat: 45.5017, lng: -73.5673 },
  '0422': { city: 'Cincinnati', lat: 39.1031, lng: -84.512 },
  '0424': { city: 'Dallas', lat: 32.7767, lng: -96.797 },
  '0425': { city: 'Barcelona', lat: 41.3874, lng: 2.1686 },
  '0429': { city: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  '0439': { city: 'Umag', lat: 45.431, lng: 13.522 },
  '0440': { city: "'s-Hertogenbosch", lat: 51.6978, lng: 5.3037 },
  '0451': { city: 'Doha', lat: 25.2854, lng: 51.531 },
  '0495': { city: 'Dubai', lat: 25.2048, lng: 55.2708 },
  '0496': { city: 'Marseille', lat: 43.2965, lng: 5.3698 },
  '0499': { city: 'Delray Beach', lat: 26.4615, lng: -80.0728 },
  '0500': { city: 'Halle', lat: 52.0302, lng: 8.5325 },
  '0506': { city: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  '0605': { city: 'Turin', lat: 45.0703, lng: 7.6869 },
  '0717': { city: 'Houston', lat: 29.7604, lng: -95.3698 },
  '0741': { city: 'Eastbourne', lat: 50.768, lng: 0.2905 },
  '0747': { city: 'Beijing', lat: 39.9042, lng: 116.4074 },
  '0807': { city: 'Acapulco', lat: 16.8531, lng: -99.8237 },
  '1536': { city: 'Madrid', lat: 40.4168, lng: -3.7038 },
  '4462': { city: 'Bucharest', lat: 44.4268, lng: 26.1025 },
  '4713': { city: 'Hangzhou', lat: 30.2741, lng: 120.1551 },
  '5014': { city: 'Shanghai', lat: 31.2304, lng: 121.4737 },
  '5100': { city: 'Athens', lat: 37.9838, lng: 23.7275 },
  '520': { city: 'Paris', lat: 48.8566, lng: 2.3522 },
  '540': { city: 'London', lat: 51.4344, lng: -0.2141 },
  '560': { city: 'New York', lat: 40.7499, lng: -73.846 },
  '580': { city: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  '6242': { city: 'Winston-Salem', lat: 36.0999, lng: -80.2442 },
  '6932': { city: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  '7480': { city: 'Los Cabos', lat: 22.8905, lng: -109.9167 },
  '7485': { city: 'Brussels', lat: 50.8503, lng: 4.3517 },
  '7581': { city: 'Chengdu', lat: 30.5728, lng: 104.0668 },
  '7696': { city: 'Milan', lat: 45.4642, lng: 9.19 },
  '8994': { city: 'Mallorca', lat: 39.5696, lng: 2.6502 },
  '8996': { city: 'Santiago', lat: -33.4489, lng: -70.6693 },
  '8998': { city: 'Adelaide', lat: -34.9285, lng: 138.6007 },
  '9410': { city: 'Almaty', lat: 43.222, lng: 76.8512 },
  '9900': { city: 'Sydney', lat: -33.8688, lng: 151.2093 },
  // 2026-only / extra
  '0336': { city: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  '0339': { city: 'Brisbane', lat: -27.4698, lng: 153.0251 },
};

const BY_NAME: Record<string, TournamentLocation> = {
  'australian open': { city: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  'roland garros': { city: 'Paris', lat: 48.8566, lng: 2.3522 },
  wimbledon: { city: 'London', lat: 51.4344, lng: -0.2141 },
  'us open': { city: 'New York', lat: 40.7499, lng: -73.846 },
  'indian wells masters': { city: 'Indian Wells', lat: 33.7206, lng: -116.3405 },
  'miami masters': { city: 'Miami', lat: 25.7617, lng: -80.1918 },
  'monte carlo masters': { city: 'Monte Carlo', lat: 43.7384, lng: 7.4246 },
  'madrid masters': { city: 'Madrid', lat: 40.4168, lng: -3.7038 },
  'rome masters': { city: 'Rome', lat: 41.9028, lng: 12.4964 },
  'canada masters': { city: 'Montreal', lat: 45.5017, lng: -73.5673 },
  'cincinnati masters': { city: 'Cincinnati', lat: 39.1031, lng: -84.512 },
  'shanghai masters': { city: 'Shanghai', lat: 31.2304, lng: 121.4737 },
  'paris masters': { city: 'Paris', lat: 48.8566, lng: 2.3522 },
  'tour finals': { city: 'Turin', lat: 45.0703, lng: 7.6869 },
  'next gen finals': { city: 'Milan', lat: 45.4642, lng: 9.19 },
  'united cup': { city: 'Sydney', lat: -33.8688, lng: 151.2093 },
  "queen's club": { city: 'London', lat: 51.4872, lng: -0.2147 },
};

export function getTournamentLocation(
  tourneyCode: string,
  tourneyName: string
): TournamentLocation | null {
  const byCode = BY_CODE[tourneyCode];
  if (byCode) return byCode;
  const key = tourneyName.trim().toLowerCase();
  return BY_NAME[key] ?? null;
}

export interface ApiTournament {
  logical_id: string;
  tourney_id: string;
  tourney_code: string;
  name: string;
  level: string;
  surface: string;
  date: string;
  winner: string;
  winner_ioc: string | null;
}

export interface DashboardTournament {
  logicalId: string;
  date: string;
  name: string;
  level: string;
  winner: string;
  surface: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
}

export function enrichTournament(t: ApiTournament): DashboardTournament {
  const loc = getTournamentLocation(t.tourney_code, t.name);
  return {
    logicalId: t.logical_id,
    date: t.date,
    name: t.name,
    level: t.level,
    winner: t.winner,
    surface: t.surface ?? '',
    city: loc?.city ?? null,
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
  };
}

export function hasMapLocation(t: DashboardTournament): t is DashboardTournament & {
  city: string;
  lat: number;
  lng: number;
} {
  return t.lat != null && t.lng != null;
}
