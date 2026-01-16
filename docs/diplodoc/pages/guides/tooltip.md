# Tooltip

## Introduction

Tooltips are contextual overlays that appear when a user hovers, focuses, or taps a chart element. They reveal precise values and metadata—such as categories, timestamps, and related metrics—without adding labels to every mark, keeping visuals clean while enabling on‑demand detail.

For the full list of properties, see the [API reference](../api/Configuration/interfaces/ChartTooltip.md).

## Totals

Totals add an aggregate row to the tooltip (for example, the sum across all visible series for the hovered category). This is especially useful on grouped or stacked charts: the tooltip lets users see each series’s contribution and the overall total at a glance.

```javascript
tooltip: {
  totals: {
    enabled: true,
  }
}
```

With the configuration above, your chart should look like this:

<iframe
    src="https://preview.gravity-ui.com/charts/iframe.html?id=other-tooltip--totals-sum"
    width="100%"
    height="320"
	style="border: none;"
    ></iframe>

By default, the totals row shows the sum across all visible series for the hovered category. You can customize this behavior by providing a custom aggregation, setting your own label, and adjusting value formatting.

The example below shows a tooltip displaying the maximum value among the selected points.

```javascript
tooltip: {
  totals: {
    enabled: true,
    label: 'Max value:',
    aggregation: ({hovered}) => Math.max(...hovered.map((item) => item.data.y)),
    valueFormat: {
      type: 'number',
      precision: 1,
    },
  }
}
```

## Hiding specific series from the tooltip

There are scenarios where you might want to display a chart with multiple data series but exclude specific ones from the tooltip. This is useful for providing a cleaner, more focused user experience, especially when certain series are used for contextual or decorative purposes rather than for precise data reading.

A common example is a chart combining a line series (e.g., representing an average or a target) with column series (e.g., representing actual values). The tooltip is most valuable for the actual values, while the average line provides context but doesn't require precise interaction.

You can control the visibility of series in the tooltip by setting the `tooltip.enabled` property at the individual series level. Series where this property is set to false will not trigger or appear in the tooltip.

**Example:** A chart showing monthly sales (columns) and a yearly average line. We want the tooltip to only display the sales data.

```javascript
series: {
  data: [
    // Series 1: Column series for actual sales (should show in tooltip)
    {
      name: 'Monthly Sales',
      type: 'bar-x',
      data: [ ... ],
    },
    // Series 2: Line series for average (should be hidden from tooltip)
    {
      name: 'Yearly Average',
      type: 'line',
      data: [ ... ],
      tooltip: {
        enabled: false
      }
    }
  ];
}
```

In this example:

- Hovering over a column will display a tooltip with only the "Monthly Sales" data for that month.
- Hovering directly over the "Yearly Average" line will not trigger a tooltip.

## Value Formatting

The tooltip displays values from your data series. While these can be of different types (strings, dates, etc.), numeric values are most common. By default, numbers are shown as-is, but you can customize their formatting using the `valueFormat` property, which accepts a [FormatNumberOptions](../api/Utilities/interfaces/FormatNumberOptions.md) object. This is useful for controlling decimal precision, formatting large numbers, percentages, and more.

**Example:** For percentage values, use `type: 'number'` with `format: 'percent'`.The formatter automatically multiplies the value by 100 and adds the % symbol. Use precision to control the number of decimal places.

```javascript
series: {
  data: [
    {
      type: 'line',
      data: [{x: 1, y: 0.156}, {x: 2, y: 0.234}, {x: 3, y: 0.389}], // Values as decimal fractions
      name: 'Conversion Rate',
    },
  ],
},
tooltip: {
  valueFormat: {
    type: 'number',
    format: 'percent',
    precision: 1, // Will display: 15.6%, 23.4%, 38.9%
  },
}
```
