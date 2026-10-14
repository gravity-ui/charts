# Sankey series

A Sankey series connects nodes with flows whose widths represent quantities.

## When to use

Use it to show how quantities split and merge between stages, such as traffic journeys or energy transfers. Use [funnel](funnel.md) for a single sequence without branches.

## Example

<div data-chart-example="series-types/sankey"></div>

## Data

Set `type: 'sankey'`. Each node has a unique `name` and a `links` array. A link contains the target node’s `name` and a positive `value`; include target nodes in the same data array, with `links: []` for terminal nodes. Supply one Sankey series and avoid cycles.

## Series options

### Flow layout

Nodes are arranged into columns from source to destination. Include intermediate nodes when a flow passes through several stages. Keep incoming and outgoing quantities consistent at intermediate stages when representing a conserved total.

## Colors

Nodes use the chart palette by name. Set `color` on a node to override it; outgoing links use the source node color. See [Colors](../colors.md).

## Data labels

Node names are shown by default. Use `dataLabels.enabled` to hide them or `dataLabels.style` to change the text appearance.

## Legend

The discrete legend shows one item per series, using its `name`. Set `legend.itemText` on a series to change the legend text. See [Legend](../legend.md) for layout and selection. Node names are already on the diagram, so a single-series legend can usually be hidden.

## Tooltip

Hover a link to see its source, destination, and value. See [Tooltip](../tooltip.md) for shared settings and custom rendering.

## API reference

[SankeySeries](../../api/Series/Sankey/interfaces/SankeySeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
