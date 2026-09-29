# Adding a series plugin

Built-in series checklist. See the [migration plan](../.agents/plans/SERIES_PLUGIN_MIGRATION_PLAN.md) for upcoming integration changes.

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
- Define documented series, point, prepared-data, and tooltip types. Extend `SERIES_TYPE`, `ChartSeries`, `ChartSeriesData`, `ChartSeriesOptions`, `PreparedSeries`, `TooltipDataChunk`, and [public exports](core/types/index.ts) as needed.
- Keep plugin-only fields out of `Base*`. Do not widen the registry to `any`.

## 3. Implement the pipeline

- Implement [SeriesPlugin](core/series/plugin.ts) in `plugins/<type>/`: validation, series/shape preparation, rendering, and tooltip lookup/rows. Geometry currently lives in `core/shapes/<type>/`.
- Reuse shared helpers; preserve raw data and callback payloads, cache measurements, and clean up subscriptions.
- Implement domain/baseline rules, clipping, plot offsets, and layer/category order; define fill/stroke behavior where applicable.
- For intervals, handle incomplete points and zoom overlap. For paths, preserve boundary neighbors. Keep null/visibility rules consistent across shapes, domains, gradients, and hit testing.

## 4. Define tooltip values

- Set `tooltip.getValue` for sorting/totals; distinguish raw values from formatted display.
- Use `source: 'color'` for swatches; format labels/endpoints once. Preserve renderer precedence and keep plugin formatting hooks internal.

## 5. Integrate

- Register in [plugins/index.ts](plugins/index.ts); add applicable [defaults](core/constants/defaults/series-options.ts).
- Check shared axis, scale, header, grouping, and zoom assumptions. Extend the plugin contract where needed; never add shared series-name branches or lists.

## 6. Test

- Cover declared capabilities, limitations, feature combinations, and affected existing plugins. Always check empty prepared data, zero-size plots, and resize/data/visibility updates.
- Run `npm run typecheck`, focused unit tests, Docker visual tests, and `npm run test:chart-config`. Inspect snapshots, declarations, and JSON Schema; preserve unrelated baselines.

## 7. Document

- Add a Storybook example, series guide, API-doc export, runnable docs example, and navigation/registry entries.
- Explain defaults, constraints, and tooltip value semantics.
