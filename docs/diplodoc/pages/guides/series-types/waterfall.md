# Waterfall series

A waterfall series shows how positive and negative changes build a running total.

## When to use

Use it to explain a balance from opening to closing, such as cash flow, customer growth, or budget variance. Use ordinary [bars](bar-x.md) for independent values.

## Example

<div data-chart-example="series-types/waterfall"></div>

## Data

Set `type: 'waterfall'`. Each change has an `x` position and a signed `y` value. Keep changes in their process order. Mark a total point with `total: true`; it displays the accumulated sum without adding another change.

## Series options

### Missing values

Null values are skipped by default. Set `nullMode: 'zero'` to treat them as zero changes.

## Colors

Set `positiveColor` and `negativeColor` to distinguish increases and decreases; `color` is used for totals. See [Colors](../colors.md).

## Data labels

Set `dataLabels.enabled: true` on the series to show point values. Use `dataLabels.format` to format them or a point’s `label` to supply custom text. See [Data labels](../data-labels.md).

## Legend

Legend items describe increases, decreases, and totals. Set `legend.itemText.positive`, `.negative`, and `.totals` on the series to name these roles. See [Legend](../legend.md).

## Tooltip

The tooltip shows the change or total at the hovered step. Its header follows the X axis, including datetime formatting. See [Tooltip](../tooltip.md) for formatting and a live example.

## API reference

[WaterfallSeries](../../api/Series/Waterfall/interfaces/WaterfallSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
