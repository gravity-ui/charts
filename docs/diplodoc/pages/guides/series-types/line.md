# Line series

A line series connects data points to show how a value changes along the X axis. It is commonly used for time series, trends, and comparisons between several metrics.

Set `series.data[].type` to `line` and provide the point coordinates through `x` and `y`:

```javascript
series: {
  data: [
    {
      type: 'line',
      name: 'Revenue',
      data: [
        {x: 0, y: 42},
        {x: 1, y: 58},
        {x: 2, y: 51},
      ],
    },
  ],
}
```

See the complete configuration in the [LineSeries API reference](../../api/Series/Line/interfaces/LineSeries.md).

## Color and linear gradients

The `color` property accepts either a solid CSS color string or a linear gradient. A gradient contains at least two color stops with offsets in ascending order from `0` to `1`.

The optional `angle` follows the CSS convention:

- `0` — bottom to top
- `90` — left to right
- `180` — top to bottom (default)
- `270` — right to left

When markers are enabled, each marker receives the gradient color at its position on the line.

The following example renders a left-to-right gradient line:

<div data-chart-example="series-types/line"></div>

See [LinearGradient](../../api/Series/Visual/interfaces/LinearGradient.md) and [GradientStop](../../api/Series/Visual/interfaces/GradientStop.md) for the complete gradient configuration.
