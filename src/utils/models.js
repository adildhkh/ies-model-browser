// All scoring here is derived only from fields OpenRouter's API actually returns
// (context length, price, declared parameters/modalities). There is no external
// "intelligence" benchmark data — we never fabricate a quality score.

export const TASK_PROFILES = {
  "Feasibility Study": { minContext: 100000, preferred: ["reasoning"] },
  "Design Basis Generation": { minContext: 64000, preferred: ["reasoning", "structuredOutputs"] },
  "Block Flow Diagram Creation": { minContext: 32000, preferred: ["vision"] },
  "PFD Creation": { minContext: 64000, preferred: ["vision", "structuredOutputs"] },
  "Process Data Sheet Generation": { minContext: 32000, preferred: ["structuredOutputs"] },
  "Pre-FEED Options Study": { minContext: 128000, preferred: ["reasoning"] },
  "Process Philosophies Creation": { minContext: 64000, preferred: ["reasoning"] },
  "Operating Manual": { minContext: 100000, preferred: ["structuredOutputs"] },
  "HAZOP Study": { minContext: 128000, preferred: ["reasoning", "vision"] },
  "All Tasks": { minContext: 0, preferred: [] },
};

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

// Blend context fit + price + capability match into one "Best Match" score.
// Every input is a real API field — the function is a ranking heuristic,
// not a claim about model intelligence.
export function fitScore(m, profile) {
  const ctx = m.context_length || 0;
  const caps = getCapabilities(m);
  const reasons = [];

  // Diminishing-returns curve instead of a hard cap at 1 — otherwise every
  // model past "3x the minimum" ties at a perfect score and ties collapse
  // to whatever order the API happened to return, which looks like a bug.
  const minCtx = Math.max(profile.minContext, 1);
  const contextScore = ctx / (ctx + minCtx * 2);
  if (ctx >= profile.minContext && profile.minContext > 0) {
    reasons.push(`Context comfortably covers this task (${fmt(ctx)} tokens)`);
  }

  let priceScore;
  if (caps.variablePricing) {
    priceScore = 0.5; // unknown until routed — neutral, not a false "cheapest"
    reasons.push("Pricing varies by which model it routes to");
  } else {
    const avgPrice = (pricePerMillion(m.pricing?.prompt) + pricePerMillion(m.pricing?.completion)) / 2;
    priceScore = caps.free ? 1 : 1 / (1 + avgPrice / 5);
    if (caps.free) reasons.push("Free to use");
    else if (avgPrice < 1) reasons.push("Low cost per token");
  }

  let capMatches = 0;
  for (const tag of profile.preferred) {
    if (caps[tag]) {
      capMatches++;
      if (tag === "toolCalling") reasons.push("Supports tool calling");
      if (tag === "reasoning") reasons.push("Supports extended reasoning");
      if (tag === "vision") reasons.push("Can read images");
      if (tag === "fileInput") reasons.push("Can read files directly");
    }
  }
  const capabilityScore = profile.preferred.length ? capMatches / profile.preferred.length : 1;

  const score = capabilityScore * 0.5 + contextScore * 0.25 + priceScore * 0.25;
  return { score, reasons };
}
