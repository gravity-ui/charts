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
