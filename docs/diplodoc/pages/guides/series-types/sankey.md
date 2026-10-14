# Sankey series

A Sankey series connects nodes with flows whose widths represent quantities.

## When to use

Use it to show how quantities split and merge between stages, such as traffic journeys or energy transfers. Use [funnel](funnel.md) for a single sequence without branches.

## Example

<div data-chart-example="series-types/sankey"></div>

## Data

Set `type: 'sankey'`. Each node has a unique `name` and a `links` array. A link contains the target node’s `name` and a positive `value`; include target nodes in the same data array, with `links: []` for terminal nodes. Supply one Sankey series and avoid cycles.

## Series options

Nodes are arranged into columns from source to destination. Include intermediate nodes when a flow passes through several stages. Keep incoming and outgoing quantities consistent at intermediate stages when representing a conserved total.

## Colors

Nodes use the chart palette by name. Set `color` on a node to override it; outgoing links use the source node color. See [Colors](../colors.md).

## API reference

[SankeySeries](../../api/Series/Sankey/interfaces/SankeySeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
