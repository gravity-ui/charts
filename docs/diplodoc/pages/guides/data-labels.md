# Data Labels

## Introduction

Data Labels are a feature used to display textual or numeric information directly on the chart's data points, such as bars, pie slices, or line markers. Their primary purpose is to make the visualization more readable and informative by explicitly showing the value, name, or a custom string associated with each element, eliminating the need to constantly cross-reference the axes. The configuration and behavior of data labels vary significantly between series types; for instance, on a column chart, they are typically placed at the top of each bar, while on a pie chart, they can be positioned outside the slices, connected by leader lines to avoid clutter.

For more granular control over the positioning and appearance of data labels for a specific series type, refer to the detailed configuration options within the series' own type definition. For example, see the `dataLabels` options for the [PieSeries](../api/Series/Pie/interfaces/PieSeries.md#properties).

For adaptive bar labels, see [Bar-Y placement](./series-types/bar-y.md#data-label-placement), [Bar-X placement](./series-types/bar-x.md#data-label-placement), and [Waterfall placement](./series-types/waterfall.md#data-label-placement).

For line labels, see [placement](./series-types/line.md#data-label-placement) and [marker boundary anchoring](./series-types/line.md#marker-boundary).

## Enabling and Disabling Data Labels

Whether labels are displayed by default depends on the series type. However, this behavior can be manually overridden. For all series, the dataLabels configuration section contains an enabled property, which provides direct control over their visibility.

**Example:** disable data labels for a pie chart

```javascript
series: {
  data: [{
    type: 'pie',
    dataLabels: {
        enabled: false
    },
    data: [ ... ]
  }]
}
```

## Per-point override

In addition to the series-level setting, you can control the label visibility for a specific point by setting `dataLabels.enabled` on the data point. The point-level value takes precedence over the series-level one: `false` hides the label even when the series has labels enabled, and `true` shows the label for that single point even when the series has labels disabled.

**Example:** show data labels for the whole series except for one specific bar.

```javascript
series: {
  data: [
    {
      type: 'bar-x',
      dataLabels: {enabled: true},
      data: [
        {x: 0, y: 120},
        // This bar's label is hidden
        {x: 1, y: 90, dataLabels: {enabled: false}},
        {x: 2, y: 150},
      ],
    },
  ];
}
```

**Example:** keep labels off for the series and opt only specific points in.

```javascript
series: {
  data: [
    {
      type: 'bar-x',
      // No `dataLabels` at series level
      data: [
        {x: 0, y: 120},
        // Only this bar gets a label
        {x: 1, y: 90, dataLabels: {enabled: true}},
        {x: 2, y: 150},
      ],
    },
  ];
}
```

## Stack total labels

For `bar-x`, `bar-y` and `area`, set `stackLabels: {enabled: true}` on a series or in `series.options[type]`. Totals are disabled by default. Series settings override plugin options; `style` is merged property by property.

By default (`'perSign'`), `100` in sales and `-30` in refunds produce two labels. Set `mode: 'allSigns'` to show one total of `70` for the stack at that category or X value.

```ts
stackLabels: {
  enabled: true,
  mode: 'allSigns',
}
```

Totals use points from **visible series with stack labels enabled** and update when you show or hide a series in the legend. The default aggregation uses raw values, including on percent stacks.

Participants with the same type, `stackId` and value axis must have matching effective `mode`, `aggregation`, `style`, `format`, `padding` and `allowOverlap`; otherwise validation fails. Custom aggregations and formats must share the same callback function.

**Stack totals take priority over segment labels of the same series type.** An overlapping segment label is hidden unless its `dataLabels.allowOverlap` is `true`. Overlap between stack totals is controlled by `stackLabels.allowOverlap` (default: `false`). See [Value Formatting](./value-formatting.md#stack-totals) for `format`.

<div data-chart-example="data-labels/stack-labels"></div>

The combined label uses the outer edge of the positive part of the stack when available. For stacks with only negative values, it uses the negative edge. See [Area gaps and isolated points](#area-gaps-and-isolated-points) for placement at gaps.

In `'perSign'` mode, a separate zero total is hidden when the same stack has negative values. This rule uses the original axis values, independently of the result of a custom aggregation.

### Custom stack totals

Set `stackLabels.aggregation` to a callback receiving `{points}` to calculate totals from custom data. The points passed to the callback depend on [`stackLabels.mode`](#stack-total-labels). The default aggregation is `'sum'`.

Here, stack height shows revenue while the total label sums `custom.orders`. Formatting and positioning stay unchanged.

<div data-chart-example="data-labels/stack-labels-aggregation"></div>

The callback must return a finite number. Returning `NaN`, `Infinity` or `-Infinity` hides the total label.

Returning `0` from the callback does not by itself hide the label. For example, a positive stack can display a custom total of `0`.

### Area gaps and isolated points

Both the default sum and custom aggregation include real points on both sides of an area gap, including points isolated between two nulls. Synthetic points added during layout are excluded.

In `'allSigns'` mode, the label uses the positive area boundary or a visible positive marker. At a gap, it can fall back to the negative area boundary or a visible negative marker, then to a visible zero marker. A boundary outside the plot hides its label. Isolated points without a visible marker can still contribute to the total.
