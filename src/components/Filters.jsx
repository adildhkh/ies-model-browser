import { TASK_PROFILES, SORT_OPTIONS, fmt } from "../utils/models.js";

export default function Filters({
  task, setTask, sort, setSort, minCtx, setMinCtx, search, setSearch,
  searchRef, favoritesOnly, setFavoritesOnly, onRefresh,
}) {
  return (
    <div className="panel filters">
      <div className="filter-group">
        <label className="filter-label">TASK TYPE</label>
        <select value={task} onChange={e => setTask(e.target.value)} className="select-input">
          {Object.keys(TASK_PROFILES).map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">SORT BY</label>
        <select value={sort} onChange={e => setSort(e.target.value)} className="select-input">
          {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">MIN CONTEXT: {minCtx === 0 ? "No minimum" : fmt(minCtx) + " tokens"}</label>
        <input
          type="range" min={0} max={1000000} step={10000} value={minCtx}
          onChange={e => setMinCtx(Number(e.target.value))}
          className="range-input"
        />
      </div>

      <div className="filter-group filter-group--grow">
        <label className="filter-label">SEARCH MODEL <span className="filter-label-hint">press / to focus</span></label>
        <input
          ref={searchRef}
          placeholder="e.g. deepseek, gemini, claude…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-input"
        />
      </div>

      <div className="filter-group filter-group--end">
        <label className={"toggle-check" + (favoritesOnly ? " toggle-check--active" : "")}>
          <input type="checkbox" checked={favoritesOnly} onChange={e => setFavoritesOnly(e.target.checked)} />
          ★ Favorites only
        </label>
      </div>

      <div className="filter-group filter-group--end">
        <button onClick={onRefresh} className="btn btn-ghost">↻ Refresh</button>
      </div>
    </div>
  );
}
