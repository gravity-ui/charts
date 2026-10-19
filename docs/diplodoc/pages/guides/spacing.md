# Spacing

Use `chart.margin` for outer space around the chart, including its axes and legend. Use `chart.plotPadding` to make room for markers at the edges of a Cartesian plot.

## Plot padding {#plot-padding}

Markers at an axis limit can be clipped by the plot edge. Automatic plot padding reserves enough room to show them in full, including on hover, without changing the axis limits.

This example adds space on the right so the last marker fits:

<div data-chart-example="layout/plot-padding"></div>

```ts
chart: {
    plotPadding: {right: 'auto'},
}
```

Set only the sides you need: `top`, `right`, `bottom`, or `left`. Omitted sides default to `0`, which disables padding on that side. For an X axis starting at zero, leave the left side at zero to keep the origin at the Y axis.

### Choosing a size

- **Automatic** — use `'auto'` to fit markers, their borders, enabled hover sizes, and visible scatter halos. Space is reserved before hovering, so the plot stays still.
- **Pixels** — use a nonnegative number or pixel string, such as `12` or `'12px'`, for a fixed inset.
- **Percentages** — use a string such as `'5%'` for an inset relative to the available plot width or height, measured after margins, axes, and legend, before plot padding.

An explicit size replaces the automatic value on that side.

### Axis limits and existing space

Plot padding moves the endpoints of the axis range inward without changing their values. The axis line still spans the plot. [Axis limits and tick rounding](./axes/index.md) are applied first; disabling tick rounding does not disable plot padding.

Automatic padding reuses space already left by tick rounding or `maxPadding` and adds only what markers still need. Explicit padding adds its full size. Setting an explicit axis maximum suppresses `maxPadding` outside zoom, but keeps plot padding.

### Supported series

Automatic padding measures markers in line, area, area-range, and scatter series. Labels and tooltips do not contribute. Other Cartesian series share the padded scales; non-Cartesian layouts ignore plot padding.

To exclude a series type from automatic padding on a side, set its contribution to zero:

```ts
series: {
    options: {
        line: {plotPadding: {right: 0}},
    },
    data: [/* your series */],
}
```

Series options apply only to chart sides set to automatic padding. Omitted sides remain automatic, and the largest contribution determines the space reserved.

### Zoom and range selection

Padding adjusts to the visible range during zoom or range selection. The slider overview is unchanged.

## Outer margins

Set `chart.margin` in pixels to leave space outside the chart content:

```ts
chart: {
    margin: {top: 12, right: 12},
}
```

Margins use the same four sides and default to zero. You can combine them with plot padding; the two add up.
