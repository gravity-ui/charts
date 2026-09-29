# Series plugin migration plan

The main pipeline already delegates series preparation, geometry, rendering, validation, tooltip lookup and rows, continuous color values, and some zoom behavior to `SeriesPlugin`. However, shared code still selects behavior by series type, especially in axes and scales.

The goal is to make each built-in plugin own its behavior while the core coordinates plugins and provides reusable primitives. Public support for third-party plugins is a separate, optional goal.

## Migration sequence

Deliver the migration incrementally, preserving behavior. The axis-domain and scale stages are the largest and should be split into focused changes.

### 1. Complete tooltip delegation

- Implement `tooltip.getValue` for the remaining plugins and remove the type switch in [getHoveredValues](../../src/components/Tooltip/DefaultTooltipContent/utils.ts).
- Move series-specific header rules into plugins: whether to show a header, which axis supplies its value, and radar category handling. These rules currently live in `getMeasureValue` in the same file and [getDefaultTooltipHeaderFormat](../../src/core/utils/tooltip.ts).
- Keep sorting, aggregation, formatting, and rendering shared. Define how header contributions combine in mixed charts, preserving current precedence.

Verify mixed-series tooltips, totals, sorting, category/date formatting, and the raw values supplied to custom formatters and renderers.

Update the [plugin guide](../../src/how-to.md): tooltip value/header hooks and mixed-chart precedence.

### 2. Delegate layer grouping and clipping

- Replace the special handling of `line` in [series preparation](../../src/core/series/prepareSeries.ts) and [shape preparation](../../src/hooks/useShapes/index.tsx) with plugin-declared grouping behavior.
- Replace line-specific clipping and the scatter override tables in [ChartInner](../../src/components/ChartInner/useChartInnerProps.ts) and [range slider](../../src/hooks/useRangeSlider/index.ts) with plugin-owned clipping decisions.
- Pass the relevant context: main chart versus slider, axis bounds, and zoom state.

Preserve layer order, cross-layer label priority, stable React keys, and clipping at plot boundaries.

Update the [plugin guide](../../src/how-to.md): grouping and context-aware clipping.

### 3. Delegate axis-domain contributions

[common.ts](../../src/core/utils/common.ts) still owns stacked bar/area accumulation, waterfall cumulative values, zero-baseline rules, and lists of series with volume on each axis.

The existing `getAxisDomainValues` callback processes one point. Stacks and waterfall require a group-level calculation with series order and axis context. Extend the contract to support that distinction; do not force aggregate calculations into per-point callbacks.

- Let plugins compute their domain contributions and baseline requirements.
- Keep merging contributions for a given axis in the core.
- Share parameterized stacking math where useful, without branching on series names.

Verify mixed signs, zeros, sparse/null data, multiple stacks and axes, hidden series, waterfall totals, zoom, and logarithmic axes.

Update the [plugin guide](../../src/how-to.md): point/group domain contributions and baseline rules.

### 4. Delegate remaining axis and scale policies

Move these decisions into plugin metadata or narrowly scoped callbacks:

| Remaining policy                                             | Current location                                                                               |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Whether a series uses axes                                   | [series-type-guards.ts](../../src/core/utils/series-type-guards.ts)                            |
| Percent-stack domains, bar offsets, and space for bar labels | [x-scale.ts](../../src/core/scales/x-scale.ts), [y-scale.ts](../../src/core/scales/y-scale.ts) |
| Special handling of single-value domains                     | [scales/utils.ts](../../src/core/scales/utils.ts)                                              |
| Heatmap padding and grid suppression                         | [x-axis.ts](../../src/core/axes/x-axis.ts), [y-axis.ts](../../src/core/axes/y-axis.ts)         |
| X-range and bar-y tick policies                              | [X ticks](../../src/core/utils/axis/x-axis.ts), [Y ticks](../../src/components/AxisY/utils.ts) |

Keep D3 scale construction, label measurement, and layout shared. Specify how plugin requirements combine and how they interact with explicit user settings. Axis participation must not imply that every point has scalar numeric `x` and `y` fields.

Update the [plugin guide](../../src/how-to.md): axis participation and scale policies.

### 5. Finish preprocessing, defaults, and zoom delegation

- Move area-specific X sorting from [getSortedSeriesData](../../src/core/utils/series/sorting.ts) into area preparation, preserving its order relative to category normalization.
- Move type-specific defaults from [series-options.ts](../../src/core/constants/defaults/series-options.ts) into plugins. Keep the merge mechanism shared and preserve option precedence.
- Move recognition and filtering of `x0`/`x1` intervals out of [zoom.ts](../../src/core/zoom/zoom.ts), following the existing `zoom.isYInRange` extension pattern.

Preserve raw user fields and store resolved values separately. Any intended change to interval-filtering semantics should be a separate behavioral fix.

Update the [plugin guide](../../src/how-to.md): plugin-owned defaults, preprocessing, and interval filtering.

### 6. Consolidate plugin implementation and types

Plugins currently import much of their implementation from `core/shapes/<series>`. Once shared behavioral dependencies are removed:

- Colocate series-specific geometry, renderers, tooltip lookup, helpers, and styles under `plugins/<series>/`. Include the series-specific rules in [useShapes/styles.scss](../../src/hooks/useShapes/styles.scss).
- Keep reusable label, marker, measurement, and geometry primitives shared.
- Associate raw series, prepared series, shape data, and tooltip types throughout the plugin contract to reduce repeated casts. Split series-specific prepared types out of [series/types.ts](../../src/core/series/types.ts) while preserving existing exports.

Use small, behavior-preserving moves. Avoid introducing a broad public abstraction solely to reorganize internal code.

Update the [plugin guide](../../src/how-to.md): file locations and pipeline typing.

## Optional: external plugins and selective imports

Public registration, extensible types, and selective imports are a separate task, outside this internal migration. If implemented, update the [plugin guide](../../src/how-to.md) with external registration, imports, and type-extension instructions.

## Validation and completion criteria

- Add focused regression coverage for each migrated invariant; include mixed charts, visibility changes, resize, zoom, and range slider behavior where relevant.
- For layout changes, cover zero dimensions, space requirements exceeding available dimensions, and negative computed space. Run relevant visual tests through Docker, inspect changed snapshots, and keep unrelated snapshots unchanged.
- Preserve public config, defaults, callback payloads, and exports. Keep plugin-only capabilities out of `BaseSeries` and `BaseDataLabels`. If public config types change, run `npm run test:chart-config` and inspect both standalone declarations and JSON Schema; assess TSDoc, guides, and examples.
- Add an architecture check preventing new series-name switches, lists, or implementation imports in shared runtime code. Test registration boundaries separately from the global Jest setup that registers every built-in.
- Internal migration is complete when series behavior can be changed in its plugin and reusable primitives without adding type-specific branches to the core. The built-in registration list and public type aggregation may remain centralized.
