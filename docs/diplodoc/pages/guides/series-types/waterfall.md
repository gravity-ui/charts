# Waterfall series

A waterfall series shows how positive and negative changes build a running total.

## When to use

Use it to explain a balance from opening to closing, such as cash flow, customer growth, or budget variance. Use [Bar-X](bar-x.md) for independent values.

## Example

<div data-chart-example="series-types/waterfall"></div>

## Data

Set `type: 'waterfall'`. Each change has an `x` position and a signed `y` value. Keep changes in their process order. Mark a total point with `total: true`; it displays the accumulated sum without adding another change.

Null values are skipped by default. Set `nullMode: 'zero'` to treat them as zero changes.

## Data label placement

<a id="data-label-placement"></a>

Labels are enabled by default and appear outside the value end. Use adaptive placement to move a label inside when it would extend beyond the plot. In this example, the opening balance is labeled above its column, while the refund and closing balance labels move inside near the lower edge.

<div data-chart-example="data-labels/waterfall-placement"></div>

```js
dataLabels: {
    placement: 'auto',
    placementFallback: 'hide',
}
```

With `'auto'`, the chart tries `'outside'` first, then `'inside-end'`. Pass an array to choose which positions to try and in what order.

- `'outside'` places the label beyond the value end.
- `'inside-end'` places the label inside the visible column, near the value end.
- `'inside-center'` centers the label in the visible column.

Every candidate must fit within the plot. Inside candidates must also fit within the visible column, with `dataLabels.padding` at both ends along the Y axis.

With `placement` set, `placementFallback` controls what happens when no candidate fits. The default `'show'` shifts the first candidate into the plot. Set `'hide'` to omit the label.

To label only the total, disable labels for the series and enable the label on the total point. See [Per-point override](../data-labels.md#per-point-override).

{% note info %}

With an automatic Y-axis minimum, set `yAxis[0].padding.min` to a size such as `'16px'` to reserve room for labels below the lowest value.

{% endnote %}

## Connectors

Connector lines between bars are enabled by default. Set `connectors.enabled: false` on the series to hide them. You can toggle this option when updating the chart.

## Colors

Set `positiveColor` and `negativeColor` to distinguish increases and decreases; `color` is used for totals. See [Colors](../colors.md).

## Legend

Legend items describe increases, decreases, and totals. Set `legend.itemText.positive`, `.negative`, and `.totals` on the series to name these roles. See [Legend](../legend.md).

## API reference

[WaterfallSeries](../../api/Series/Waterfall/interfaces/WaterfallSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
