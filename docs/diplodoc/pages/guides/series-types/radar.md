# Radar series

A radar series places values on radial axes and connects them into a profile.

## When to use

Use it to compare a few profiles across the same small set of metrics, such as product ratings. Use comparable scales and keep category order fixed: reordering axes changes the polygon shape. Use [Bar-Y](bar-y.md) for precise comparisons.

## Example

<div data-chart-example="series-types/radar"></div>

## Data

Set `type: 'radar'`. Supply a nonempty `categories` array on at least one radar series. Each category has a `key` and an optional `maxValue`. The first nonempty category array is shared by all radar series; each series supplies one `{value}` point per category in the same order.

## Series options

Use each category’s `maxValue` to fix its radial scale, for example `5` for a five-point rating. Use `marker` to configure point symbols and size. `borderWidth` controls the polygon outline.

## Colors

Use `color` for the fill, `borderColor` for the outline, and `fillOpacity` for overlapping profiles.

## Data labels

Category labels are shown around the chart by default. Use `dataLabels.enabled` and `dataLabels.style` to control them.

## API reference

[RadarSeries](../../api/Series/Radar/interfaces/RadarSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
