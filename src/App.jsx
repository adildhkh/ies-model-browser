import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "./App.css";
import Header from "./components/Header.jsx";
import Filters from "./components/Filters.jsx";
import ModelCard from "./components/ModelCard.jsx";
import SkeletonCard from "./components/SkeletonCard.jsx";
import EmptyState from "./components/EmptyState.jsx";
import CompareBar from "./components/CompareBar.jsx";
import CompareModal from "./components/CompareModal.jsx";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { TASK_PROFILES, fmt, fitScore, priceForSort } from "./utils/models.js";

const MAX_COMPARE = 4;

export default function App() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [task, setTask] = useLocalStorage("imb_task", "Feasibility Study");
  const [mode, setMode] = useLocalStorage("imb_mode", "generate");
  const [sort, setSort] = useLocalStorage("imb_sort", "best_match");
  const [search, setSearch] = useState("");
  const [minCtx, setMinCtx] = useLocalStorage("imb_min_ctx", 0);
  const [fetched, setFetched] = useState(false);
  const [favorites, setFavorites] = useLocalStorage("imb_favorites", []);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const searchRef = useRef(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models");
      if (!res.ok) throw new Error("HTTP " + res.status + " — " + res.statusText);
      const data = await res.json();
      setModels(data.data || []);
      setFetched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && compareOpen) setCompareOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [compareOpen]);

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, [setFavorites]);

  const toggleCompare = useCallback((id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  // Task keys can change between releases (e.g. this app was retargeted from
  // generic tasks to process-engineering ones) — a stale value from a user's
  // localStorage must fall back gracefully instead of crashing the app.
  const profile = TASK_PROFILES[task] || TASK_PROFILES["All Tasks"];
  useEffect(() => {
    if (!TASK_PROFILES[task]) setTask("All Tasks");
  }, [task, setTask]);
  const effectiveMinCtx = Math.max(minCtx, profile.minContext);

  const scoredAndFiltered = useMemo(() => {
    const q = search.toLowerCase();
    let list = models.filter(m => {
      if ((m.context_length || 0) < effectiveMinCtx) return false;
      if (favoritesOnly && !favorites.includes(m.id)) return false;
      if (q && !(m.name || "").toLowerCase().includes(q) && !(m.id || "").toLowerCase().includes(q)) return false;
      return true;
    });

    if (sort === "best_match") {
      list = list
        .map(m => ({ m, ...fitScore(m, profile, mode) }))
        .sort((a, b) => {
          // Real-valued scores rarely tie exactly, but when they do, break
          // the tie with more real fields (context, then price) instead of
          // silently falling back to the API's arbitrary original order.
          if (b.score !== a.score) return b.score - a.score;
          const ctxDiff = (b.m.context_length || 0) - (a.m.context_length || 0);
          if (ctxDiff !== 0) return ctxDiff;
          return priceForSort(a.m) - priceForSort(b.m);
        })
        .map(({ m, reasons }) => ({ m, reasons }));
    } else {
      list = list
        .slice()
        .sort((a, b) => {
          if (sort === "price_asc") return priceForSort(a) - priceForSort(b);
          if (sort === "context_desc") return (b.context_length || 0) - (a.context_length || 0);
          if (sort === "newest") return (b.created || 0) - (a.created || 0);
          return 0;
        })
        .map(m => ({ m, reasons: [] }));
    }
    return list;
  }, [models, effectiveMinCtx, favoritesOnly, favorites, search, sort, profile, mode]);

  const compareModels = models.filter(m => compareIds.includes(m.id));

  return (
    <div className="app-shell">
      <Header />

      <Filters
        task={task} setTask={setTask}
        mode={mode} setMode={setMode}
        sort={sort} setSort={setSort}
        minCtx={minCtx} setMinCtx={setMinCtx}
        search={search} setSearch={setSearch}
        searchRef={searchRef}
        favoritesOnly={favoritesOnly} setFavoritesOnly={setFavoritesOnly}
        onRefresh={fetchModels}
      />

      <div className="status-bar">
        {loading && <span className="status-loading">⟳ Loading models from OpenRouter…</span>}
        {error && <span className="status-error">⚠ {error} — try refreshing</span>}
        {!loading && !error && fetched && (
          <span>
            Showing <strong>{scoredAndFiltered.length}</strong> of <strong>{models.length}</strong> models · Task: <strong className="accent-text">{task}</strong> · Mode: <strong className="accent-text">{mode === "review" ? "Reviewing" : "Generating"}</strong> · Min context: <strong className="accent-text">{fmt(effectiveMinCtx)}</strong>
          </span>
        )}
      </div>

      <div className="model-grid">
        {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        {!loading && scoredAndFiltered.map(({ m, reasons }, i) => (
          <ModelCard
            key={m.id}
            m={m}
            rank={i + 1}
            showRank={sort === "best_match"}
            reasons={reasons}
            isFavorite={favorites.includes(m.id)}
            onToggleFavorite={toggleFavorite}
            isSelected={compareIds.includes(m.id)}
            onToggleCompare={toggleCompare}
            compareDisabled={compareIds.length >= MAX_COMPARE}
          />
        ))}
        {!loading && scoredAndFiltered.length === 0 && fetched && (
          <div className="model-grid-empty">
            <EmptyState favoritesOnly={favoritesOnly} onClearFavoritesFilter={() => setFavoritesOnly(false)} />
          </div>
        )}
      </div>

      <div className="app-footer">
        Data sourced live from openrouter.ai/api/v1/models · IES – Intelligent Engineering Solutions
      </div>

      <CompareBar
        count={compareIds.length}
        onOpen={() => setCompareOpen(true)}
        onClear={() => setCompareIds([])}
      />

      {compareOpen && compareModels.length > 0 && (
        <CompareModal models={compareModels} onClose={() => setCompareOpen(false)} />
      )}
    </div>
  );
}
