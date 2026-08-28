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

## Line interpolation

By default, line series connect data points with straight segments. The `interpolation` option enables smooth curve rendering while keeping markers, tooltips, and interactions attached to the original data points.

### Monotone

`monotone` uses a cubic spline that is monotone in x. The curve passes through every data point without introducing artificial extrema between adjacent points — a good default choice for most smooth line charts.

```javascript
{
    type: 'line',
    interpolation: {type: 'monotone'},
}
```

<div data-chart-example="line-interpolation/monotone"></div>

### Cardinal

`cardinal` produces a cardinal spline. The `tension` parameter (0–1, default `0`) controls how tightly the curve follows the control points: `0` gives a loose curve, `1` collapses it to straight segments.

```javascript
{
    type: 'line',
    interpolation: {type: 'cardinal', tension: 0.5},
}
```

<div data-chart-example="line-interpolation/cardinal"></div>

### Notes

- Curves pass through every original data point.
- `monotone` requires data points to be ordered monotonically by their x values.
- With `cardinal` and `tension < 1`, the curve can overshoot the data extrema between points. Such portions may be clipped at the plot boundary. Use `monotone` when preserving extrema is important.
- `nullMode` behavior is preserved: gaps and zero-fills are applied before interpolation.
- To disable interpolation explicitly, set `interpolation: {type: 'linear'}` or omit the option entirely.

## Color and linear gradients

The `color` property accepts either a solid CSS color string or a linear gradient. A gradient contains at least two color stops with offsets in non-decreasing order from `0` to `1`. Gradient stop colors support hex, rgb/rgba, hsl/hsla, and named color formats.

The optional `angle` follows the CSS convention:

- `0` — bottom to top
- `90` — left to right
- `180` — top to bottom (default)
- `270` — right to left

The gradient uses the bounding box of the points that participate in the rendered line. Zoom recalculates this box from the displayed points, and the range slider resolves its gradient independently, so their colors can differ. Each point receives the gradient color at its position on the line. Marker color priority is `data[].marker.color`, then `data[].color`, the gradient color at the point position, and finally the series color.

Markers and the tooltip symbol use the resolved point color. The legend represents a gradient with its color at `t = 0.5`; it does not render a gradient symbol.

The following example renders a left-to-right gradient line:

<div data-chart-example="series-types/line"></div>

See [LinearGradient](../../api/Series/Visual/interfaces/LinearGradient.md) and [GradientStop](../../api/Series/Visual/interfaces/GradientStop.md) for the complete gradient configuration.
