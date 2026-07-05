// All scoring here is derived only from fields OpenRouter's API actually returns
// (context length, price, declared parameters/modalities). There is no external
// "intelligence"/GPQA/MMLU benchmark data anywhere in this API — we never
// fabricate a quality score. Where a task genuinely needs "thinking power,"
// the best honest proxy available is the `reasoning` capability flag (does
// the model support an extended/effortful thinking mode) — a real, binary
// API field, not a measurement of how smart the model is.
//
// Each domain below is scored against two weight sets — "generate" (drafting
// a new deliverable) and "review" (checking one submitted by someone else) —
// because the two activities lean on different capabilities. Vision (reading
// a diagram) only matters for domains that are inherently visual, and even
// then usually only in review mode: generating a brand-new BFD/PFD/P&ID has
// nothing existing to look at. HAZOP is the one exception — even when
// "generating" the worksheet, you're continuously reading the P&ID, so
// vision stays weighted in both modes.
//
// requiresImage marks domain × mode combinations where the deliverable
// itself is an image (BFD/PFD/P&ID, generate mode only — reviewing an
// existing diagram doesn't require producing one, and HAZOP's deliverable is
// a worksheet/table, not a drawing). This is a GATE, not just another
// weighted input: a model that cannot produce an image at all (verified via
// `architecture.output_modalities` — see getCapabilities) cannot fulfil the
// deliverable no matter how strong its reasoning or structured-output
// support is, so it must be heavily demoted rather than able to out-score
// image-capable models on other axes. (An earlier version of this scoring
// treated image generation as just one weighted term among several, which
// let a free/cheap text-only model's price+context advantage swamp it —
// mathematically wrong for a capability that's actually a hard requirement.)
//
// `blend` controls how much the overall score leans on capability fit vs.
// raw context vs. price, per domain — e.g. HAZOP weights capability+context
// highest and price lowest, because it's safety-critical work where
// correctness matters more than cost; Process Data Sheet generation is
// mechanical enough that a cheap model is genuinely fine.
export const TASK_PROFILES = {
  "Feasibility Study": {
    minContext: 100000,
    generate: { reasoning: 1.0, vision: 0, structuredOutputs: 0.4 },
    review: { reasoning: 1.0, vision: 0, structuredOutputs: 0.3 },
    blend: { capability: 0.45, context: 0.30, price: 0.25 },
  },
  "Pre-FEED Options Study": {
    minContext: 128000,
    generate: { reasoning: 1.0, vision: 0, structuredOutputs: 0.5 },
    review: { reasoning: 1.0, vision: 0, structuredOutputs: 0.4 },
    blend: { capability: 0.45, context: 0.35, price: 0.20 },
  },
  "Design Basis": {
    minContext: 64000,
    generate: { reasoning: 0.7, vision: 0, structuredOutputs: 0.8 },
    review: { reasoning: 0.9, vision: 0, structuredOutputs: 0.4 },
    blend: { capability: 0.5, context: 0.25, price: 0.25 },
  },
  "Block Flow Diagram (BFD)": {
    minContext: 32000,
    generate: { reasoning: 0.3, vision: 0, structuredOutputs: 0.6, requiresImage: true },
    review: { reasoning: 0.5, vision: 1.0, structuredOutputs: 0.2 },
    blend: { capability: 0.35, context: 0.15, price: 0.50 },
  },
  "PFD": {
    minContext: 64000,
    generate: { reasoning: 0.6, vision: 0, structuredOutputs: 0.7, requiresImage: true },
    review: { reasoning: 0.7, vision: 1.0, structuredOutputs: 0.3 },
    blend: { capability: 0.45, context: 0.25, price: 0.30 },
  },
  "P&ID": {
    minContext: 128000,
    generate: { reasoning: 0.7, vision: 0, structuredOutputs: 0.9, requiresImage: true },
    review: { reasoning: 0.8, vision: 1.0, structuredOutputs: 0.4 },
    blend: { capability: 0.5, context: 0.30, price: 0.20 },
  },
  "Process Data Sheet": {
    minContext: 32000,
    generate: { reasoning: 0.2, vision: 0, structuredOutputs: 1.0 },
    review: { reasoning: 0.4, vision: 0, structuredOutputs: 0.6 },
    blend: { capability: 0.35, context: 0.15, price: 0.50 },
  },
  "Process Philosophies": {
    minContext: 64000,
    generate: { reasoning: 0.9, vision: 0, structuredOutputs: 0.3 },
    review: { reasoning: 0.9, vision: 0, structuredOutputs: 0.3 },
    blend: { capability: 0.45, context: 0.25, price: 0.30 },
  },
  "Operating Manual": {
    minContext: 100000,
    generate: { reasoning: 0.6, vision: 0, structuredOutputs: 0.9 },
    review: { reasoning: 0.7, vision: 0, structuredOutputs: 0.6 },
    blend: { capability: 0.4, context: 0.30, price: 0.30 },
  },
  "HAZOP Study": {
    minContext: 128000,
    generate: { reasoning: 1.0, vision: 0.6, structuredOutputs: 0.5 },
    review: { reasoning: 1.0, vision: 1.0, structuredOutputs: 0.4 },
    blend: { capability: 0.55, context: 0.30, price: 0.15 },
  },
  "All Tasks": {
    minContext: 0,
    generate: { reasoning: 0, vision: 0, structuredOutputs: 0 },
    review: { reasoning: 0, vision: 0, structuredOutputs: 0 },
    blend: { capability: 0.5, context: 0.25, price: 0.25 },
  },
};

export const MODES = [
  { label: "Generating / Drafting", value: "generate" },
  { label: "Reviewing / Checking", value: "review" },
];

export const SORT_OPTIONS = [
  { label: "Best Match", value: "best_match" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Context: High → Low", value: "context_desc" },
  { label: "Newest First", value: "newest" },
];

export function fmt(n) {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}

// OpenRouter uses "-1" as a sentinel meaning "variable — depends on the
// downstream model this request gets routed to" (seen on meta-router models
// like openrouter/auto). It is not a real price, so it must never be treated
// as a number in comparisons or math — that's what caused router models to
// wrongly rank as "cheapest" and show a nonsensical negative price.
export function pricePerMillion(priceStr) {
  const v = parseFloat(priceStr);
  if (!Number.isFinite(v) || v < 0) return null;
  return v * 1_000_000;
}

export function fmtPrice(priceStr) {
  const perM = pricePerMillion(priceStr);
  if (perM === null) return "Variable";
  if (perM === 0) return "Free";
  return "$" + perM.toFixed(2) + "/M";
}

// Derive real capabilities from fields the API actually exposes.
export function getCapabilities(m) {
  const params = m.supported_parameters || [];
  const inputMods = m.architecture?.input_modalities || [];
  const outputMods = m.architecture?.output_modalities || [];
  const promptPrice = parseFloat(m.pricing?.prompt || "0");
  const completionPrice = parseFloat(m.pricing?.completion || "0");

  return {
    toolCalling: params.includes("tools") || params.includes("tool_choice"),
    reasoning: params.includes("reasoning") || params.includes("include_reasoning") || !!m.reasoning,
    structuredOutputs: params.includes("response_format") || params.includes("structured_outputs"),
    vision: inputMods.includes("image"),
    // Distinct from `vision`: this is pixel image *output*, not diagram reading.
    // Gates the score for *generating* BFD/PFD/P&ID (see fitScore) — reviewing
    // an existing diagram, or non-visual domains, never checks this.
    imageGeneration: outputMods.includes("image"),
    audio: inputMods.includes("audio") || outputMods.includes("audio"),
    fileInput: inputMods.includes("file"),
    longContext: (m.context_length || 0) >= 200000,
    free: (m.id || "").endsWith(":free") || (promptPrice === 0 && completionPrice === 0),
    variablePricing: promptPrice < 0 || completionPrice < 0,
  };
}

// For sorting: variable-priced models have no real number to compare, so they
// sort to the end rather than winning "cheapest" or "most expensive" by accident.
export function priceForSort(m) {
  const perM = pricePerMillion(m.pricing?.prompt);
  return perM === null ? Infinity : perM;
}

// Blend context fit + price + capability match into one "Best Match" score,
// weighted per-domain and per-mode (see TASK_PROFILES comment above). Every
// input is a real API field — this is a ranking heuristic, not a claim about
// model intelligence.
// A model that can't produce an image at all still gets *some* score for a
// drawing-generation task (it can help with supporting text — tag lists,
// stream descriptions) but must never be able to out-rank an image-capable
// model on capability fit. 0.15 means an otherwise-perfect non-image model
// tops out at 15% of the capability score an equally-strong image-capable
// model would get.
const NO_IMAGE_GATE_PENALTY = 0.15;

export function fitScore(m, profile, mode) {
  const ctx = m.context_length || 0;
  const caps = getCapabilities(m);
  const weights = profile[mode] || profile.generate;

  // Capability reasons are listed first — they're the actual task-fit
  // justification — with context/price as supporting reasons after, so the
  // most decision-relevant explanation isn't the one truncated by the UI.
  const capabilityReasons = [];
  const supportingReasons = [];
  const warnings = [];

  // Diminishing-returns curve instead of a hard cap at 1 — otherwise every
  // model past "3x the minimum" ties at a perfect score and ties collapse
  // to whatever order the API happened to return, which looks like a bug.
  const minCtx = Math.max(profile.minContext, 1);
  const contextScore = ctx / (ctx + minCtx * 2);
  if (ctx >= profile.minContext && profile.minContext > 0) {
    supportingReasons.push(`Context comfortably covers this task (${fmt(ctx)} tokens)`);
  }

  let priceScore;
  if (caps.variablePricing) {
    priceScore = 0.5; // unknown until routed — neutral, not a false "cheapest"
    supportingReasons.push("Pricing varies by which model it routes to");
  } else {
    const avgPrice = (pricePerMillion(m.pricing?.prompt) + pricePerMillion(m.pricing?.completion)) / 2;
    priceScore = caps.free ? 1 : 1 / (1 + avgPrice / 5);
    if (caps.free) supportingReasons.push("Free to use");
    else if (avgPrice < 1) supportingReasons.push("Low cost per token");
  }

  const totalWeight = weights.reasoning + weights.vision + weights.structuredOutputs;
  let capabilityScore = 1;
  if (totalWeight > 0) {
    let matched = 0;
    if (weights.reasoning > 0) matched += weights.reasoning * (caps.reasoning ? 1 : 0);
    if (weights.vision > 0) matched += weights.vision * (caps.vision ? 1 : 0);
    if (weights.structuredOutputs > 0) matched += weights.structuredOutputs * (caps.structuredOutputs ? 1 : 0);
    capabilityScore = matched / totalWeight;

    if (weights.reasoning >= 0.7 && caps.reasoning) {
      capabilityReasons.push(mode === "review"
        ? "Strong reasoning — suited to critically checking this work"
        : "Strong reasoning — suited to working through this task");
    }
    if (weights.vision >= 0.5 && caps.vision) {
      capabilityReasons.push(mode === "review"
        ? "Can read diagrams — needed to review the drawing"
        : "Can read diagrams — useful for referencing the P&ID while drafting");
    }
    if (weights.structuredOutputs >= 0.7 && caps.structuredOutputs) {
      capabilityReasons.push("Supports structured output — helps produce a clean, parseable deliverable");
    }
  }

  // Image generation is a gate, not a weighted input (see NO_IMAGE_GATE_PENALTY
  // comment): a model that literally cannot produce an image is heavily
  // demoted for a drawing-generation task, regardless of how strong its
  // reasoning or structured output support is.
  if (weights.requiresImage) {
    if (caps.imageGeneration) {
      capabilityReasons.push("Can generate the diagram as an actual image (verify against drawing standards before issuing)");
    } else {
      capabilityScore *= NO_IMAGE_GATE_PENALTY;
      warnings.push("Cannot generate this diagram as an image — text-only output, not a substitute for the drawing itself");
    }
  }

  const b = profile.blend;
  const score = capabilityScore * b.capability + contextScore * b.context + priceScore * b.price;
  return { score, reasons: [...capabilityReasons, ...supportingReasons], warnings };
}
