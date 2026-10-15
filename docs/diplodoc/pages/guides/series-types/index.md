# Series types

A series defines how a set of data points is drawn. Its `type` determines the point fields and available visual options. Add series to `series.data`.

## Configure a series

```javascript
series: {
  data: [
    {
      type: 'line',
      name: 'Orders',
      data: [{x: 0, y: 42}, {x: 1, y: 58}, {x: 2, y: 51}],
    },
  ],
}
```

Set options on the individual series. For types that expose shared defaults, use `series.options[type]`, such as `series.options.line.marker`. Available settings differ by type; see [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md).

Axis-based series use the chart’s `xAxis` and `yAxis`; `series.yAxis` selects a Y axis by index. Types such as pie and treemap define their own layout. See [Axis types](../axes/axis-types.md).

## Combine series

Add multiple entries to `series.data` to compare series. Compatible axis-based types can share a chart, for example an [area range with a line](area-range.md#combining-with-a-line). Keep their coordinates and units consistent. Put a background band before the line it supports so the line stays visible.
