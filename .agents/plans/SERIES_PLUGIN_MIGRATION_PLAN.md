# Series plugin migration plan

The main pipeline delegates series preparation, geometry, rendering, validation, tooltip lookup and rows, continuous color values, axis policies, and viewport selection to `SeriesPlugin`. Remaining work concerns series defaults, implementation ownership, and the complete plugin type contract.

The goal is to make each plugin own its behavior while the core coordinates plugins and provides reusable primitives. Design contracts for authors who know their own data and the plugin interface, without requiring core internals. Public registration and selective imports remain a separate delivery step.

## Migration sequence

Completed tooltip delegation, layer grouping and clipping, axis policies and domains, preprocessing, and viewport/zoom selection. Plugins declare their behavior through optional adapters and policies; core merges contributions and provides reusable primitives while preserving public chart configuration and exports.

### 1. Delegate series defaults

Move type-specific defaults from [series-options.ts](../../src/core/constants/defaults/series-options.ts) into plugins. Keep the merge mechanism shared, preserve option precedence, and document plugin-owned defaults in the [plugin guide](../../docs/diplodoc/pages/development/adding-series-plugin.md).

### 2. Consolidate plugin implementation and types

Plugins currently import much of their implementation from `core/shapes/<series>`. Once shared behavioral dependencies are removed:

- Colocate series-specific geometry, renderers, tooltip lookup, helpers, and styles under `plugins/<series>/`. Include the series-specific rules in [useShapes/styles.scss](../../src/hooks/useShapes/styles.scss).
- Keep reusable label, marker, measurement, and geometry primitives shared.
- Associate plugin-owned raw series, prepared series, shape data, and interaction/tooltip payloads throughout the complete `SeriesPlugin` contract, without closed built-in unions or implementation imports from core. Split series-specific prepared types out of [series/types.ts](../../src/core/series/types.ts) while preserving existing exports, and verify the contract with a complete custom-plugin fixture using its own data types and the documented interface.
- Reconcile `getAxisPadding` (paint extents) and `getXAxisPadding` (label-space reserve) into a coherent axis-padding contract. Specify their contexts, units, combination rules, and timing while preserving explicit bounds, zoom, and range-slider behavior.

Use small, behavior-preserving moves. Avoid introducing a broad public abstraction solely to reorganize internal code.

Update the [plugin guide](../../docs/diplodoc/pages/development/adding-series-plugin.md): file locations and pipeline typing.

## Optional: external plugins and selective imports

Public registration, extensible types, and selective imports are a separate task, outside this internal migration. If implemented, update the [plugin guide](../../docs/diplodoc/pages/development/adding-series-plugin.md) with external registration, imports, and type-extension instructions.

## Validation and completion criteria

- Add focused regression coverage for each migrated invariant; include mixed charts, visibility changes, resize, zoom, and range slider behavior where relevant.
- For layout changes, cover zero dimensions, space requirements exceeding available dimensions, and negative computed space. Run relevant visual tests through Docker, inspect changed snapshots, and keep unrelated snapshots unchanged.
- Preserve public config, defaults, callback payloads, and exports. Keep plugin-only capabilities out of `BaseSeries` and `BaseDataLabels`. If public config types change, run `npm run test:chart-config` and inspect both standalone declarations and JSON Schema; assess TSDoc, guides, and examples.
- Add an architecture check preventing new series-name switches, lists, or implementation imports in shared runtime code. Test registration boundaries separately from the global Jest setup that registers every built-in.
- Internal migration is complete when series behavior can be changed in its plugin and reusable primitives without adding type-specific branches to the core. The built-in registration list and public type aggregation may remain centralized.
