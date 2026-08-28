# Area range series

An area range series shows the interval between a lower and an upper value for every point on the x-axis. It is useful for uncertainty bands, min/max observations, confidence intervals, and other data where both boundaries are meaningful.

Set `series.data[].type` to `area-range` and provide `y0` and `y1` for each point:

```javascript
series: {
  data: [
    {
      type: 'area-range',
      name: 'Expected range',
      data: [
        {x: 0, y0: 18, y1: 26},
        {x: 1, y0: 20, y1: 29},
        {x: 2, y0: 17, y1: 25},
      ],
    },
  ],
}
```

`y0` must not be greater than `y1`. Highcharts `low` and `high` values map to `y0` and `y1` respectively. A boundary can be `null`; an incomplete point is excluded from the axis domain, `nullMode: 'skip'` leaves a gap, and `nullMode: 'connect'` connects the surrounding complete points.

See the complete configuration in the [AreaRangeSeries API reference](../../api/Series/Area-Range/interfaces/AreaRangeSeries.md).

## Appearance and interaction

The `color` property controls both boundary lines and, by default, the range fill. Use `fillColor` for a different fill and `opacity` to change its opacity. Both colors support solid values and linear gradients.

Hovering the chart highlights the selected range and shows both formatted boundaries in the tooltip. Built-in tooltip sorting and totals use the range width (`y1 - y0`) as the point value. Chart `pointermove` and `click` events receive the original point, including its `y0` and `y1` values.

<div data-chart-example="series-types/area-range"></div>
