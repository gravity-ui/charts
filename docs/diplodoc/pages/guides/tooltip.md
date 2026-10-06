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

### Interval series

For `x-range`, built-in totals sum interval durations, `Math.abs(Number(x1) - Number(x0))`, and sorting by `value` orders intervals by that duration. The Y category is a row label. Tooltip rows continue to display the start and end values. Timestamp boundaries produce durations in milliseconds.

For `area-range`, totals and sorting use the width `y1 - y0`. Both types sum individual widths, including overlaps; totals do not compute the union of intervals.

In the example below, hover over the overlapping bars in the middle. The tooltip sorts intervals from shortest to longest and shows a total duration of 19.

<div data-chart-example="tooltip/x-range-values"></div>

## Multiple Y axes and custom content

Custom `renderer`, `rowRenderer`, and `totals.aggregation` callbacks receive
all Y axes in `yAxes`. To reuse default content, pass the renderer arguments to
`ChartTooltipContent`. Its `yAxes` prop resolves values using each series'
assigned axis; if omitted, it falls back to `yAxis`. The example excludes
category values from the numeric total.

<div data-chart-example="tooltip/multiple-y-axes"></div>

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

## Hiding individual points from the tooltip

For more granular control, you can hide a specific point — instead of a whole series — by setting `tooltip.enabled` on the data point itself. The point-level setting takes precedence over the series-level one: `false` hides the point even when the series is shown, and `true` shows the point even when the series is hidden from the tooltip.

```javascript
series: {
  data: [
    {
      name: 'Monthly Sales',
      type: 'bar-x',
      data: [
        {x: 0, y: 120},
        // This bar is excluded from the tooltip
        {x: 1, y: 90, tooltip: {enabled: false}},
        {x: 2, y: 150},
      ],
    },
  ];
}
```

## Value Formatting

Tooltip rows, header, and totals accept a `valueFormat` / `headerFormat` shaped
as [ValueFormat](../api/Utilities/type-aliases/ValueFormat.md). Formatting works
the same way as everywhere else in the chart (data labels, axis labels, etc.) —
see the [Value formatting](./value-formatting.md) guide for the full reference,
the `units` option, custom formatters, and examples.

The default tooltip omits its header when the axis value is `null`, `undefined`,
or a category index cannot be resolved. On category axes, a custom header
formatter is called only when the header value is available. On linear/datetime
axes and radar charts, a custom formatter can return a placeholder for a missing value.

### Per-series override

The value format set on `tooltip.valueFormat` applies to every series in the chart.
If a specific series needs a different format — for example, when the chart mixes
bytes, durations, and counts — override it via `series.tooltip.valueFormat`. The
series-level setting takes precedence over the chart-level one for that series only.

```javascript
{
  series: {
    data: [
      {
        type: 'line',
        name: 'Bandwidth',
        data: [/* y in bytes */],
        tooltip: {
          valueFormat: {
            type: 'number',
            precision: 1,
            units: {scale: {base: 1024, postfixes: ['B', 'KB', 'MB', 'GB', 'TB']}},
          },
        },
      },
      {
        type: 'line',
        name: 'Requests',
        data: [/* ... */],
        // falls back to tooltip.valueFormat below
      },
    ],
  },
  tooltip: {
    valueFormat: {type: 'number', precision: 0},
  },
}
```
