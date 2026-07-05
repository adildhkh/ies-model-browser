export default function EmptyState({ favoritesOnly, onClearFavoritesFilter }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">◌</div>
      {favoritesOnly ? (
        <>
          <div>No favorites yet.</div>
          <button className="btn btn-ghost" onClick={onClearFavoritesFilter} style={{ marginTop: 10 }}>
            Show all models
          </button>
        </>
      ) : (
        <div>No models match your filters. Try lowering the minimum context or clearing your search.</div>
      )}
    </div>
  );
}
