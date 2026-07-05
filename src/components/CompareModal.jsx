import { fmt, fmtPrice, getCapabilities } from "../utils/models.js";

const ROWS = [
  { label: "Provider", get: m => m.id?.split("/")[0] || "—" },
  { label: "Context window", get: m => fmt(m.context_length) + " tokens" },
  { label: "Input price", get: m => fmtPrice(m.pricing?.prompt) },
  { label: "Output price", get: m => fmtPrice(m.pricing?.completion) },
  { label: "Tool calling", get: m => getCapabilities(m).toolCalling ? "Yes" : "No" },
  { label: "Reasoning", get: m => getCapabilities(m).reasoning ? "Yes" : "No" },
  { label: "Vision (images)", get: m => getCapabilities(m).vision ? "Yes" : "No" },
  { label: "Audio", get: m => getCapabilities(m).audio ? "Yes" : "No" },
  { label: "Free tier", get: m => getCapabilities(m).free ? "Yes" : "No" },
  {
    label: "Added", get: m => m.created
      ? new Date(m.created * 1000).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
      : "—"
  },
];

export default function CompareModal({ models, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Compare models</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                {models.map(m => <th key={m.id}>{m.name || m.id}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(row => (
                <tr key={row.label}>
                  <td className="compare-row-label">{row.label}</td>
                  {models.map(m => <td key={m.id}>{row.get(m)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
