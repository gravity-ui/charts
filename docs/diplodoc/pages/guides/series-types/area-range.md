# Area range series

An area range series shows the interval between a lower and an upper value for every point on the x-axis. It is useful for uncertainty bands, min/max observations, confidence intervals, and other data where both boundaries are meaningful.

Set `series.data[].type` to `area-range` and provide `low` and `high` for each point:

```javascript
series: {
  data: [
    {
      type: 'area-range',
      name: 'Expected range',
      data: [
        {x: 0, low: 18, high: 26},
        {x: 1, low: 20, high: 29},
        {x: 2, low: 17, high: 25},
      ],
    },
  ],
}
```

`low` must not be greater than `high`. A boundary can be `null`; `nullMode: 'skip'` leaves a gap and `nullMode: 'connect'` connects the surrounding complete points.

See the complete configuration in the [AreaRangeSeries API reference](../../api/Series/Area-Range/interfaces/AreaRangeSeries.md).

## Appearance and interaction

The `color` property controls both boundary lines and, by default, the range fill. Use `fillColor` for a different fill and `opacity` to change its opacity. Both colors support solid values and linear gradients.

Hovering the chart highlights the selected range and shows both formatted boundaries in the tooltip. Chart `pointermove` and `click` events receive the original point, including its `low` and `high` values.

<div data-chart-example="series-types/area-range"></div>
