# Waterfall series

A waterfall series shows how positive and negative changes build a running total.

## When to use

Use it to explain a balance from opening to closing, such as cash flow, customer growth, or budget variance. Use [Bar-X](bar-x.md) for independent values.

## Example

<div data-chart-example="series-types/waterfall"></div>

## Data

Set `type: 'waterfall'`. Each change has an `x` position and a signed `y` value. Keep changes in their process order. Mark a total point with `total: true`; it displays the accumulated sum without adding another change.

Null values are skipped by default. Set `nullMode: 'zero'` to treat them as zero changes.

## Data labels

Labels are enabled by default. To label only the total, disable labels for the series and enable them on the total point.

```js
{
  type: 'waterfall',
  name: 'Customers',
  dataLabels: {enabled: false},
  data: [
    {x: 0, y: 120},
    {x: 1, total: true, dataLabels: {enabled: true}},
  ],
}
```

Set `dataLabels.placement` to `'auto'` to try `outside` first, then `inside-end`. In the [live example](#example), the **New** label moves inside because there is no room above its column. Pass an array to choose the order or use `['inside-center']` to center labels in the visible column.

When no position fits, `placementFallback: 'show'` shifts the first candidate toward the plot. Use `'hide'` to omit the label. With an automatic Y minimum, set `padding.min` to a size such as `'16px'` for extra room beyond the lowest value.

## Connectors

Connector lines between bars are enabled by default. Set `connectors.enabled: false` on the series to hide them. You can toggle this option when updating the chart.

## Colors

Set `positiveColor` and `negativeColor` to distinguish increases and decreases; `color` is used for totals. See [Colors](../colors.md).

## Legend

Legend items describe increases, decreases, and totals. Set `legend.itemText.positive`, `.negative`, and `.totals` on the series to name these roles. See [Legend](../legend.md).

## API reference

[WaterfallSeries](../../api/Series/Waterfall/interfaces/WaterfallSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
