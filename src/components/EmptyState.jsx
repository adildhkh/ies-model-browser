export default function EmptyState({ favoritesOnly, requiresImage, onClearFavoritesFilter }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">◌</div>
      {favoritesOnly ? (
        <>
          <div>
            {requiresImage
              ? "None of your favorites can generate images — star a model with the Image Output badge (e.g. GPT *-image, Gemini *-image)."
              : "No favorites match your filters."}
          </div>
          <button className="btn btn-ghost" onClick={onClearFavoritesFilter} style={{ marginTop: 10 }}>
            Show all models
          </button>
        </>
      ) : requiresImage ? (
        <div>No image-output models match your filters. Try lowering the minimum context, clearing your search, or switching to Reviewing mode if you only need to read an existing drawing.</div>
      ) : (
        <div>No models match your filters. Try lowering the minimum context or clearing your search.</div>
      )}
    </div>
  );
}
