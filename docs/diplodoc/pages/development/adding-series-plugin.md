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
- Optional `getClipPath({isRangeSlider, yAxis, zoomState})` returns `'bounds'` (default), `'horizontal'` (X bounds with an expanded vertical region), or `false`. Core owns SVG IDs and geometry. Clipping affects the shape group and its SVG labels; separate marker, annotation, and HTML-label layers are unaffected.
- Line previews use `'bounds'` in the range slider. Main-plot lines use `'horizontal'` unless explicit Y limits or zoom require `'bounds'`.

## 5. Define tooltip values

- `tooltip.prepareData` returns hovered chunks or, for X-aligned series, `xLookupPoints`. Mark at most one own chunk `closest: true`. When `measureDistance` is `true`, each contender must provide `distance`: the pixel distance from the pointer to its rendered shape, with `0` meaning the pointer is inside the painted contour. Other shared rows do not need a distance. When `measureDistance` is `false`, omit the metric or return `undefined`; do not use `0` for an unmeasured shape.
- Core resolves the nearest X-aligned point separately for each series, keeping its point payload, shape distance, and layer together. In mixed charts, contenders compete by distance; equal distances prefer the upper rendered layer. The winning chunk supplies the active tooltip point, click payload, and snapped crosshair. Shared line and area hover highlighting may still include other returned rows; `closest` does not limit every renderer's highlights. Core removes the internal `distance` field before invoking public callbacks.
- Measure the rendered geometry, not the data points: account for interpolation, painted strokes and their caps, marker symbol contours and borders, rounded bar corners, and unpainted holes. Geometry helpers belong in `src/core/utils/geometry.ts`; reusable marker geometry lives in `src/core/shapes/marker.ts`. Cache reusable geometry only when distance measurement or another rendering feature needs it, rather than rebuilding it on each pointer movement. Plugins that return a contender only after an exact shape hit may use `0` when measurement is requested.
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
