# Migrating from v1 to v2

This guide describes the migration implemented on the `release/v2` branch, using v1.70.0 as the compatibility baseline. It will be updated as the remaining compatibility decisions are resolved.

The current chart configuration removes axis `ticks.pixelInterval`, numeric formatting `unit`, and Bar-X/Bar-Y `dataLabels.inside`. Use the v1 adapter to convert existing configurations while preserving their behavior.

## Render an existing configuration {#render-v1}

The adapter is included in the package's ESM, CommonJS and TypeScript artifacts and is exported from the package root. The `V1` suffix identifies the source API version; it does not change for each package patch release.

It can also be imported independently as `@gravity-ui/charts/compat/v1`. That entry point has no runtime dependencies on React, chart rendering, the plugin registry or the plugins, so stored configurations can be processed without loading a chart. All migration rules live in this module.

```tsx
import {Chart, migrateChartDataV1} from '@gravity-ui/charts';
import type {ChartDataV1} from '@gravity-ui/charts';

const legacyData: ChartDataV1 = {
  yAxis: [
    {
      ticks: {pixelInterval: 60},
      labels: {numberFormat: {unit: 'k'}},
    },
  ],
  series: {
    data: [
      {
        type: 'line',
        name: 'Revenue',
        data: [
          {x: 1, y: 1500},
          {x: 2, y: 2000},
        ],
      },
    ],
  },
};

const {data, warnings} = migrateChartDataV1(legacyData);
// Pass data to <Chart data={data} />; show warnings in your own UI if desired.
```

The chart retains v1's compact labels and tick spacing:

<div data-chart-example="migration/v1"></div>

Run migration when the input configuration changes. In React, memoize the result by the input configuration. The adapter does not mutate the input, execute callbacks, or print to the console. Unchanged objects retain their references.

## Replace removed options in source code

The adapter also converts `maxPadding: 0.25` to `padding: {max: '25%'}`. It preserves `padding.min` and any explicitly configured `padding.max`, including `0` and `'auto'`. An explicitly undefined `maxPadding` is removed without overriding the default. This conversion requires [the companion percentage-padding change targeting `main`](https://github.com/gravity-ui/charts/pull/806); the former implementation of percentage padding is not equivalent.

These conversions produce `axis-max-padding` diagnostics with `resolution: 'automatic'`. Negative, non-finite or unrepresentable fractions produce `invalid-axis-max-padding` and remain unchanged.

For a positive `maxPadding` converted on a logarithmic axis, the diagnostic is `axis-max-padding-logarithmic` (also `automatic`). The conversion is applied, but the old orientation-dependent limits are deliberately not reproduced. For `[1, 100]` with `0.25`, the old maximum was approximately `102.16` or `168.38`; the new `'25%'` maximum is approximately `316.23` before rounding and other offsets. Surface this diagnostic when users need to review the visual change. An existing `padding.max`, zero fraction, or undefined fraction does not produce this behavior-change diagnostic.

Replace `ticks.pixelInterval: 120` with `ticks.interval: 120`. Numeric intervals are pixels. The adapter preserves v1's precedence when both fields are present: a truthy `interval` wins; otherwise `pixelInterval` is used.

For numeric formatting, use a unit scale with an empty delimiter to retain v1's spacing:

```ts
// Before
{type: 'number', unit: 'k'}

// After: every value is expressed in thousands, including values below 1000.
{
    type: 'number',
    units: {
        scale: [{factor: 1000, postfix: 'K'}],
        delimiter: '',
    },
}
```

For `unit: 'auto'`, use `{...FORMAT_UNITS_NUMBERS, delimiter: ''}` as `units`. The unmodified preset adds a space before the suffix, so it is not an exact replacement for v1. Fixed `m`, `b` and `t` units use factors `1e6`, `1e9` and `1e12` with suffixes `M`, `B` and `T`.

`unit: null` becomes a single-entry scale with factor `1` and an empty postfix. This also suppresses the implicit abbreviation on numeric axes. An existing `units` option keeps its v1 priority. An explicitly present `unit: undefined` preserves its ability to disable the default axis abbreviation.

## Replace bar label placement

For Bar-X and Bar-Y, replace `dataLabels.inside: true` with `placement: ['inside-center']` and `inside: false` with `placement: ['outside']`. The adapter keeps explicit `placement` settings. When migrating percent stacks without an explicit placement, it selects `['inside-center']` regardless of the old `inside` value, matching the old percent-stack rule.

This migration intentionally fixes label placement bugs: HTML inside labels are centered instead of shifted upward, and outside labels follow the value end of negative bars instead of always using the top or right edge. Those incorrect positions are not preserved. Funnel's `inside` setting remains supported and is not converted.

## Show migration warnings

Call `inspectChartDataV1` to collect warnings without applying changes:

```ts
import {inspectChartDataV1} from '@gravity-ui/charts';

const warnings = inspectChartDataV1(savedConfiguration);
```

Both functions return the same diagnostics for the original input. Each diagnostic contains:

- `code`: a machine-readable identifier that your UI can map to localized text.
- `path`: property names and array indices locating the option in the input.
- `message`: an English description.
- `resolution`: `automatic` for supported conversions, or `review` for unresolved cases.
- `replacement`: a suggested replacement when one is known; this does not promise equivalent behavior for `review` diagnostics.

Bar label conversions use `bar-label-inside`; invalid legacy values use `invalid-bar-label-inside` and remain unchanged.

For example, a removed tick option produces `code: 'axis-pixel-interval'` and `path: ['yAxis', 0, 'ticks', 'pixelInterval']`. Numeric units use `number-unit`; unrecognized legacy unit values use `invalid-number-unit` and remain unchanged.

Diagnostics run only when these functions are called. They do not add work to chart rendering or trigger UI notifications automatically. They report known v1 options, including removed fields, rather than arbitrary unknown properties. Use the [chart configuration schema](../integrations/chart-config.md) for JSON configuration validation. That schema excludes callbacks and is not a validator for executable React configurations.

## Options that remain supported

The following options remain supported and are not automatically rewritten:

- Bar-X/Scatter point `category`: deprecated; use explicit coordinates. This change leaves the field and raw point payloads intact (`point-category`).
- Click handlers: legacy point normalization, series metadata, the second event argument and the proposed default mode change require review (`click-handler-review`). Every configured handler is flagged; the inspector cannot determine which payload properties its function body reads.

This change does not remove those options, change the click default, or discontinue their support. A later change must either provide equivalent behavior or explicitly document the unsupported behavior and migration steps.

`tooltip.rowRenderer` remains supported and requires no migration. It customizes the resolved rows; `tooltip.rows` defines a replacement set of rows and serves a different purpose.

See [V2 compatibility decisions](./v2-compatibility.md) for reproducible issue drafts, observed differences and screenshots.

Custom payloads and callback bodies are not scanned. If a callback constructs an old formatting configuration, update that code using the examples above. The adapter covers the configuration passed to it, not arbitrary application code or every historical v1 release.
