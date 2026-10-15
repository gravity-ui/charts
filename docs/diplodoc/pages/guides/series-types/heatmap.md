# Heatmap series

A heatmap displays a grid of cells, using color to encode a value at each X/Y position.

## When to use

Use it to find patterns in a matrix, such as activity by weekday and time of day. Use a consistent numeric color scale across cells; use labels or tooltips when exact values matter.

## Example

<div data-chart-example="series-types/heatmap"></div>

## Data

Set `type: 'heatmap'`. Each cell contains `x`, `y`, and `value`. With category axes, pass zero-based indices into `xAxis.categories` and `yAxis[].categories`. With continuous axes, pass coordinates.

## Series options

Null values leave gaps by default; set `nullMode: 'zero'` to treat them as zero. Use `borderWidth` and `borderColor` to separate cells.

## Colors

Assign each point’s `color` from its numeric value, as in the example. The chart does not derive cell colors from `value` or the legend scale; cells without a point color use the series color. Use the same color mapping for the cells and legend.

## Legend

Use `legend.type: 'continuous'` with `legend.colorScale.colors`, `domain`, and `stops` to explain the cell colors. For a two-color scale spanning the full domain, set `stops: [0, 1]`. This configures only the legend, so keep it in sync with the mapping that assigns point colors. See [Continuous legend](../legend.md#continuous-legend).

## API reference

[HeatmapSeries](../../api/Series/Heatmap/interfaces/HeatmapSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
