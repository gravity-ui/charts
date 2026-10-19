# Spacing

Use `chart.margin` for outer space around the chart, including its axes and legend. Use `chart.plotPadding` for space inside a Cartesian plot so edge markers fit without changing axis domains.

Both options accept `top`, `right`, `bottom`, and `left`; omitted sides default to `0`.

```ts
chart: {
    margin: {top: 12, right: 12},
    plotPadding: {right: 'auto'},
}
```

`margin` values are pixels. `plotPadding` accepts nonnegative pixels (`12` or `'12px'`), percentages, or `'auto'`. Percentages use the available plot width or height after margins, axes, and legend, before plot padding. Explicit sizes replace automatic values; margin and plot padding add up.

<a id="plot-padding"></a>

<div data-chart-example="layout/plot-padding"></div>

`auto` fits markers of line, area, area-range, and scatter series, including borders, enabled hover sizes, and visible scatter halos. Space is reserved before hovering, so the plot stays still. Enable only the sides you need: with `xAxis.min: 0`, leaving `left` at `0` keeps zero at the Y axis.

To override a series type's contribution, use `series.options.<type>.plotPadding`, for example `line: {plotPadding: {right: 0}}`. This applies only to chart sides set to `'auto'`; omitted type-level sides use `'auto'`. Contributions combine by maximum. Labels and tooltips do not contribute.
