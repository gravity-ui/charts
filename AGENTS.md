# TypeScript conventions

- Use `interface` instead of `type` for object shape declarations where possible. Fall back to `type` only when necessary (unions, intersections, mapped types, primitives, tuples).

# Plugin architecture

- Series-specific behavior must live in the plugin, not in shared hooks or utilities. Never add a hardcoded `Set`, `switch`, or constant keyed on series type string in shared code — add a field to `SeriesPlugin` and let each plugin declare its own behavior.

# Null-mode handling

Series with a `nullMode: 'zero'` option substitute `null → 0` in
`prepareSeriesData` so the axis domain and stack/group baselines stay
consistent. Whether the resulting "0-fill" point should appear in
interactive UI (tooltip, data label, marker) depends on whether it is
visible on the chart:

- **Invisible 0-fill** (area/line dropping to 0, 0-height bar, 0-width
  bar): hide from UI — the user sees a "ghost" tooltip / label otherwise.
- **Visible 0-fill** (scatter marker at `(x, 0)`, heatmap colored cell,
  pie legend entry, waterfall plateau in the connector): keep the UI —
  `"0"` matches what the user is looking at.

When applying the hide pattern, mirror the existing area/line/bar-x/
bar-y implementation:

1. Keep the `null → 0` substitution in `prepareSeriesData` so axis
   domain calculation includes 0.
2. Carry the unmodified input as `originalData` (and `nullMode`) on the
   `Prepared<Series>` type.
3. In shape preparation, tag prepared points whose `originalData[i]`
   had a null value with `excluded?: boolean`.
4. Filter `excluded` **at the plugin's call sites** of shared utilities
   (`preparePointDataLabels`, `buildHoverMarkerGetter`, the plugin's
   own `getTooltipData` and marker-reduce). Do NOT teach shared
   utilities about `nullMode` or `excluded`.
5. Path generators stay untouched — they keep checking `y === null`
   so `'skip'` mode still produces gaps.
