export interface DashboardTournament {
  date: string;
  name: string;
  level: string;
  winner: string;
  surface: string;
  city: string;
  lat: number;
  lng: number;
}

export const DASHBOARD_TOURNAMENTS: DashboardTournament[] = [
  { date: '2026-01-19', name: 'Australian Open', level: 'GS', winner: 'Jannik Sinner', surface: 'Hard', city: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  { date: '2026-02-16', name: 'Rotterdam', level: '500', winner: 'Carlos Alcaraz', surface: 'Hard', city: 'Rotterdam', lat: 51.9244, lng: 4.4777 },
  { date: '2026-03-08', name: 'Indian Wells', level: 'M1000', winner: 'Carlos Alcaraz', surface: 'Hard', city: 'Indian Wells', lat: 33.7206, lng: -116.3405 },
  { date: '2026-03-22', name: 'Miami Open', level: 'M1000', winner: 'Jannik Sinner', surface: 'Hard', city: 'Miami', lat: 25.7617, lng: -80.1918 },
  { date: '2026-04-07', name: 'Monte Carlo', level: 'M1000', winner: 'Stefanos Tsitsipas', surface: 'Clay', city: 'Monte Carlo', lat: 43.7384, lng: 7.4246 },
  { date: '2026-04-21', name: 'Barcelona', level: '500', winner: 'Carlos Alcaraz', surface: 'Clay', city: 'Barcelona', lat: 41.3874, lng: 2.1686 },
  { date: '2026-04-24', name: 'Munich', level: '250', winner: 'Alexander Zverev', surface: 'Clay', city: 'Munich', lat: 48.1351, lng: 11.582 },
  { date: '2026-04-26', name: 'Estoril', level: '250', winner: 'Arthur Fils', surface: 'Clay', city: 'Estoril', lat: 38.7056, lng: -9.3979 },
  { date: '2026-05-05', name: 'Madrid Masters', level: 'M1000', winner: 'Andrey Rublev', surface: 'Clay', city: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { date: '2026-05-19', name: 'Rome Masters', level: 'M1000', winner: 'Carlos Alcaraz', surface: 'Clay', city: 'Rome', lat: 41.9028, lng: 12.4964 },
  { date: '2026-05-26', name: 'Roland Garros', level: 'GS', winner: 'Carlos Alcaraz', surface: 'Clay', city: 'Paris', lat: 48.8566, lng: 2.3522 },
  { date: '2026-06-09', name: 'Stuttgart', level: '250', winner: 'Alexander Zverev', surface: 'Grass', city: 'Stuttgart', lat: 48.7758, lng: 9.1829 },
];
