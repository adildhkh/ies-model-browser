# IES Process Engineering Model Browser

A decision tool for picking an LLM off [OpenRouter](https://openrouter.ai)'s catalog of 300+ models for process engineering deliverables — built so choosing a model is a 30-second decision, not a spreadsheet exercise.

## What it does

Pulls the live model list straight from `openrouter.ai/api/v1/models` (no key required for browsing) and lets you:

- **Filter by task type**, tuned for the FEED lifecycle — Feasibility Study, Pre-FEED Options Study, Design Basis, Block Flow Diagram (BFD), PFD, P&ID, Process Data Sheet, Process Philosophies, Operating Manual, HAZOP Study, or All Tasks.
- **Choose a mode** — Generating/Drafting vs. Reviewing/Checking. The two lean on different capabilities: drafting a new PFD needs reasoning + structured output; reviewing one someone else submitted needs vision (to actually read the diagram). HAZOP is the one task where vision matters in *both* modes, since even drafting the worksheet means continuously reading the P&ID.
- **Rank by Best Match** — the default sort. Each domain × mode combination has its own hand-tuned weighting across reasoning, vision, and structured-output capability, plus context and price sensitivity (e.g. HAZOP weights reasoning + context highest and price lowest, since it's safety-critical work; Process Data Sheet generation is mechanical enough that a cheap model is fine). All of it runs on fields OpenRouter actually reports — context length, pricing, `supported_parameters`, modalities. It does **not** invent an "intelligence"/GPQA score — that data doesn't exist in the API. Where a task needs "thinking power," the best honest proxy is the model's `reasoning` capability flag (supports an extended thinking mode) — a real API field, not a measurement of how smart the model is.
- **See real capability badges** — tool calling, reasoning, vision, image generation, audio, long context, free tier — all derived from the API response, not guessed. Vision (`input_modalities` includes `image`, reading a diagram) and image generation (`output_modalities` includes `image`, producing one) are distinct fields, verified against live OpenRouter data — only dedicated variants (Gemini's `*-image` models, GPT's `*-image` models) actually have image output, not the flagship chat models. For *generating* a BFD/PFD/P&ID, image generation is a **gate**, not just another weighted input: a model that can't produce an image at all is heavily demoted and flagged with a visible warning, however strong its reasoning is — it fundamentally can't fulfil a drawing deliverable. Reviewing an existing diagram, or non-visual domains, never apply this gate.
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
