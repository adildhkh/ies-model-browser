export default function CompareBar({ count, onOpen, onClear }) {
  if (count === 0) return null;
  return (
    <div className="compare-bar">
      <span>{count} model{count > 1 ? "s" : ""} selected</span>
      <div className="compare-bar-actions">
        <button className="btn btn-ghost" onClick={onClear}>Clear</button>
        <button className="btn btn-primary" onClick={onOpen} disabled={count < 2}>
          Compare {count >= 2 ? `(${count})` : ""}
        </button>
      </div>
    </div>
  );
}
