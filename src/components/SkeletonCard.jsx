export default function SkeletonCard() {
  return (
    <div className="model-card model-card--skeleton">
      <div className="skeleton-line" style={{ width: "70%", height: 14 }} />
      <div className="skeleton-line" style={{ width: "45%", height: 10 }} />
      <div className="skeleton-line" style={{ width: "60%", height: 18, marginTop: 8 }} />
      <div className="skeleton-grid">
        <div className="skeleton-line" style={{ height: 30 }} />
        <div className="skeleton-line" style={{ height: 30 }} />
        <div className="skeleton-line" style={{ height: 30 }} />
        <div className="skeleton-line" style={{ height: 30 }} />
      </div>
    </div>
  );
}
