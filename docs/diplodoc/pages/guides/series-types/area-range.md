# Area range series

An area range series fills the interval between a lower and an upper value at each X position.

## When to use

Use it for observed min/max values or a supplied uncertainty interval around a forecast. Pair it with a line when readers also need a central estimate. The chart displays the bounds you provide; it does not calculate statistical intervals.

## Example

<div data-chart-example="series-types/area-range"></div>

## Data

Set `type: 'area-range'`. Each point contains `x`, `y0` (lower bound), and `y1` (upper bound).

`y0` must not be greater than `y1`. A boundary can be `null`; an incomplete point is excluded from the axis domain, `nullMode: 'skip'` leaves a gap, and `nullMode: 'connect'` connects the surrounding complete points.

## Series options

### Combining with a line

Use an area range for an expected interval and a line for the forecast or observed value. Put the area-range series before the line in `series.data` so the line is drawn on top of the band. Both series should use the same X coordinates and Y axis. A lower `opacity` keeps the line easy to read.

The example shows a forecast inside its expected range. Hover to see the forecast value and both range boundaries:

<div data-chart-example="series-types/area-range-with-line"></div>

### Boundary markers

By default, normal markers are hidden and hovering a point shows markers on both visible boundaries, with a white border. Coincident boundaries share one marker. Incomplete points and boundaries outside the visible plot have no markers.

Use [axis padding](../axes/index.md#axis-padding) to fit markers at free axis limits.

Set `series.marker.enabled` to show normal markers. Defaults for all area-range series are configured in `series.options['area-range'].marker`; per-series values take precedence. A point's `marker.states.normal.enabled` can also enable normal markers when the series setting is disabled. The line gradient is sampled at each boundary marker, following the [marker color priority](../colors.md#point-colors).

Configure hover markers through `series.options['area-range'].states.hover.marker`:

```javascript
series: {
  options: {
    'area-range': {
      marker: {enabled: false, radius: 4},
      states: {
        hover: {
          marker: {enabled: true, radius: 6},
        },
      },
    },
  },
  data: [
    {
      type: 'area-range',
      name: 'Expected range',
      data: [
        {x: 0, y0: 18, y1: 26},
        {x: 1, y0: 20, y1: 29, marker: {states: {normal: {enabled: true}}}},
      ],
    },
  ],
}
```

### Zoom and range slider

Area range supports `x`, `y`, and `xy` zoom (`x` by default). Y filtering retains any interval that overlaps the selected range, including one that contains the entire viewport. X zoom and the range slider preserve neighboring points on continuous axes so the band reaches the viewport edges.

## Colors

The `color` property controls both boundary lines and, by default, the range fill. Use `fillColor` for a different fill and `opacity` to change its opacity. Both colors support solid values and [gradients](../colors.md#gradients).

Line and fill gradient bounds include both boundaries. The legend uses the fill color.

## Data labels

Set `dataLabels.enabled: true` to show each interval as `lower — upper`. Use `dataLabels.format` to format the values; see [Data labels](../data-labels.md) and [Value formatting](../value-formatting.md).

## Tooltip

Hovering the chart highlights the selected range and shows both formatted boundaries in the tooltip. Built-in tooltip sorting and totals use the range width (`y1 - y0`) as the point value. Chart `pointermove` and `click` events receive the original point, including its `y0` and `y1` values.

A custom `rowRenderer` receives the width as `value` and the formatted interval as `formattedValue` when using the default row. The built-in `sum` total adds widths; it does not merge overlapping intervals. Use a custom aggregation when your application needs a different interpretation.

Value formatters run once for each boundary. An explicit point `label` is formatted once instead. Incomplete points affect neither gradient bounds nor tooltip lookup. A complete interval wholly outside the visible Y range is also excluded from tooltip lookup.

See [Tooltip](../tooltip.md) for shared settings.

## API reference

[AreaRangeSeries](../../api/Series/Area-Range/interfaces/AreaRangeSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
