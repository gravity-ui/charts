# Bar-X series

A Bar-X series compares values with vertical columns.

## When to use

Use it to compare categories or values in discrete periods, such as quarterly sales. Choose [Bar-Y](bar-y.md) for long category names. Keep the value axis at zero so bar lengths remain comparable.

## Example

<div data-chart-example="series-types/bar-x-basic"></div>

## Data

Set `type: 'bar-x'`. Each point supplies an `x` coordinate or category and a numeric `y` value. Category values can be names or zero-based indices in the axis `categories`. See [Axis types](../axes/axis-types.md).

## Series options

### Grouping and stacking

Multiple series are grouped by default. Use `stacking: 'normal'` to stack their values or `stacking: 'percent'` to show their proportions. Percent stacking supports only non-negative values. Use `stackId` to create separate stacks and `series.options['bar-x'].stackGap` to set the gap between segments in pixels. Enable `stackLabels` to show [stack totals](../data-labels.md#stack-total-labels).

In percent stacks, the available plot height is shared between the segments and their gaps. The outer column edge aligns with the visible edge of the 100% grid line. Zero and skipped null values do not add gaps. If the requested gaps exceed the plot height, they are reduced to fit and segment heights become zero.

Set `grouping: false` to overlay bars at the category center without taking up grouped slots. Non-stacked bars start at the value-axis baseline; stacking still accumulates values within each `stackId`. Omitted or `true` grouping preserves side-by-side positions.

Later series in `series.data` cover earlier ones, including their borders. The example places Plan before Actual to draw Actual on top.

Bar thickness is shared through `series.options['bar-x'].barPadding` and `barMaxWidth`.

<div data-chart-example="series-types/bar-x-overlay"></div>

All series in the same stack must use the same `grouping` value; omitted `grouping` counts as `true`. Mixing values within a stack is a configuration error. To overlay complete stacks, give each stack a distinct `stackId` and set `grouping: false` on every series in those stacks.

### Borders

Set `borderWidth` in pixels (default `0`), `borderColor` as a CSS color, and `borderRadius` in pixels. Set defaults in `series.options['bar-x']` and override them on individual series. The default border color is `var(--gcharts-shape-border-color)`.

Borders are drawn inside the column bounds and follow rounded corners. For stacks, only the outer value ends are rounded, including on reversed axes. Borders are disabled in the range slider and when the column width or height is at most twice the border width. Point-level border overrides are not supported.

### Opacity

Set `opacity` from `0` to `1` in `series.options['bar-x']`, and override it on individual series or points. Omitted or `null` values inherit the next level, defaulting to `1`. Opacity affects the fill and border, including the bar-x range slider, and leaves normal data labels opaque.

Legend symbols follow series opacity; tooltip markers follow point opacity, falling back to series opacity.

The example uses the default palette with rounded borders and a shared opacity of `0.6`.

<div data-chart-example="series-types/bar-x"></div>

### States

Hover changes the fill color; the border retains its configured color. The inactive state multiplies the resolved fill and border opacity by `states.inactive.opacity`, so transparent bars stay transparent. SVG data labels use the inactive opacity directly. When it ends, bars restore their point or series opacity.

## API reference

[BarXSeries](../../api/Series/Bar-X/interfaces/BarXSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
