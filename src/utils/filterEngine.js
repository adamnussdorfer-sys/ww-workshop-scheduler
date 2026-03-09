// ── Filter Engine ─────────────────────────────────────────────────────────────
// Pure utility — no React imports, no side effects.
// Follows the same module pattern as conflictEngine.js.

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute the set of workshop IDs that match all active filter dimensions.
 *
 * Logic:
 *   - OR within a dimension  (workshop passes if it matches ANY selected value)
 *   - AND across dimensions  (workshop must pass ALL non-empty dimensions)
 *   - Empty dimension array  → all workshops pass that dimension (no filter applied)
 *   - All dimensions empty   → all workshops are returned (no active filter)
 *
 * Coach dimension: a workshop matches if the coach appears as the primary coach
 * (ws.coachId) OR as the co-coach (ws.coCoachId). A null coCoachId is safely
 * ignored.
 *
 * Market dimension: a workshop matches if any of its market tags appear in the
 * selected markets (ws.markets is always an array on well-formed workshop data).
 *
 * @param {Object[]} workshops - Full array of workshop objects
 * @param {{ coaches: string[], types: string[], statuses: string[], markets: string[] }} filters
 * @returns {Set<string>} Set of workshop IDs that match all active dimensions
 */
export function getMatchedWorkshopIds(workshops, filters) {
  const { coaches = [], types = [], statuses = [], markets = [] } = filters;

  // No filters active — all workshops match
  if (
    coaches.length === 0 &&
    types.length === 0 &&
    statuses.length === 0 &&
    markets.length === 0
  ) {
    return new Set(workshops.map((ws) => ws.id));
  }

  const matched = new Set();

  for (const ws of workshops) {
    // Coach dimension (OR): pass if this dimension is empty or ws has a match
    if (coaches.length > 0) {
      const coachMatch =
        coaches.includes(ws.coachId) ||
        (ws.coCoachId != null && coaches.includes(ws.coCoachId));
      if (!coachMatch) continue;
    }

    // Type dimension (OR within): pass if empty or ws.type is selected
    if (types.length > 0 && !types.includes(ws.type)) continue;

    // Status dimension (OR within): pass if empty or ws.status is selected
    if (statuses.length > 0 && !statuses.includes(ws.status)) continue;

    // Market dimension (OR within): pass if empty or ws.markets intersects selected
    if (markets.length > 0) {
      const marketMatch =
        Array.isArray(ws.markets) && ws.markets.some((m) => markets.includes(m));
      if (!marketMatch) continue;
    }

    matched.add(ws.id);
  }

  return matched;
}

/**
 * Return true if any filter dimension has at least one selected value.
 *
 * Used by consumers to decide whether to apply the dim/highlight effect or
 * show filter pills indicating an active filter state.
 *
 * @param {{ coaches: string[], types: string[], statuses: string[], markets: string[] }} filters
 * @returns {boolean}
 */
export function hasActiveFilters(filters) {
  const { coaches = [], types = [], statuses = [], markets = [] } = filters;
  return (
    coaches.length > 0 ||
    types.length > 0 ||
    statuses.length > 0 ||
    markets.length > 0
  );
}
