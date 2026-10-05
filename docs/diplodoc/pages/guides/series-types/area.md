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

The `color` property controls the line and, by default, the area fill. Use `fillColor` for a different fill. Both accept solid colors or [gradients](../colors.md#gradients).

Use `opacity` to change only the fill opacity. It does not affect the line.

Line gradient bounds include the points that participate in the line; fill gradient bounds additionally include the area baseline.

The discrete legend uses the area fill color. The tooltip symbol follows the line's resolved point color, so a separate `fillColor` can change the area and legend without changing the tooltip symbol.

The following example combines a solid line with a top-to-bottom gradient fill:

<div data-chart-example="series-types/area"></div>
