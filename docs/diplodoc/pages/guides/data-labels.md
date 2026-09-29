# Data Labels

## Introduction

Data Labels are a feature used to display textual or numeric information directly on the chart's data points, such as bars, pie slices, or line markers. Their primary purpose is to make the visualization more readable and informative by explicitly showing the value, name, or a custom string associated with each element, eliminating the need to constantly cross-reference the axes. The configuration and behavior of data labels vary significantly between series types; for instance, on a column chart, they are typically placed at the top of each bar, while on a pie chart, they can be positioned outside the slices, connected by leader lines to avoid clutter.

For more granular control over the positioning and appearance of data labels for a specific series type, refer to the detailed configuration options within the series' own type definition. For example, see the `dataLabels` options for the [PieSeries](../api/Series/Pie/interfaces/PieSeries.md#properties).

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

## Placement

Line series can choose where a label goes and what to do when it does not fit — see [Data label placement](./series-types/line.md#data-label-placement) in the Line series guide.

## Stack total labels

For `bar-x`, `bar-y` and `area`, set `stackLabels: {enabled: true}` on a series or in `series.options[type]`. Totals are disabled by default. Series settings override plugin options; `style` is merged property by property.

Totals sum only **visible series with stack labels enabled** and update when legend visibility changes. `enabled: false` excludes a series from the sum. Percent stacks also show raw sums; positive and negative values have separate totals. Zero totals appear only for all-zero stacks.

Participants with the same type, `stackId` and value axis must have matching effective `style`, `format`, `padding` and `allowOverlap`; otherwise validation fails. Custom formats must share the same formatter function.

**Segment labels take priority over totals in the same plugin layer**, even for a small top segment: the overlapping total is hidden. Set `stackLabels.allowOverlap: true` to keep both labels. See [Value Formatting](./value-formatting.md#stack-totals) for `format`.

<div data-chart-example="data-labels/stack-labels"></div>
