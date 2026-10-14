# X-Range series

An X-Range series draws horizontal intervals between a start and an end value.

## When to use

Use it for task schedules, machine activity, or other durations on a timeline. Use [Bar-Y](bar-y.md) when each bar should start at a common zero baseline.

## Example

<div data-chart-example="series-types/x-range"></div>

## Data

Set `type: 'x-range'`. Each point contains `x0` (start), `x1` (end), and a `y` row or coordinate. Use numeric values on a linear X axis or millisecond timestamps on a datetime axis. For category Y axes, use category names or zero-based indices. Supply the earlier boundary as `x0`.

## Series options

### Borders and opacity

Use `borderRadius`, `borderWidth`, `borderColor`, and `borderDashStyle` for bar borders. Set `opacity` on a series or point to control transparency.

## Colors

Series use the chart palette by default. Set `color` on a series or point to override it. See [Colors](../colors.md).

## Data labels

Set `dataLabels.enabled: true` to show text inside intervals. Labels use the series name by default; set a point’s `label` to show a task name.

## Legend

The discrete legend shows one item per series, using its `name`. Set `legend.itemText` on a series to change the legend text. See [Legend](../legend.md) for layout and selection.

## Tooltip

Tooltip values, sorting, and built-in totals use the interval length (`x1 - x0`). A sum of durations does not merge overlapping intervals. See [Tooltip](../tooltip.md) for an example and custom rendering.

## API reference

[XRangeSeries](../../api/Series/X-Range/interfaces/XRangeSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
