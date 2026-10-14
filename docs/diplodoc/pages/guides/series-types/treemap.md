# Treemap series

A treemap divides an area into rectangles sized by value and grouped by a hierarchy.

## When to use

Use it to show how many items contribute to a total within groups, such as storage by folder. Use [bars](bar-y.md) for precise rankings: similar rectangle areas are harder to compare.

## Example

<div data-chart-example="series-types/treemap"></div>

## Data

Set `type: 'treemap'`. Give leaf nodes a `name` and a non-negative `value`. To create groups, give parent nodes an `id` and reference it with each child’s `parentId`; omit `value` on parents. Omit `parentId` for top-level nodes and keep IDs unique.

## Series options

### Layout

`layoutAlgorithm` chooses the tiling method; the default is `binary`. Use `levels` to set padding at a hierarchy depth. Set `sorting: {enabled: true, direction: 'desc'}` to arrange larger values first; otherwise input order is preserved.

## Colors

Tiles use the series color by default. Set `color` on leaf nodes or use `levels[].color` to color a depth. See [Colors](../colors.md).

## Data labels

Labels show leaf names by default. A `name` array supplies multiple lines. Use `dataLabels.align`, `padding`, and `style` for placement, or set `enabled: false` to hide labels. Text is shortened or omitted when a tile has insufficient space.

## Legend

The discrete legend shows one item per series, using its `name`. Set `legend.itemText` on a series to change the legend text. See [Legend](../legend.md) for layout and selection. It describes the series, not individual tiles; hide it with `legend.enabled: false` when tile labels are sufficient.

## Tooltip

Hover a tile to see its name and value. Use `tooltip.valueFormat` for units such as bytes or currency. See [Tooltip](../tooltip.md).

## API reference

[TreemapSeries](../../api/Series/Treemap/interfaces/TreemapSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
