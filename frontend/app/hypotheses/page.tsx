import HypothesisStubs from '../components/HypothesisStubs';

export default function HypothesesPage() {
  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-tag">🔬 Research</div>
        <h1 className="hero-title">
          Hypotheses <span>Lab</span>
        </h1>
        <p className="hero-subtitle">
          Exploratory analytics — test ideas about career trajectories, peak ages, and in-match mechanics.
          Each section will eventually be backed by live queries.
        </p>
      </section>

      <HypothesisStubs />
    </div>
  );
}
