# Value Formatting

Chart values can appear in several places: tooltip rows, data labels rendered on
the shapes themselves, axis tick labels, and totals. All of these accept the
same [ValueFormat](../api/Utilities/type-aliases/ValueFormat.md) shape, so you
configure formatting once and apply it consistently across the chart.

`ValueFormat` is a tagged union with three variants:

- `{ type: 'number', ... }` — numeric formatting driven by
  [FormatNumberOptions](../api/Utilities/interfaces/FormatNumberOptions.md).
- `{ type: 'date', format }` — date/time formatting via a
  [Day.js format string](https://day.js.org/docs/en/display/format).
- `{ type: 'custom', formatter }` — an escape hatch that lets you return any
  string from a user-supplied function.

Where to set it:

| Surface           | Option                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| Tooltip row value | `tooltip.valueFormat`, or `series.tooltip.valueFormat` for per-series override |
| Tooltip header    | `tooltip.headerFormat`                                                         |
| Tooltip totals    | `tooltip.totals.valueFormat`                                                   |
| Data labels       | `series.dataLabels.format`                                                     |
| Axis tick labels  | `xAxis.labels.numberFormat` / `yAxis.labels.numberFormat` (numeric axes only)  |

## Numbers

Use `type: 'number'` for numeric values. The most common options are `precision`
(fixed decimal places or `'auto'`), `showRankDelimiter` (thousands separator),
`prefix`/`postfix`, and `multiplier`.

**Example:** Percentage values. Pass `format: 'percent'` and store your data as
decimal fractions — the formatter multiplies by 100 and appends `%`.

```javascript
series: {
  data: [
    {
      type: 'line',
      data: [{x: 1, y: 0.156}, {x: 2, y: 0.234}, {x: 3, y: 0.389}],
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

For scaled values like bytes, SI prefixes, or time units, use the declarative
`units` option instead of writing a custom formatter. The scale entry with the
largest `factor` such that `|value| / factor >= 1` wins automatically.

`units` is an object with two fields: `scale` (the unit table) and an
optional shared `delimiter`. The `scale` itself accepts two forms:

- **`{base, postfixes}`** — geometric progression: `postfixes[i]` is bound to
  `factor = base^i`. Great for bytes (base `1024`), SI decimal prefixes
  (base `1000`), and similar.
- **`{factor, postfix}[]`** — arbitrary factors. Required for non-linear scales
  like seconds/minutes/hours/days.

`delimiter` is placed between the scaled value and the postfix (defaults to
a locale-aware space; pass `''` to suppress it).

**Example:** Render raw byte counts as `B / KB / MB / GB / TB`.

```javascript
tooltip: {
  valueFormat: {
    type: 'number',
    precision: 1,
    units: {
      scale: {base: 1024, postfixes: ['B', 'KB', 'MB', 'GB', 'TB']},
    },
  },
}
```

**Example:** Non-linear time scale — `45` → `"45s"`, `90` → `"1.5min"`,
`3600` → `"1h"`. Here `delimiter: ''` glues the number and the postfix.

```javascript
tooltip: {
  valueFormat: {
    type: 'number',
    precision: 1,
    units: {
      scale: [
        {factor: 1, postfix: 's'},
        {factor: 60, postfix: 'min'},
        {factor: 3600, postfix: 'h'},
        {factor: 86400, postfix: 'd'},
      ],
      delimiter: '',
    },
  },
}
```

## Dates

Use `type: 'date'` with a Day.js format string to render timestamps.

```javascript
tooltip: {
  headerFormat: {type: 'date', format: 'DD MMMM YYYY'},
}
```

## Custom formatter

When the built-in `number` and `date` formatters aren't enough — and the
`units` option above doesn't fit either — use `{ type: 'custom' }` to provide
your own formatter function. This is the right escape hatch when the output
isn't a single scaled number: locale-aware currency rendering, pluralization,
value + delta concatenation, or any other domain-specific shape.

The `formatter` receives `{value}` and must return a string. The same
`ValueFormat` shape is accepted everywhere values are formatted — tooltip
rows, tooltip headers, data labels, totals.

**Example:** Render a value as locale-aware currency with a signed delta
against a baseline (e.g. `"$1,234.56 (+2.3%)"` or `"1 234,56 € (−0,8 %)"`).
This combines `Intl.NumberFormat`'s `style: 'currency'` mode with a comparison
that depends on external state — neither piece is expressible declaratively.

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
