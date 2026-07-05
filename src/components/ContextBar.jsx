export default function ContextBar({ tokens }) {
  if (!tokens) return null;
  const pct = Math.min(100, ((Math.log10(tokens) - 3) / (Math.log10(1_000_000) - 3)) * 100);
  const color = tokens >= 500_000 ? "#22c55e" : tokens >= 100_000 ? "#f59e0b" : "#94a3b8";
  return (
    <div className="context-bar">
      <div className="context-bar-fill" style={{ width: pct + "%", background: color }} />
    </div>
  );
}
