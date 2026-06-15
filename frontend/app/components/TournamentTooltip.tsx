import type { DashboardTournament } from '../lib/tournamentLocations';

interface Props {
  t: DashboardTournament;
  extra?: string;
}

export default function TournamentTooltip({ t, extra }: Props) {
  return (
    <>
      <p className="dash-timeline-tooltip-name">{t.name}</p>
      <p className="dash-timeline-tooltip-winner">🏆 {t.winner}</p>
      <p className="dash-timeline-tooltip-meta">
        {t.city && <>{t.city} · </>}
        {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        {' · '}{t.surface} · {t.level}
        {extra && <> · {extra}</>}
      </p>
    </>
  );
}
