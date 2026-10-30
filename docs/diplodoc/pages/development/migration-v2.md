# Migrating from v1 to v2

Version 2 replaces deprecated axis padding, tick spacing, numeric unit and bar label options. You can update these settings directly or use the migration adapter to convert existing configurations.

## Update dependencies

Install `@gravity-ui/charts@^2` together with `@gravity-ui/uikit@^8`. React and React DOM 18 or later are required. Follow the [UIKit migration guide](https://github.com/gravity-ui/uikit/blob/main/docs/migration-to-v8.md) when upgrading UIKit.

The package provides ESM and CommonJS builds through its public entry points. Import from `@gravity-ui/charts` or a documented subpath; replace imports that reach into `dist` or other internal directories.

## Render an existing configuration {#render-v1}

Import the migration adapter from `@gravity-ui/charts/migration/v1` and pass its result to the chart:

```tsx
import {Chart} from '@gravity-ui/charts';
import {migrateChartDataV1} from '@gravity-ui/charts/migration/v1';
import type {ChartDataV1} from '@gravity-ui/charts/migration/v1';

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

<Chart data={data} />;
```

The chart retains compact numeric labels and tick spacing:

<div data-chart-example="migration/v1"></div>

Run migration when the configuration changes. In React, memoize the result by the input configuration. The adapter does not mutate the input, execute callbacks or print warnings to the console. Unchanged objects retain their references.

The `/migration/v1` entry point also works in Node.js without loading React or chart plugins. `ChartDataV1` accepts the removed aliases; use `ChartData` for configurations that already use the v2 options.

## Replace removed options

### Tick spacing

Replace `ticks.pixelInterval: 120` with `ticks.interval: 120`. Numeric intervals are pixels. The adapter preserves v1's precedence when both fields are present: a truthy `interval` wins; otherwise `pixelInterval` is used.

### Numeric units

Replace `unit` with `units`. Use a fixed scale and an empty delimiter to retain v1's compact suffix:

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

For the other legacy values:

- `unit: 'auto'`: set `units` to `{...FORMAT_UNITS_NUMBERS, delimiter: ''}`, importing the preset from `@gravity-ui/charts`.
- `unit: 'm'`, `'b'` or `'t'`: use a fixed scale with factor `1e6`, `1e9` or `1e12` and suffix `M`, `B` or `T`.
- `unit: null`: use a fixed scale with factor `1`, an empty postfix and an empty delimiter. On numeric axes, this also disables automatic abbreviation.

An existing `units` scale keeps its priority. An omitted or `undefined` scale keeps automatic axis abbreviation.

{% note info %}

The `FORMAT_UNITS_NUMBERS` preset adds a space before the suffix by default. Set `delimiter: ''` to preserve v1's spacing.

In executable configurations, an explicitly present `unit: undefined` is migrated like `unit: null` and still disables automatic axis abbreviation.

{% endnote %}

### Bar label placement

For Bar-X and Bar-Y, replace `dataLabels.inside: true` with `placement: ['inside-center']` and `inside: false` with `placement: ['outside']`.

The adapter preserves explicit `placement` settings. For percent stacks without an explicit placement, it selects `['inside-center']` regardless of the old `inside` value, matching v1's behavior. Funnel's `inside` setting remains supported.

{% note info %}

Migrated HTML inside labels are centered correctly. Outside labels follow the value end of negative bars. The incorrect positions produced by the old options are not preserved.

{% endnote %}

## Migrate axis padding

`maxPadding` has been removed. Replace `maxPadding: 0.25` with `padding: {max: '25%'}`. Percentages extend the original axis domain before other padding and tick rounding.

The adapter converts this field automatically, preserves `padding.min` and keeps any explicit `padding.max`, including `0` and `'auto'`. See [axis padding](../guides/axes/index.md#axis-padding) for the replacement options and their interaction with explicit limits.

{% note info %}

On datetime Y axes with explicit `timestamps`, v1 ignored `maxPadding`. The adapter removes it without adding padding and preserves any explicit `padding` settings.

The new padding calculation fixes axis direction and zoom handling: zoomed boundaries stay fixed, and category axes ignore padding. On logarithmic axes, percentage padding extends the logarithmic range. For a domain of `[1, 100]`, `'25%'` produces an upper bound of approximately `316.23` before tick rounding and other offsets. The old orientation-dependent result was a bug and is not preserved. Adjust the percentage or set explicit axis limits if needed.

{% endnote %}

## Validate stored JSON configurations {#json-validation}

The v2 [JSON Schema](../integrations/chart-config.md) rejects the removed aliases. Convert a saved v1 configuration **before** validating it with this schema. For example, in Node.js with Ajv:

```js
const Ajv = require('ajv');
const schema = require('@gravity-ui/charts/chart-config.schema.json');
const {migrateChartDataV1} = require('@gravity-ui/charts/migration/v1');

const validate = new Ajv({strict: false, allowUnionTypes: true}).compile(schema);
const {data, warnings} = migrateChartDataV1(JSON.parse(savedJson));

if (!validate(data)) {
  throw new Error(JSON.stringify(validate.errors));
}

// Pass data to the chart; display warnings in your application as needed.
```

Migration converts known aliases and leaves other fields intact. It does not validate the whole configuration: invalid legacy values produce `review` diagnostics, and unknown properties still fail schema validation. The schema covers JSON configurations; use TypeScript types for configurations containing callbacks.

For a JSON editor, migrate its document before attaching the v2 schema. Importing the adapter does not change the schema or enable automatic conversion inside the editor.

## Review migration warnings

Both migration functions return structured diagnostics for the original input. To inspect a configuration without changing it, call `inspectChartDataV1`:

```ts
import {inspectChartDataV1} from '@gravity-ui/charts/migration/v1';

const warnings = inspectChartDataV1(savedConfiguration);
```

Each diagnostic contains:

- `code`: an identifier your application can map to localized text.
- `path`: property names and array indices locating the option in the input.
- `message`: an English description.
- `resolution`: `automatic` for applied conversions, or `review` for cases that need attention.
- `replacement`: a suggested replacement, when known.

For example, a removed tick option produces `axis-pixel-interval` at `['yAxis', 0, 'ticks', 'pixelInterval']`. Axis padding, numeric unit and bar label conversions produce `axis-max-padding`, `number-unit` and `bar-label-inside`. Invalid legacy values remain unchanged and produce `invalid-axis-max-padding`, `invalid-number-unit` or `invalid-bar-label-inside` with `resolution: 'review'`.

Bar-X and Scatter point `category` remains supported but deprecated; the adapter reports `point-category` and preserves raw point fields. Click handlers also remain supported with the same default mode and callback arguments. `tooltip.rowRenderer` remains supported and needs no migration.

Diagnostics are returned only when you call the adapter or inspector. Custom payloads and callback bodies are not scanned. If a callback constructs an old formatting configuration, update that code directly.
