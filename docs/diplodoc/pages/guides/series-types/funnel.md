# Funnel series

A funnel series shows values at successive stages of a process.

## When to use

Use it to locate drop-off in a single sequence, such as product view → cart → purchase. Keep stages in process order and measure the same population at each stage. Use [Sankey](sankey.md) for branching paths.

## Example

<div data-chart-example="series-types/funnel"></div>

## Data

Set `type: 'funnel'`. Each stage contains `name` and `value`. Supply one funnel series with its stages in display order.

## Series options

### Shape and connectors

The default `shape: 'rectangle'` makes segment widths proportional to values. `shape: 'trapezoid'` gives a connected funnel silhouette. Rectangles make stage-to-stage comparisons easier.

Use `connectors` to control the lines and areas between stages. `connectors.height` accepts pixels or a percentage of the segment band height.

## Colors

Stages use the chart palette by name. Set `color` or `opacity` on a point to override a stage. See [Colors](../colors.md).

## Data labels

Labels are enabled by default. Set a point’s `label` to show its stage name and value together. Use `dataLabels.inside` and `align` for placement. Outside labels use `anchor` to align against the plot or segment, and `reserveSpace` controls whether the funnel shrinks to make room. Set `preserveLineBreaks: true` for multiline labels. See [Data labels](../data-labels.md).

## Legend

Each stage has a legend item using its point `name`; override it with `data[].legend.itemText`. Hide the legend when stage names are already in the labels. See [Legend](../legend.md).

## Tooltip

The tooltip shows the stage name and value. Set `tooltip.valueFormat` on the series or an individual stage to format values. See [Tooltip](../tooltip.md).

## API reference

[FunnelSeries](../../api/Series/Funnel/interfaces/FunnelSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
