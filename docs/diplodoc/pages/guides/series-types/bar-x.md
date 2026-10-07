# Bar-X series

A Bar-X series displays vertical columns. Each point provides an `x` coordinate or category and a `y` value. Set `series.data[].type` to `bar-x`.

See the [BarXSeries API reference](../../api/Series/Bar-X/interfaces/BarXSeries.md) for all series options and [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md) for shared defaults.

## Borders

Use `borderWidth` (a number in pixels) and `borderColor` (a CSS color string) to customize column borders. Set defaults in `series.options['bar-x']` and override either property on individual series. An explicit `borderWidth: 0` disables the border for that series.

The default width is `0`. When a width is provided without a color, the border uses `var(--gcharts-shape-border-color)` from the chart theme.

<div data-chart-example="series-types/bar-x"></div>

Borders are drawn inside the existing column bounds, so they preserve the baseline, the column positions, and the gaps configured with `stackGap`. They follow the column's `borderRadius`, rounding the value end of each column. For stacks, only the outer ends of the positive and negative stacks are rounded, including on reversed axes.

When a column's width or height is at most twice the configured border width, it keeps its normal fill without a border. Borders are also disabled in the range slider preview. Point-level border overrides are not supported.

## Grouping and stacking

Multiple series are grouped by default. Use `stacking: 'normal'` to stack their values or `stacking: 'percent'` to show their proportions. Percent stacking supports only non-negative values. Use `stackId` to create separate stacks and `series.options['bar-x'].stackGap` to set the gap between segments in pixels.

In percent stacks, the available plot height is shared between the segments and their gaps. The outer column edge aligns with the visible edge of the 100% grid line. Zero and skipped null values do not add gaps. If the requested gaps exceed the plot height, they are reduced to fit and segment heights become zero.

## States

Hover changes the fill color; the border retains its configured color. The inactive state applies the configured opacity to the fill, border, and SVG data labels.

## Point click events

Use a Bar-X series' `events.pointClick` to react to the column that was actually clicked or tapped. The callback receives `{point, series}` and the native browser `MouseEvent`. `point` and `series` are the original configured objects, including their `custom` values, even when category ordering or `nullMode: 'zero'` requires normalized copies for rendering.

`chart.events.click` continues to select the nearest point in the plot. It can select a line point in a mixed chart or a nearby column when the user clicks the background. `events.pointClick` is independent of that selection: it only fires for the rendered fill or border of a column. It does not fire for the background, a line, a gap, an empty rounded corner, a zero-height column, or the range slider preview. It also works when tooltips are disabled for the chart, series, or point.

<div data-chart-example="series-types/bar-x-events"></div>

Both mechanisms can be configured together. The column's `pointClick` runs first; normal event propagation then reaches the existing chart click handler and tooltip pinning. Return values are ignored. Calling `event.preventDefault()` does not suppress the chart callback or pinning. Call `event.stopPropagation()` in the point callback when the interaction should only invoke the column action.

SVG data labels let pointer events reach the column below them. HTML labels and other overlays, such as the zoom selection brush, can intercept pointer events; `pointClick` does not perform a separate geometry lookup through these overlays. For nearest-point interactions over the plot, keep using `chart.events.click`.
