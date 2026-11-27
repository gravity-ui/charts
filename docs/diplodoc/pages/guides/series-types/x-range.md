# X-Range series

An X-Range series draws horizontal intervals between a start and an end value.

## When to use

Use it for task schedules, machine activity, or other durations on a timeline. Use [Bar-Y](bar-y.md) when each bar should start at a common zero baseline.

## Example

<div data-chart-example="series-types/x-range"></div>

## Data

Set `type: 'x-range'`. Each point contains `x0` (start), `x1` (end), and a `y` row or coordinate. Use numeric values on a linear X axis or millisecond timestamps on a datetime axis. For category Y axes, use category names or zero-based indices. Supply the earlier boundary as `x0`.

## Series options

Set `barMaxWidth` in `series.options['x-range']` to cap interval height in pixels (default 50, minimum 1). To adjust spacing, set `barPadding` to a fraction from 0 to 1 (default 0.2). Larger values leave more space between rows.

```ts
series: {
    options: {
        'x-range': {barMaxWidth: 24, barPadding: 0.3},
    },
    data: timelineSeries,
}
```

Use `borderRadius`, `borderWidth`, `borderColor`, and `borderDashStyle` for bar borders. Set `opacity` on a series or point to control transparency.

## Data labels

Set `dataLabels.enabled: true` to show text inside intervals. Provide a `label` on each point, for example a task name; the series name is not used as a fallback.

## Tooltip

Tooltip values, sorting, and built-in totals use the interval length (`x1 - x0`). A sum of durations does not merge overlapping intervals. See [Tooltip](../tooltip.md) for an example and custom rendering.

## API reference

[XRangeSeries](../../api/Series/X-Range/interfaces/XRangeSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
