'use client';

import { useState } from 'react';
import PlayerSearchPicker, { type PickedPlayer } from '../components/PlayerSearchPicker';
import HeadToHeadStubs from '../components/HeadToHeadStubs';

export default function HeadToHeadPage() {
  const [playerA, setPlayerA] = useState<PickedPlayer | null>(null);
  const [playerB, setPlayerB] = useState<PickedPlayer | null>(null);

  const ready = playerA && playerB;

  const handleSwap = () => {
    const a = playerA;
    const b = playerB;
    setPlayerA(b);
    setPlayerB(a);
  };

  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-tag">⚔️ H2H</div>
        <h1 className="hero-title">
          Head-to-Head <span>Comparison</span>
        </h1>
        <p className="hero-subtitle">
          Pick two players to compare direct meetings, styles, and how each performs against similar opponents.
        </p>

        <div className="h2h-pickers">
          <PlayerSearchPicker
            label="Player A"
            accent="a"
            value={playerA}
            onChange={setPlayerA}
            excludeId={playerB?.player_id}
          />
          <button
            type="button"
            className="h2h-swap-btn"
            onClick={handleSwap}
            disabled={!playerA && !playerB}
            title="Swap players"
            aria-label="Swap players"
          >
            ⇄
          </button>
          <PlayerSearchPicker
            label="Player B"
            accent="b"
            value={playerB}
            onChange={setPlayerB}
            excludeId={playerA?.player_id}
          />
        </div>
      </section>

      {!ready ? (
        <div className="h2h-empty">
          <span className="empty-icon">⚔️</span>
          <p className="empty-title">Select two players</p>
          <p className="empty-sub">
            Search and pick both players above — the comparison dashboard will appear here.
          </p>
        </div>
      ) : (
        <HeadToHeadStubs playerA={playerA} playerB={playerB} />
      )}
    </div>
  );
}
