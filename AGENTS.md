# TypeScript conventions

- Use `interface` instead of `type` for object shape declarations where possible. Fall back to `type` only when necessary (unions, intersections, mapped types, primitives, tuples).

# Plugin architecture

- Series-specific behavior must live in the plugin, not in shared hooks or utilities. Never add a hardcoded `Set`, `switch`, or constant keyed on series type string in shared code — add a field to `SeriesPlugin` and let each plugin declare its own behavior.

# Config / type hierarchy

- `BaseDataLabels` and `BaseSeries` feed the public chart config. Any field added there is immediately visible and settable for **all** series types. Only add a field to `Base*` when it is implemented for all series. For a feature that is only supported by one (or a few) plugins, add it directly to that series' type (e.g. `FunnelSeries.dataLabels`). Move it to `Base*` later once every plugin supports it.

# Public API

- Treat every exported type, config field, and root export as semver-stable. Add public API only for a concrete use case; follow existing naming and nesting conventions, and preserve current behavior.
- After changing public chart config types, run `npm run test:chart-config` and verify that both the standalone declaration and JSON Schema represent the change correctly.

# Tests

- Add a focused regression test for the changed invariant. Inspect every changed visual snapshot and keep unrelated snapshots unchanged; avoid assertions based only on incidental text or markup.

# Data preparation and rendering

- Do not overwrite user-provided config or raw point fields with derived values; store resolved values separately in prepared data. Hoist and cache reusable calculations and DOM measurements outside per-point rendering loops.

# User-facing documentation

- For user-facing config or behavior changes, assess whether the TSDoc, relevant guide, and runnable example should be updated.
