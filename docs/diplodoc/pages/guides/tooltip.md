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

### Custom unit scales

For scaled values like bytes, SI prefixes, or time units, use the declarative `units` option instead of writing a custom formatter. The scale entry with the largest `factor` such that `|value| / factor >= 1` wins automatically.

Two forms are supported:

- **`{base, labels}`** — geometric progression: `labels[i]` is bound to `factor = base^i`. Great for bytes (base `1024`), SI decimal prefixes (base `1000`), and similar.
- **`{factor, label}[]`** — arbitrary factors. Required for non-linear scales like seconds/minutes/hours/days.

The `unitDelimiter` option controls the string placed between the value and the label (defaults to a locale-aware space; pass `''` to suppress it).

**Example:** Render raw byte counts as `B / KB / MB / GB / TB`.

```javascript
tooltip: {
  valueFormat: {
    type: 'number',
    precision: 1,
    units: {base: 1024, labels: ['B', 'KB', 'MB', 'GB', 'TB']},
  },
}
```

**Example:** Non-linear time scale — `45` → `"45 s"`, `90` → `"1.5 min"`, `3600` → `"1 h"`.

```javascript
tooltip: {
  valueFormat: {
    type: 'number',
    precision: 1,
    units: [
      {factor: 1, label: 's'},
      {factor: 60, label: 'min'},
      {factor: 3600, label: 'h'},
      {factor: 86400, label: 'd'},
    ],
    unitDelimiter: '', // renders "1.5min" instead of "1.5 min"
  },
}
```

### Custom formatter

When the built-in `number` and `date` formatters aren't enough — and the `units`
option above doesn't fit either — use `{ type: 'custom' }` to provide your own
formatter function. This is the right escape hatch when the output isn't a single
scaled number: locale-aware currency rendering, pluralization, value + delta
concatenation, or any other domain-specific shape.

The `formatter` receives `{value}` and must return a string. The same `ValueFormat`
shape is accepted in `tooltip.valueFormat`, `tooltip.headerFormat`, and `dataLabels.format`.

**Example:** Render a value as locale-aware currency with a signed delta against a
baseline (e.g. `"$1,234.56 (+2.3%)"` or `"1 234,56 € (−0,8 %)"`). This combines
`Intl.NumberFormat`'s `style: 'currency'` mode with a comparison that depends on
external state — neither piece is expressible declaratively.

```javascript
const BASELINE = 1000;

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  signDisplay: 'exceptZero',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const formatRevenue = ({value}) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  const delta = (amount - BASELINE) / BASELINE;
  return `${currency.format(amount)} (${percent.format(delta)})`;
};

{
  series: {
    data: [
      {
        type: 'line',
        name: 'Revenue',
        data: [/* y in USD */],
      },
    ],
  },
  tooltip: {
    valueFormat: {type: 'custom', formatter: formatRevenue},
  },
}
```

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
            units: {base: 1024, labels: ['B', 'KB', 'MB', 'GB', 'TB']},
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
