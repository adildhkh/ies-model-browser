import Badge from "./Badge.jsx";
import ContextBar from "./ContextBar.jsx";
import { fmt, fmtPrice, getCapabilities } from "../utils/models.js";

export default function ModelCard({ m, rank, showRank, isFavorite, onToggleFavorite, isSelected, onToggleCompare, compareDisabled, reasons }) {
  const ctx = m.context_length;
  const inP = m.pricing?.prompt;
  const outP = m.pricing?.completion;
  const provider = m.id?.split("/")[0] || "";
  const caps = getCapabilities(m);

  return (
    <div className={"model-card" + (isSelected ? " model-card--selected" : "")}>
      {showRank && rank <= 3 && (
        <div className={"rank-badge rank-badge--" + rank}>#{rank}</div>
      )}

      <button
        type="button"
        className={"favorite-btn" + (isFavorite ? " favorite-btn--active" : "")}
        onClick={() => onToggleFavorite(m.id)}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorite ? "★" : "☆"}
      </button>

      <div className="model-card-header">
        <div className="model-card-title">{m.name || m.id}</div>
        <div className="model-card-subtitle">{provider} · {m.id}</div>
      </div>

      <div className="badge-row">
        {caps.free && <Badge label="Free" color="#4ade80" />}
        {caps.longContext && <Badge label="Long Context" color="#22c55e" />}
        {caps.toolCalling && <Badge label="Tool Calling" color="#38bdf8" title="Supports function/tool calling" />}
        {caps.reasoning && <Badge label="Reasoning" color="#f472b6" title="Supports extended reasoning" />}
        {caps.vision && <Badge label="Vision" color="#a78bfa" title="Accepts image input — can read diagrams" />}
        {caps.imageGeneration && <Badge label="Image Output" color="#f97316" title="Can generate pixel images — weighted for drafting BFD/PFD/P&ID diagrams, but verify against drawing standards before issuing" />}
        {caps.audio && <Badge label="Audio" color="#fb923c" title="Accepts or produces audio" />}
        {caps.variablePricing && <Badge label="Variable Pricing" color="#eab308" title="This is a router — price depends on which model it picks per request" />}
      </div>

      <div className="model-card-grid">
        <div>
          <div className="model-card-label">CONTEXT</div>
          <div className="model-card-value">{fmt(ctx)} tokens</div>
          <ContextBar tokens={ctx} />
        </div>
        <div>
          <div className="model-card-label">INPUT PRICE</div>
          <div className="model-card-value">{fmtPrice(inP)}</div>
        </div>
        <div>
          <div className="model-card-label">OUTPUT PRICE</div>
          <div className="model-card-value">{fmtPrice(outP)}</div>
        </div>
        <div>
          <div className="model-card-label">ADDED</div>
          <div className="model-card-value">
            {m.created ? new Date(m.created * 1000).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}
          </div>
        </div>
      </div>

      {reasons && reasons.length > 0 && (
        <div className="reasons">
          {reasons.slice(0, 4).map((r, i) => <div key={i} className="reason-item">✓ {r}</div>)}
        </div>
      )}

      {m.description && (
        <div className="model-card-description">
          {m.description.slice(0, 160)}{m.description.length > 160 ? "…" : ""}
        </div>
      )}

      <div className="model-card-footer">
        <label className={"compare-check" + (compareDisabled && !isSelected ? " compare-check--disabled" : "")}>
          <input
            type="checkbox"
            checked={isSelected}
            disabled={compareDisabled && !isSelected}
            onChange={() => onToggleCompare(m.id)}
          />
          Compare
        </label>
        <a
          href={"https://openrouter.ai/" + m.id}
          target="_blank"
          rel="noopener noreferrer"
          className="model-card-link"
        >View on OpenRouter →</a>
      </div>
    </div>
  );
}
