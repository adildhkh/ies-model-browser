export default function Header() {
  return (
    <div className="app-header">
      <div className="app-header-row">
        <div className="app-logo">⚡</div>
        <div>
          <div className="app-title">Process Engineering Model Browser</div>
          <a
            href="https://ies-solutions.org"
            target="_blank"
            rel="noopener noreferrer"
            className="app-subtitle app-subtitle-link"
          >IES · Intelligent Engineering Solutions</a>
        </div>
      </div>
      <div className="app-tagline">
        Live OpenRouter model data, ranked for process engineering deliverables — HAZOPs, PFDs, feasibility studies, and the rest of the FEED lifecycle — by context window, price, and capability, not vibes.
      </div>
    </div>
  );
}
