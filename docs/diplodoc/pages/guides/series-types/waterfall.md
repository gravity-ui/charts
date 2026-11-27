# Waterfall series

Use a waterfall to show how successive gains and losses explain a closing balance. Each change starts where the previous one ended. A subtotal marks the balance at an intermediate step, and a total shows the closing balance. Both extend from zero. For independent values, use [Bar-X](bar-x.md).

## Example

Sales bring cash to 100 in March. Purchases take the balance below zero to −30 in June, and a refund brings the closing balance to −20. Select a legend item to explore the changes that contribute to those balances.

<div data-chart-example="series-types/waterfall"></div>

Supply points in the order in which the changes occur. On a category axis, use the category names as `x` values.

```js
{
    type: 'waterfall',
    name: 'Cash balance',
    subtotal: {name: 'Quarter end', color: '#6086c7'},
    data: [
        {x: 'Sales', y: 100},
        {x: 'March', role: 'subtotal'},
        {x: 'Purchases', y: -130},
        {x: 'June', role: 'subtotal'},
        {x: 'Refund', y: 10},
        {x: 'Closing', role: 'total'},
    ],
}
```

## Data

- For a **change**, supply a signed `y`. You can omit `role` or set it to `'change'`.
- For a **subtotal**, set `role: 'subtotal'`. The chart calculates the balance from all preceding visible changes, even across earlier subtotals. You can omit `y`.
- For a **total**, set `role: 'total'`.

{% note info %}

The boolean `total` flag is deprecated. Replace `total: true` with `role: 'total'`. For `total: false`, remove the flag or set `role: 'change'`.

A subtotal ignores its `y`, including `null`. Other points with `y: null` are skipped by default. Set `nullMode: 'zero'` to include them.

{% endnote %}

## Colors

Set `positiveColor` for increases and `negativeColor` for decreases. Totals use the series `color`, which defaults to a palette color. Subtotals inherit the total color. Set `subtotal.color` to distinguish quarter-end balances from the closing balance. See [Colors](../colors.md) for palette configuration.

To highlight one checkpoint, set its point color. The legend swatch keeps the group color.

```js
{x: 'June', role: 'subtotal', color: '#365891'}
```

## Legend

Enable the chart legend with `legend.enabled: true`. On the series, `legend.itemText` accepts names for `positive`, `negative`, and `totals`. When the data contains subtotals, they share one entry. Hiding that entry hides the checkpoints and preserves the closing balance. Hiding increases or decreases recalculates every visible balance.

Set `subtotal.name` to name both the legend entry and tooltip row. The default is `Subtotal`. Use `subtotal.legend.itemText` for a separate legend label, or `subtotal.legend.enabled: false` to keep the columns visible without offering a toggle. See [Legend](../legend.md) for selection behavior and layout.

## Label quarter-end balances

To label only checkpoints, turn off series labels and enable subtotal labels. These series options also show the balance to two decimal places in the tooltip.

```js
dataLabels: {enabled: false},
subtotal: {
    name: 'Quarter end',
    dataLabels: {enabled: true},
    tooltip: {valueFormat: {type: 'number', precision: 2}},
}
```

Subtotal labels inherit the series label format. Set `subtotal.dataLabels.format` to format checkpoint balances separately. To label a single point, set its `dataLabels.enabled` and, optionally, its `label`. See [Per-point override](../data-labels.md#per-point-override).

Subtotal tooltips inherit the series tooltip settings. To turn them off, set `subtotal.tooltip.enabled: false`. Change points still show their own value and running balance. A point’s `tooltip.enabled` overrides the group setting. Custom tooltips can read the computed balance from `subTotal`.

## Data label placement

<a id="data-label-placement"></a>

By default, labels appear outside the value end of each column. In this example, adaptive placement moves the refund and closing labels inside the columns at the lower edge.

<div data-chart-example="data-labels/waterfall-placement"></div>

```js
dataLabels: {
    placement: 'auto',
    placementFallback: 'hide',
}
```

With `'auto'`, the chart tries `'outside'` followed by `'inside-end'`. To choose your own order, pass an array of positions. Use `'inside-center'` to center a label within the visible column.

Each position must fit within the plot. Inside positions also need room for `dataLabels.padding` at both ends of the visible column. When none fits, the default fallback `'show'` shifts the first candidate into the plot. Use `'hide'` to omit the label.

{% note info %}

With an automatic Y-axis minimum, set `yAxis[0].padding.min` to a size such as `'16px'` to reserve room below the lowest value.

{% endnote %}

## Connectors

Connector lines show where the next change starts. To hide them, set `connectors.enabled: false` on the series.

## API reference

[WaterfallSeries](../../api/Series/Waterfall/interfaces/WaterfallSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
