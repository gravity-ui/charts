# Spacing

Use `chart.margin` for outer space around the chart, including its axes and legend. Use `chart.plotPadding` for space inside a Cartesian plot so edge markers fit without changing axis domains.

Both options accept `top`, `right`, `bottom`, and `left`; omitted sides default to `0`.

```ts
chart: {
    margin: {top: 12, right: 12},
    plotPadding: {right: 'auto'},
}
```

`margin` values are pixels; margin and plot padding add up.

## Plot padding {#plot-padding}

`plotPadding` accepts nonnegative pixels (`12` or `'12px'`), percentages, or `'auto'`. Percentages use the available plot width or height after margins, axes, and legend, before plot padding. Explicit sizes replace automatic values.

<div data-chart-example="layout/plot-padding"></div>

`auto` fits markers of line, area, area-range, and scatter series, including borders, enabled hover sizes, and visible scatter halos. Space is reserved before hovering, so the plot stays still. Enable only the sides you need: with `xAxis.min: 0`, leaving `left` at `0` keeps zero at the Y axis.

To override a series type's contribution, use `series.options.<type>.plotPadding`, for example `line: {plotPadding: {right: 0}}`. This applies only to chart sides set to `'auto'`; omitted type-level sides use `'auto'`. Contributions combine by maximum. Labels and tooltips do not contribute.

Axis `min`/`max` and `startOnTick`/`endOnTick` determine the value range first. Plot padding then moves its endpoints inward without changing their values. For example, with `yAxis.max: 100` and `endOnTick: false`, top padding moves the `100` mark down; the axis line still reaches the top of the plot. Setting tick rounding to `false` does not disable plot padding.

`auto` uses any room already left by `maxPadding` or tick rounding and adds only what markers still need. Explicit plot padding adds its full size. An explicit axis `max` suppresses `maxPadding` outside zoom, but keeps plot padding. Set a chart side to `0` to disable plot padding there.

During zoom or range selection, padding fits the visible range; the slider overview is unchanged. Other Cartesian series share the padded scales but do not contribute to `auto`. Non-Cartesian layouts ignore `plotPadding`.
