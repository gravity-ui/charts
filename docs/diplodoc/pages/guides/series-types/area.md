# Area series

An area series is a line series with the space between the line and its baseline filled. It is useful for showing magnitude over time and for comparing cumulative values with stacking.

Set `series.data[].type` to `area` and provide the point coordinates through `x` and `y`:

```javascript
series: {
  data: [
    {
      type: 'area',
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

See the complete configuration in the [AreaSeries API reference](../../api/Series/Area/interfaces/AreaSeries.md).

## Line and fill colors

The `color` property controls the line and, by default, the area fill. Use `fillColor` when the fill needs a different color. Both properties accept either a solid CSS color string or a linear gradient.

Use `opacity` to change only the fill opacity. It does not affect the line.

The following example combines a solid line with a top-to-bottom gradient fill:

<div data-chart-example="series-types/area"></div>

A gradient contains at least two color stops with offsets in ascending order from `0` to `1`. Its optional `angle` follows the CSS convention and defaults to `180` (top to bottom). See [LinearGradient](../../api/Series/Visual/interfaces/LinearGradient.md) and [GradientStop](../../api/Series/Visual/interfaces/GradientStop.md) for the complete configuration.
