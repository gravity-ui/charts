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

## 4. Define tooltip values

- Implement `tooltip.getValue({item, xAxis, yAxis})` hook for built-in sorting and totals. Shared code delegates each hovered chunk to its plugin, including in mixed charts. The hook is optional for compatibility; omitting it falls back to the point's scalar `value`, or its Y value.
- Return an unformatted value and preserve `null`/`undefined`. Use `getTooltipAxisValue` from `src/core/tooltip/utils.ts` for axis values: it resolves category indices to names and preserves numeric/date values. Non-axis plugins extract their scalar value; interval plugins can return a width (as `area-range` does).
- Declare `tooltip.header.getValue` for series with a header; omit `header` for series without one. Reuse `getTooltipXValue` / `getTooltipYValue` and `getTooltipScalarValue` for common extraction. In mixed tooltips, the highest header priority wins (ties use the first hovered chunk): X headers use the default `0`, horizontal series use `1`, and radar categories use `2`. Values are resolved and formatted once.
- Keep tooltip row values, custom formatter context, and renderer payloads independent of the sorting/totals value. Shared code sorts the plugin values and sums only numeric values.
- Use `source: 'color'` for swatches; format labels/endpoints once. Preserve renderer precedence and keep plugin formatting hooks internal.

## 5. Integrate

- Register in [plugins/index.ts](https://github.com/gravity-ui/charts/blob/main/src/plugins/index.ts); add applicable [defaults](https://github.com/gravity-ui/charts/blob/main/src/core/constants/defaults/series-options.ts).
- Check shared axis, scale, header, grouping, and zoom assumptions. Extend the plugin contract where needed; never add shared series-name branches or lists.

## 6. Test

- Cover declared capabilities, limitations, feature combinations, and affected existing plugins. Always check empty prepared data, zero-size plots, and resize/data/visibility updates.
- Run `npm run typecheck`, focused unit tests, Docker visual tests, and `npm run test:chart-config`. Inspect snapshots, declarations, and JSON Schema; preserve unrelated baselines.

## 7. Document

- Add a Storybook example, series guide, API-doc export, runnable docs example, and navigation/registry entries.
- Explain defaults, constraints, and tooltip value semantics.
