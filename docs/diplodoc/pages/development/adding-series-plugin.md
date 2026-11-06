# Adding a series plugin

This guide covers built-in plugins in `src/plugins/<type>/`. Public external registration is still being migrated; the axis and viewport contracts already accept a plugin's own data types.

## 1. Define behavior and types

Compare existing plugins and document each capability as **Supported**, **Limited**, or **Unsupported**, including relevant subfeatures:

- Coordinates: axis types, categories and sorting, bounds, reversed axes, multiple Y axes, split plots, and mixed series.
- Viewport: X/Y/XY zoom, reset, range-slider previews, and missing-value modes.
- Appearance: series/point colors, gradients, continuous scales, legend, SVG/HTML labels, markers, and hover/inactive states.
- Interaction: tooltip headers/rows/formatters, sorting/totals, events, crosshair, annotations, and overlays.

Match established config names, units, defaults, and precedence. Keep specialized fields out of `Base*`. Define series, point, prepared-data, and tooltip types; update the built-in unions and public exports where needed. Keep registry boundaries typed.

## 2. Prepare data and geometry

Implement [SeriesPlugin](https://github.com/gravity-ui/charts/blob/main/src/core/series/plugin.ts): `prepareSeries`, `prepareShapeData`, `renderShapes`, and tooltip lookup/rows. Add validation and optional capabilities as needed. Series-specific geometry currently lives in `core/shapes/<type>/`.

Keep raw config, points, and callback payloads intact. Store derived values separately, hoist reusable calculations and measurements, and clean up subscriptions. Register derived point copies with `withSourcePoint`; use `getSourcePoint` for nested interaction payloads.

### Axes

Set `axes: true` for scalar X/Y coordinates; omit it for a series without Cartesian axes. An object enables both axes with optional per-axis policies.

Use one `getData` adapter for custom coordinates or domains. This interval plugin exposes X endpoints while retaining scalar Y:

```typescript
axes: {
    x: {
        getData: ({series}) => ({
            values: series.flatMap((item) =>
                item.data.flatMap((point) => [point.start, point.end]),
            ),
        }),
    },
},
```

Return original coordinates in `values` and geometry extents, stack sums, or cumulative values in `domainValues`. An omitted domain uses the coordinates; omitted coordinates use scalar extraction. Empty arrays exclude contributions. Core supplies the plugin's ordered series for the current axis and selects visibility, including the all-hidden fallback.

Declare baselines, band reserves, grid, and padding defaults through [SeriesAxis](https://github.com/gravity-ui/charts/blob/main/src/core/series/axis-contract.ts). Use optional `getFixedDomain` for bounds imposed by configuration and `getTicks` for exceptional ticks. Core combines requests, builds scales, and handles label collisions.

Optional `getXAxisPadding` reserves label space in pixels at the maximum end of an autoscaled X domain. Core takes the largest request; explicit `xAxis.max` wins.

### Zoom and preprocessing

Omit `zoom.filterData` for scalar point filtering. Otherwise return `{data, shapeData?}`: selected samples and optional original anchors needed to draw crossing geometry.

Reuse `filterPoints` for coordinate readers, interval predicates, path mode, and filtering by dimension. Supply `isDefined` for path gaps and remove connected missing points before filtering. Stacked plugins filter their category dimension.

Filtering and axis data share `viewport`: axis types, categories, and selected ranges. An absent range is unfiltered; `excluded` marks a plot outside the active brush. Derive domains from visible geometry, accounting for retained anchors outside the viewport. `plugins/path-domain.ts` clips straight curve segments from the renderer's factory; smooth curves retain sample-based domains through `getDomainPoints`. Core reuses Y contributions for layout and rendering.

Keep sorting and missing-value handling in the plugin and consistent with rendering. Area sorts X after category normalization.

## 3. Render layers and labels

Default grouping puts a plugin's series in one layer. Optional `getLayerKey({series, seriesKey})` selects a layer per occurrence; equal keys share a layer, and returning `seriesKey` creates an independent layer. Keys must be stable and chart-unique; collisions across plugin types throw `ChartError`.

Core retains member order, orders layers by first occurrence, prepares them in reverse order for label reservations, and renders forward. Preserve shared stack/group geometry when partitioning layers.

Render geometry into `plot` and SVG labels into `labelsPlot`. Labels sit above shapes and markers. Optional `getClipPath` selects `'bounds'` (default), `'horizontal'`, or `false`.

{% note info %}

Clipping applies to shapes and SVG labels. Marker, annotation, and HTML-label layers are separate. Line previews use bounds clipping.

{% endnote %}

Keep main geometry synchronous. Register delayed DOM work with `registerCompletion` during rendering so `reflow()` waits for it. Check `signal` before inserting delayed nodes and return cleanup when needed.

## 4. Add interaction lookup

Implement `interaction.prepareNearestData` for unfiltered `{position, item}` candidates and `interaction.getTargetElements` for painted SVG elements. Include permanent markers, exclude labels/hover decorations/connectors, and preserve item identity across multiple SVG parts. Use `getClosestItem` when a composite selection needs conversion.

Keep adapters and payload types in the plugin's `interaction.ts` and `interaction-types.ts`. Shared interaction APIs stay generic; avoid importing plugin payload types into shared code or public barrels.

`tooltip.prepareData` selects hovered chunks or X-aligned `xLookupPoints`. Mark at most one own chunk `closest`. When `measureDistance` is true, that chunk and every lookup point must report pixel distance to the drawn geometry; hits report zero. Core chooses the nearest active chunk, preferring the upper layer on ties, and strips distance from public callbacks. X lookups compete in the nearest column before the Y rule applies.

Measure strokes, interpolation, rounded corners, and marker contours using shared geometry/symbol helpers. Cache reusable geometry per prepared item. Skip distance work when `measureDistance` is false unless needed for the plugin's own selection. Active selection and hover highlighting are independent.

## 5. Define tooltip content

- Return raw values from `tooltip.getValue` for sorting/totals. Preserve missing values and resolve category indices with `getTooltipAxisValue`. The default reads scalar `value` or Y; totals sum numeric values.
- Supply default `rows` as an array or per-chunk function. Explicit `tooltip.rows` replaces them. Keep row values and custom-formatter context separate from sorting values; use `source: 'color'` for swatches and format values once.
- Omit `header` for headerless series. Otherwise provide `header.getValue`, with `axis` for category/date formatting. Reuse the X/Y/scalar tooltip helpers.

In mixed tooltips the highest header priority wins; ties keep the first chunk. Existing X, horizontal-series, and radar headers use priorities 0, 1, and 2. Set `requiresFormat` for headers that need an explicit `headerFormat`.

{% note info %}

A missing header value can be replaced by a custom formatter. An omitted header or unresolved category suppresses it. Explicit `headerFormat` overrides automatic formatting and reaches custom renderers with the original chunks.

{% endnote %}

## 6. Register and integrate

Register the plugin in [plugins/index.ts](https://github.com/gravity-ui/charts/blob/main/src/plugins/index.ts) and add applicable [defaults](https://github.com/gravity-ui/charts/blob/main/src/core/constants/defaults/series-options.ts).

Trace shared axes, scales, layers, zoom, and tooltip consumers. Extend the plugin contract when necessary; keep series-name branches and implementation imports out of shared runtime code.

## 7. Verify behavior

Test declared capabilities and affected existing plugins, including mixed charts, visibility/data updates, resize, zoom, and slider previews. Check empty data, zero-sized plots, oversized requests, and negative computed space where relevant.

Run `npm run typecheck`, focused unit tests, Docker visual tests, and `npm run test:chart-config`. Inspect changed snapshots, the standalone declaration, and JSON Schema; preserve unrelated baselines. Test registration separately from Jest's global built-in setup.

## 8. Document usage

Add a Storybook story, a series guide with a runnable `docs/examples` example, API-doc exports, and navigation/registry entries. Explain common configuration and supported limitations; keep edge-case combinations in stories and tests.
