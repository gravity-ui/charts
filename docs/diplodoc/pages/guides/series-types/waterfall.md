# Waterfall series

A waterfall series shows how positive and negative changes build a running total.

## When to use

Use it to explain a balance from opening to closing, such as cash flow, customer growth, or budget variance. Use [Bar-X](bar-x.md) for independent values.

## Example

<div data-chart-example="series-types/waterfall"></div>

## Data

Set `type: 'waterfall'`. Each change has an `x` position and a signed `y` value. Keep changes in their process order. Mark a total point with `total: true`; it displays the accumulated sum without adding another change.

Null values are skipped by default. Set `nullMode: 'zero'` to treat them as zero changes.

## Colors

Set `positiveColor` and `negativeColor` to distinguish increases and decreases; `color` is used for totals. See [Colors](../colors.md).

## Legend

Legend items describe increases, decreases, and totals. Set `legend.itemText.positive`, `.negative`, and `.totals` on the series to name these roles. See [Legend](../legend.md).

## API reference

[WaterfallSeries](../../api/Series/Waterfall/interfaces/WaterfallSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
