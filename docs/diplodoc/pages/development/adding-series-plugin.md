# Adding a series plugin

This checklist is for contributors adding a built-in series plugin to Charts.

## 1. Decide capabilities

Compare existing plugins and their actual behavior. For each capability, document **Supported**, **Limited (with constraints)**, or **Unsupported** in the series guide. Specify subfeatures separately and test every support claim.

| Capability               | Specify support for                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| Axis types               | Axes or no axes; `linear`, `logarithmic`, `datetime` for X and Y separately.               |
| Category axes            | X/Y; category names and indices; category sorting.                                         |
| Axis bounds and order    | Explicit `min`/`max` and reversed axes.                                                    |
| Multiple Y axes          | Series assignment to independent Y axes.                                                   |
| Split plots              | Series displayed in separate plots.                                                        |
| Mixed series             | Compatible types and shared tooltips.                                                      |
| Zoom                     | `x`, `y`, `xy`, default direction, and reset.                                              |
| Range slider             | Preview, filtering, visibility/style overrides, and combined use with zoom.                |
| Missing data             | `null`/`undefined` and `skip`/`connect`/`zero` modes.                                      |
| Colors                   | Palette, series/point overrides, gradients, and continuous color scales.                   |
| Legend                   | Discrete/continuous, symbols, grouping, and hide/show.                                     |
| Data labels              | SVG/HTML, explicit labels, formatters/renderers, point overrides, placement, and overlap.  |
| Tooltip                  | Headers, custom rows/renderers/formatters, sorting/totals, and point visibility overrides. |
| Markers and states       | Normal/hover markers, point overrides, hover/inactive styles, and halos.                   |
| Events                   | Click, pointermove, and cursor.                                                            |
| Annotations and overlays | Point annotations; axis plot lines, bands, and shapes.                                     |
| Crosshair                | X/Y, pointer following, and snapping to data.                                              |

## 2. Define the API

- Match established names, units, defaults, and option precedence.
- Define documented series, point, prepared-data, and tooltip types. Extend `SERIES_TYPE`, `ChartSeries`, `ChartSeriesData`, `ChartSeriesOptions`, `PreparedSeries`, `TooltipDataChunk`, and [public exports](https://github.com/gravity-ui/charts/blob/main/src/core/types/index.ts) as needed.
- Keep plugin-only fields out of `Base*`. Do not widen the registry to `any`.

## 3. Implement the pipeline

- Implement [SeriesPlugin](https://github.com/gravity-ui/charts/blob/main/src/core/series/plugin.ts) in `src/plugins/<type>/`: validation, series/shape preparation, rendering, and tooltip lookup/rows. Geometry currently lives in `src/core/shapes/<type>/`.
- Reuse shared helpers; preserve raw data and callback payloads, cache measurements, and clean up subscriptions.
- Implement domain/baseline rules, clipping, plot offsets, and layer/category order; define fill/stroke behavior where applicable.
- For intervals, handle incomplete points and zoom overlap. For paths, preserve boundary neighbors. Keep null/visibility rules consistent across shapes, domains, gradients, and hit testing.

## 4. Define layers and clipping

- Optional `getLayerKey({series, seriesKey})` selects a layer for one raw or prepared series occurrence. By default, core uses `series.type`, so all series of a plugin share one layer. Equal returned keys share a layer; use stable, chart-unique keys. Core throws `ChartError` if different series types return the same key. `seriesKey` identifies this occurrence: core supplies a type/index key for raw input and the series ID for prepared input. The line plugin returns `seriesKey` for independent layers, including when the same raw object occurs twice.
- Core retains series references and member order, orders layers by their first occurrence, prepares shapes in reverse order to reserve label space through `otherLayers`, and renders in forward order. Bars retain one layer per type; see the TODO on `SeriesPlugin.getLayerKey` for future layer splitting.
- `renderShapes(args)` draws geometry into `plot` and SVG labels into `labelsPlot`. Core places `labelsPlot` above the layer's shapes and normal/hover markers, with the same clipping as `plot`.
- Optional `getClipPath({isRangeSlider, yAxis, zoomState})` returns `'bounds'` (default), `'horizontal'` (X bounds with an expanded vertical region), or `false`. Core owns SVG IDs and geometry. Clipping affects the shape group and its SVG labels; separate marker, annotation, and HTML-label layers are unaffected.
- Line previews use `'bounds'` in the range slider. Main-plot lines use `'horizontal'` unless explicit Y limits or zoom require `'bounds'`.

## 5. Define tooltip values

- `tooltip.prepareData` returns hovered chunks or, for X-aligned series, `xLookupPoints`. Mark at most one own chunk `closest: true`. In mixed charts (`measureDistance: true`), the `closest` chunk and every lookup point must set `distance`: the pixel distance from the pointer to the drawn shape of its series, `0` when the pointer is inside it. Core keeps `closest` only on the chunk with the smallest distance (on ties, the series drawn in the upper layer wins; an unmeasured distance loses to any measured one), so the tooltip, click events and crosshair snapping agree on a single active chunk. `xLookupPoints` of all series compete as one group: in the nearest X column the series with the smallest distance wins, then the Y rule applies. Core strips `distance` before chunks reach public callbacks. With a single series type nothing competes, so core passes `measureDistance: false` and the plugin must skip measuring. Exceptions: plugins that report a constant `0` because the pointer hits the shape, and plugins that need the measurement to pick their own candidate (scatter measures marker contours so that a large marker containing the pointer beats a nearer center).
- Measure the rendered geometry, not the data points: account for interpolation curves, stroke widths, line caps, rounded corners and marker sizes. Reuse the helpers of `src/core/utils/geometry.ts` (segments, stroked segments and polylines, rectangles, rounded rectangles, polygons) and `getDistanceToSymbol` from `src/core/utils/symbol.ts` for marker symbols; `getDistanceToMarkers` from `src/core/shapes/marker.ts` covers line and area markers. Joins are treated as round and dash gaps are ignored. Plugins that return a chunk only when the pointer hits a shape use `0`. Build reusable geometry lazily and cache it per prepared item (as line caches its drawn segments in `getSegments()` and area caches its band columns) instead of rebuilding it on every pointer move.
- The active chunk and shared hover highlighting are separate: core selects the single active chunk, while each renderer decides how to highlight its hovered chunks. Line and area highlight every hovered chunk of their type, scatter highlights only the `closest` one.
- Implement `tooltip.getValue({item, xAxis, yAxis})` hook for built-in sorting and totals. Shared code delegates each hovered chunk to its plugin, including in mixed charts. The hook is optional for compatibility; omitting it falls back to the point's scalar `value`, or its Y value.
- Return an unformatted value and preserve `null`/`undefined`. Use `getTooltipAxisValue` from `src/core/tooltip/utils.ts` for axis values: it resolves category indices to names and preserves numeric/date values. Non-axis plugins extract their scalar value; interval plugins can return a width (as `area-range` does).
- Declare `tooltip.header.getValue` for series with a header; omit `header` for series without one. Reuse `getTooltipXValue` / `getTooltipYValue` and `getTooltipScalarValue` for common extraction. In mixed tooltips, the highest header priority wins (ties use the first hovered chunk): X headers use the default `0`, horizontal series use `1`, and radar categories use `2`. Values are resolved and formatted once.
- Set `header.axis` to the axis supplying the header value and category context. It also selects automatic number/date formatting; date precision uses enabled points from visible series contributing headers to that axis, with each Y axis kept separate. Omit `axis` for non-axis headers; set `requiresFormat: true` when the header should appear only with an explicit `tooltip.headerFormat` (as radar does).
- A missing header value differs from an omitted `header`: a custom formatter can replace missing continuous or non-axis values with a placeholder, but unresolved categories and headerless plugins omit the header. Explicit `headerFormat` overrides automatic formatting and is passed to custom renderers together with the original chunks.
- Keep tooltip row values, custom formatter context, and renderer payloads independent of the sorting/totals value. Shared code sorts the plugin values and sums only numeric values.
- Use `source: 'color'` for swatches; format labels/endpoints once. Preserve renderer precedence and keep plugin formatting hooks internal.

## 6. Integrate

- Register in [plugins/index.ts](https://github.com/gravity-ui/charts/blob/main/src/plugins/index.ts); add applicable [defaults](https://github.com/gravity-ui/charts/blob/main/src/core/constants/defaults/series-options.ts).
- Check shared axis, scale, header, grouping, and zoom assumptions. Extend the plugin contract where needed; never add shared series-name branches or lists.

## 7. Test

- Cover declared capabilities, limitations, feature combinations, and affected existing plugins. Always check empty prepared data, zero-size plots, and resize/data/visibility updates.
- Run `npm run typecheck`, focused unit tests, Docker visual tests, and `npm run test:chart-config`. Inspect snapshots, declarations, and JSON Schema; preserve unrelated baselines.

## 8. Document

- Add a Storybook example, series guide, API-doc export, runnable docs example, and navigation/registry entries.
- Explain defaults, constraints, and tooltip value semantics.
