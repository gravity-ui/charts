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

Line gradients use the bounding box of the points that participate in the rendered line. Fill gradients additionally include the area baseline. Zoom recalculates these boxes from the displayed points, and the range slider resolves its gradients independently, so their colors can differ.

The legend represents the area fill gradient with its color at `t = 0.5`; it does not render a gradient symbol. The tooltip symbol instead matches the marker of the hovered point: `data[].marker.color` takes priority over `data[].color`, followed by the line gradient color at the point position and the series line color. Therefore, a separate `fillColor` can change the area and legend without changing the tooltip symbol.

The following example combines a solid line with a top-to-bottom gradient fill:

<div data-chart-example="series-types/area"></div>

A gradient contains at least two color stops with offsets in non-decreasing order from `0` to `1`. Gradient stop colors support hex, rgb/rgba, hsl/hsla, and named color formats. Its optional `angle` follows the CSS convention and defaults to `180` (top to bottom). See [LinearGradient](../../api/Series/Visual/interfaces/LinearGradient.md) and [GradientStop](../../api/Series/Visual/interfaces/GradientStop.md) for the complete configuration.
