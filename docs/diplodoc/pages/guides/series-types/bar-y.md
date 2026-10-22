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

Multiple series are grouped by default. Use `stacking: 'normal'` to stack their values or `stacking: 'percent'` to show their proportions. Percent stacking supports only non-negative values. Use `stackId` to create separate stacks and `series.options['bar-y'].stackGap` to set the gap between segments in pixels. Enable `stackLabels` to show [stack totals](../data-labels.md#stack-total-labels).

Set `grouping: false` to overlay bars at the category center without taking up grouped slots. Non-stacked bars start at the value-axis baseline; stacking still accumulates values within each `stackId`. Omitted or `true` grouping preserves side-by-side positions.

Later series in `series.data` cover earlier ones, including their borders. The example places Plan before Actual to draw Actual on top.

Set `barPadding` on a series to control its thickness without moving its center: use values from `0` to `1`, with larger values producing thinner bars. Omitted values inherit `series.options['bar-y'].barPadding` (default `0.2`); stacks use the largest resolved padding among all their series, including hidden ones. The example raises the shared `barMaxWidth` to keep the difference visible.

<div data-chart-example="series-types/bar-y-overlay"></div>

All series in the same stack must use the same `grouping` value; omitted `grouping` counts as `true`. Mixing values within a stack is a configuration error. To overlay complete stacks, give each stack a distinct `stackId` and set `grouping: false` on every series in those stacks.

### Bar thickness

Set `barMaxWidth` on a series to limit its thickness in pixels. Use a finite number greater than or equal to 1. The example gives Plan a limit of 80 px and Actual a limit of 24 px.

<div data-chart-example="series-types/bar-y-width"></div>

```ts
series: {
    data: [
        {type: 'bar-y', name: 'Plan', barMaxWidth: 80, data: [/* points */]},
        {type: 'bar-y', name: 'Actual', barMaxWidth: 24, data: [/* points */]},
    ],
}
```

Omitted limits inherit `series.options['bar-y'].barMaxWidth`, which defaults to 50 px. A series can override that value with a smaller or larger limit. The actual thickness also depends on available space and `barPadding`; the minimum rendered thickness is 1 px.

All segments in a stack use the smallest resolved limit among its series, including hidden ones. This keeps stack thickness stable when series are toggled in the legend.

### Borders

Set `borderWidth` in pixels (default `0`), `borderColor` as a CSS color, and `borderRadius` in pixels. Set defaults in `series.options['bar-y']` and override them on individual series. The default border color is `var(--gcharts-shape-border-color)`.

### Opacity

Set `opacity` from `0` to `1` in `series.options['bar-y']`, and override it on individual series or points. Omitted or `null` values inherit the next level, defaulting to `1`. Opacity affects the fill and border and leaves normal data labels opaque.

Legend symbols follow series opacity; tooltip markers follow point opacity, falling back to series opacity.

The example uses the default palette with rounded borders and a shared opacity of `0.6`.

<div data-chart-example="series-types/bar-y"></div>

### Data label placement

<a id="data-label-placement"></a>

Set `dataLabels.placement: ['outside', 'inside-end']` to prefer labels outside the value end and move them inside when there is insufficient room. Short bars keep their labels outside. `'auto'` is shorthand for the same order.

<div data-chart-example="data-labels/bar-placement"></div>

An array sets the candidate order; a single entry fixes the position:

- `'outside'`: Outside the value end.
- `'inside-end'`: Inside, next to the value end of the visible bar.
- `'inside-center'`: Centered in the visible part of the bar.

Positions follow the value direction, including negative values and reversed axes. A candidate must fit entirely within the plot. Inside candidates must also fit within their own visible bar or stack segment, with `padding` at both ends along the value axis. In stacks, outside placement is tried only for the final segment of each sign; inner segments use the remaining candidates.

If no candidate fits, `placementFallback: 'show'` (default) draws the first candidate shifted into the plot; it may overlap the bar edge. Use `'hide'` to omit the label instead. Label overlap filtering still follows `allowOverlap`.

SVG and HTML labels recalculate placement after resize, zoom, and reset. An explicit `placement` overrides the deprecated `inside` option, including in percent stacks. Omitting `placement` preserves the existing `inside` behavior.

Adaptive and inside placements use the available plot space without an axis reserve. With `placement: ['outside']`, Bar-Y reserves space at the maximum end of an autoscaled X axis, as with legacy outside labels. An explicit `xAxis.max` takes precedence.

### States

Hover changes the fill color; the border retains its configured color. The inactive state multiplies the resolved fill and border opacity by `states.inactive.opacity`, so transparent bars stay transparent. SVG data labels use the inactive opacity directly. When it ends, bars restore their point or series opacity.

## API reference

[BarYSeries](../../api/Series/Bar-Y/interfaces/BarYSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
