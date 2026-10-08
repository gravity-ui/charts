# Bar-X series

A Bar-X series displays vertical columns. Each point provides an `x` coordinate or category and a `y` value. Set `series.data[].type` to `bar-x`.

See the [BarXSeries API reference](../../api/Series/Bar-X/interfaces/BarXSeries.md) for all series options and [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md) for shared defaults.

## Grouping and stacking

Multiple series are grouped by default. Use `stacking: 'normal'` to stack their values or `stacking: 'percent'` to show their proportions. Percent stacking supports only non-negative values. Use `stackId` to create separate stacks and `series.options['bar-x'].stackGap` to set the gap between segments in pixels.

In percent stacks, the available plot height is shared between the segments and their gaps. The outer column edge aligns with the visible edge of the 100% grid line. Zero and skipped null values do not add gaps. If the requested gaps exceed the plot height, they are reduced to fit and segment heights become zero.

## Appearance

### Borders

Set `borderWidth` in pixels (default `0`), `borderColor` as a CSS color, and `borderRadius` in pixels. Set defaults in `series.options['bar-x']` and override them on individual series. The default border color is `var(--gcharts-shape-border-color)`.

Borders are drawn inside the column bounds and follow rounded corners. For stacks, only the outer value ends are rounded, including on reversed axes. Borders are disabled in the range slider and when the column width or height is at most twice the border width. Point-level border overrides are not supported.

### Opacity

Set `opacity` from `0` to `1` in `series.options['bar-x']`, and override it on individual series or points. Omitted or `null` values inherit the next level, defaulting to `1`. Opacity affects the fill and border, including the bar-x range slider, and leaves normal data labels opaque.

The example combines borders with a default opacity of `0.8`, `0.3` on Plan, and a point override of `0.6` in February.

<div data-chart-example="series-types/bar-x"></div>

### States

Hover changes the fill color; the border retains its configured color. The inactive state applies its opacity to the fill, border, and SVG data labels. When it ends, bars restore their point or series opacity.
