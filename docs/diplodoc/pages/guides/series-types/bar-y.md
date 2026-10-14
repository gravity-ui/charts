# Bar-Y series

A Bar-Y series compares values with horizontal bars.

## When to use

Use it for rankings and category comparisons, especially when names are long. Sort categories by value for a ranking; retain the natural order when it carries meaning. Keep the value axis at zero so bar lengths remain comparable.

## Example

<div data-chart-example="series-types/bar-y-basic"></div>

## Data

Set `type: 'bar-y'`. Each point supplies a numeric `x` value and a `y` coordinate or category. Category values can be names or zero-based indices in the axis `categories`. See [Axis types](../axes/axis-types.md).

## Series options

### Grouping and stacking

Multiple series are grouped by default. Use `stacking: 'normal'` to stack their values or `stacking: 'percent'` to show their proportions. Percent stacking supports only non-negative values. Use `stackId` to create separate stacks and `series.options['bar-y'].stackGap` to set the gap between segments in pixels.

Set `grouping: false` to overlay bars at the category center without taking up grouped slots. Non-stacked bars start at the value-axis baseline; stacking still accumulates values within each `stackId`. Omitted or `true` grouping preserves side-by-side positions.

Later series in `series.data` cover earlier ones, including their borders. The example places Plan before Actual to draw Actual on top.

Bar thickness is shared through `series.options['bar-y'].barPadding` and `barMaxWidth`.

<div data-chart-example="series-types/bar-y-overlay"></div>

All series in the same stack must use the same `grouping` value; omitted `grouping` counts as `true`. Mixing values within a stack is a configuration error. To overlay complete stacks, give each stack a distinct `stackId` and set `grouping: false` on every series in those stacks.

### Borders

Set `borderWidth` in pixels (default `0`), `borderColor` as a CSS color, and `borderRadius` in pixels. Set defaults in `series.options['bar-y']` and override them on individual series. The default border color is `var(--gcharts-shape-border-color)`.

### Opacity

Set `opacity` from `0` to `1` in `series.options['bar-y']`, and override it on individual series or points. Omitted or `null` values inherit the next level, defaulting to `1`. Opacity affects the fill and border and leaves normal data labels opaque.

The example uses the default palette with rounded borders and a shared opacity of `0.6`.

<div data-chart-example="series-types/bar-y"></div>

### States

Hover changes the fill color; the border retains its configured color. The inactive state multiplies the resolved fill and border opacity by `states.inactive.opacity`, so transparent bars stay transparent. SVG data labels use the inactive opacity directly. When it ends, bars restore their point or series opacity.

## Colors

Series use the chart palette by default. Set `color` on a series or point to override it. See [Colors](../colors.md).

## Data labels

Set `dataLabels.enabled: true` on the series to show point values. Use `dataLabels.format` to format them or a point’s `label` to supply custom text. See [Data labels](../data-labels.md). Enable `stackLabels` for [stack totals](../data-labels.md#stack-total-labels).

## Legend

The discrete legend shows one item per series, using its `name`. Set `legend.itemText` on a series to change the legend text. See [Legend](../legend.md) for layout and selection. The symbol follows series opacity; text remains opaque.

## Tooltip

The tooltip shows the point value. Set `tooltip.valueFormat` on the series to format it; see [Tooltip](../tooltip.md) and [Value formatting](../value-formatting.md). Tooltip markers follow point opacity, falling back to series opacity.

## API reference

[BarYSeries](../../api/Series/Bar-Y/interfaces/BarYSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
