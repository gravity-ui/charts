# Bar-X series

A Bar-X series displays vertical columns. Each point provides an `x` coordinate or category and a `y` value. Set `series.data[].type` to `bar-x`.

See the [BarXSeries API reference](../../api/Series/Bar-X/interfaces/BarXSeries.md) for all series options and [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md) for shared defaults.

## Borders

Use `borderWidth` (a number in pixels) and `borderColor` (a CSS color string) to customize column borders. Set defaults in `series.options['bar-x']` and override either property on individual series. An explicit `borderWidth: 0` disables the border for that series.

The default width is `0`. When a width is provided without a color, the border uses `var(--gcharts-shape-border-color)` from the chart theme.

<div data-chart-example="series-types/bar-x"></div>

Borders are drawn inside the existing column bounds, so they preserve the baseline, the column positions, and the gaps configured with `stackGap`. They follow the column's `borderRadius`, rounding the value end of each column. For stacks, only the outer ends of the positive and negative stacks are rounded, including on reversed axes. A segment shorter than twice the border width is filled entirely with the border color.

For dense charts, the border is disabled when the column width is less than or equal to twice the configured border width, as with Bar-Y series. Point-level border overrides are not supported.

## Grouping and stacking

Multiple series are grouped by default. Use `stacking: 'normal'` to stack their values or `stacking: 'percent'` to show their proportions. Percent stacking supports only non-negative values. Use `stackId` to create separate stacks and `series.options['bar-x'].stackGap` to set the gap between segments in pixels.

In percent stacks, the available plot height is shared between the segments and their gaps. Zero and skipped null values do not add gaps. If the requested gaps exceed the plot height, they are reduced to fit and segment heights become zero.

Borders work with grouped and stacked columns, including negative values with normal stacking. Hover changes the fill color; the border retains its configured color. The inactive state fades both the fill and the border.
