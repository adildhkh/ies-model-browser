# IES Process Engineering Model Browser

A decision tool for picking an LLM off [OpenRouter](https://openrouter.ai)'s catalog of 300+ models for process engineering deliverables — built so choosing a model is a 30-second decision, not a spreadsheet exercise.

## What it does

Pulls the live model list straight from `openrouter.ai/api/v1/models` (no key required for browsing) and lets you:

- **Filter by task type**, tuned for the FEED lifecycle — Feasibility Study, Design Basis Generation, Block Flow Diagram Creation, PFD Creation, Process Data Sheet Generation, Pre-FEED Options Study, Process Philosophies Creation, Operating Manual, HAZOP Study, or All Tasks. Each maps to a sensible minimum context window and preferred capabilities (e.g. HAZOP Study favors reasoning + vision, for reviewing P&IDs).
- **Rank by Best Match** — the default sort. It scores every model on context adequacy, price, and capability fit for your selected task, using only fields OpenRouter actually reports (context length, pricing, `supported_parameters`, modalities). It does **not** invent an "intelligence" score — that data doesn't exist in the API, so we don't pretend it does.
- **See real capability badges** — tool calling, reasoning, vision, audio, long context, free tier — all derived from the API response, not guessed.
- **Compare up to 4 models side-by-side** in a modal, and **favorite** models you keep coming back to. Both favorites and filters persist locally across visits.
- **Search and sort** by price or context, with `/` as a keyboard shortcut to jump to search.

## Why "Best Match" instead of "Top Weekly"

An earlier version of this app sorted by "Top Weekly," implying real usage popularity — it was actually just the API's default array order, which isn't ranked by usage at all. Best Match replaces it with a transparent, explainable heuristic: each card shows *why* it ranked where it did (e.g. "Low cost per token," "Supports tool calling").

## Stack

React 19 + Vite, no backend — everything runs client-side against the OpenRouter public API.

```
npm install
npm run dev      # local dev server
npm run build    # production build
npm run lint     # oxlint
```
