# Adding a series plugin

A plugin owns its data preparation, geometry, rendering, defaults, and interaction. This example adds circles positioned in plot-relative pixels; axes and other capabilities can be added later.

{% note info %}

This guide covers adding a type to this repository. External registration and selective imports are not yet supported.

{% endnote %}

## 1. Define the configuration

Create `src/core/types/chart/sample.ts`:

```typescript
import type {BaseSeries, BaseSeriesLegend} from './base';

export interface SampleSeries extends BaseSeries {
  type: 'sample';
  name?: string;
  legend?: BaseSeriesLegend;
  data: {at: number; amount: number}[];
}
```

Keep specialized settings on this type. Add fields to `Base*` only when every series implements them.

## 2. Prepare and render

Create `src/plugins/sample/prepared-series.ts`. Shared chart code requires this metadata even when the legend is disabled:

```typescript
import type {BasePreparedSeries} from '~core/series/types';
import type {SampleSeries} from '../../types';

export interface PreparedSampleSeries extends BasePreparedSeries {
  type: SampleSeries['type'];
  data: SampleSeries['data'];
}
```

Then create `src/plugins/sample/index.ts`:

```typescript
import {select} from 'd3-selection';
import type {SeriesPlugin} from '~core/series/plugin';
import {prepareSeriesMetadata} from '~core/series/prepare-series-metadata';
import type {SampleSeries} from '../../types';
import type {PreparedSampleSeries} from './prepared-series';

interface SampleShape {
  x: number;
  y: number;
  color: string;
}

export const samplePlugin = {
  type: 'sample',
  prepareSeries: ({series, colorScale, legend}) =>
    series.map((raw) => ({
      ...prepareSeriesMetadata({series: raw, color: colorScale(raw.name ?? ''), legend}),
      type: raw.type,
      data: raw.data,
    })),
  prepareShapeData: ({series}) => ({
    renderData: series.flatMap((s) =>
      s.data.map((point) => ({x: point.at, y: point.amount, color: s.color})),
    ),
  }),
  renderShapes: ({plot, preparedData}) => {
    select(plot)
      .selectAll<SVGCircleElement, SampleShape>('circle')
      .data(preparedData)
      .join('circle')
      .attr('cx', (point) => point.x)
      .attr('cy', (point) => point.y)
      .attr('r', 3)
      .attr('fill', (point) => point.color);
    return () => plot.replaceChildren();
  },
} satisfies SeriesPlugin<{
  raw: SampleSeries;
  prepared: PreparedSampleSeries;
  shape: SampleShape;
}>;
```

`prepareSeriesMetadata` supplies common defaults and chart-unique IDs, retaining an explicit ID when the raw type provides one. Pass a resolved `symbol` for a custom legend symbol. A stable `legend.groupId` preserves selection across data updates.

Keep raw configuration and original points intact. Store derived values separately; use `withSourcePoint` for derived point copies and `getSourcePoint` for nested callback payloads. Hoist reusable calculations and DOM measurements out of point loops.

## 3. Connect the type

- Add `SampleSeries` to `ChartSeries` and `SampleSeries['data'][number]` to `ChartSeriesData` in `src/core/types/chart/series.ts`.
- Export the config type from `src/core/types/index.ts`; add the identifier to `src/core/constants/chart-types.ts`.
- Import and include `PreparedSampleSeries` in `PreparedSeries` in `src/core/series/types.ts`.
- Import `samplePlugin` and call `registerSeriesPlugin(samplePlugin)` in `src/plugins/index.ts`. Import any plugin styles from its own entry point.

After these changes, a chart can use:

```typescript
{
  series: {
    data: [{type: 'sample', name: 'Orders', data: [{at: 40, amount: 30}, {at: 80, amount: 60}]}],
  },
}
```

For namespace options, extend `ChartSeriesOptions`, add `options` to the plugin's type map, and provide `defaults`. Shape preparation and rendering receive defaults merged with user options; `prepareSeries` receives raw options and resolves its own fallbacks. Keep defaults immutable.

## 4. Add capabilities as needed

- **Labels and markers:** return `markers`, `annotations`, `htmlLabels`, and `getHoverMarkers` for core rendering. These can accompany empty `renderData`. Reserve label groups through `layoutData`; lower layers receive them as `otherLayers`. Draw SVG labels in `labelsPlot`.
- **Tooltip:** return explicit `tooltipItems` from `prepareShapeData`. Their payload type defaults to the geometry type; core never copies `renderData` into lookup output. Declare `tooltipItem` when the types differ. Use the plugin’s prepared series in every chunk.
- **Interaction:** independently implement `prepareNearestData` for chart queries and `getTargetElements` for painted SVG targets. Return original points; use `getClosestItem` for composite selections. Include permanent markers and exclude hover markers and labels.
- **Axes:** `axes: true` enables scalar X/Y coordinates; [SeriesAxes](https://github.com/gravity-ui/charts/blob/main/src/core/series/axis-contract.ts) supports custom domains and ticks. Guard absent scales, choose the series' Y axis (default `0`), and add the split plot's top once to projected Y. Reuse `getXValue`/`getYValue` from `core/shapes/utils.ts`.
- **Layout and viewport:** use `axisPadding` for label/paint reserves, `getLayerKey` for independent layers, and `getClipPath` for clipping. Declare zoom directions in `zoom`, reuse `filterPoints` for custom filtering, and provide `prepareGradientGeometry` for full-series paint references.

`tooltip.prepareData` returns either selected `{chunks}` or `{xLookupPoints}` for core X-column selection. Preserve formatter fields in every lookup point. Mark at most one chunk `closest`; when `measureDistance` is true, measure distance to drawn geometry for that chunk and every lookup point. Define `rows`, optional `getValue`, `header`, and `getValueFormatContext` for content and formatting.

Preparation may run for several layers and slider previews. Core calls render cleanup before container reuse or unmounting. Register delayed DOM work during rendering and respect `signal`; see [SeriesPlugin](https://github.com/gravity-ui/charts/blob/main/src/core/series/plugin.ts). Derive extracted hook arguments from `Parameters<SeriesPlugin<…>['prepareShapeData']>[0]` to reuse the type map.

The [custom-plugin fixture](https://github.com/gravity-ui/charts/blob/main/src/core/series/__tests__/fixtures/custom-plugin.ts) demonstrates separate render/lookup payloads, validation, tooltip, and interaction.

## 5. Verify and document

Test supported behavior through `Chart`: mixed series, legend selection, original-point callbacks, data replacement, resize, and cleanup. Reuse existing boundary tests; check any new layout math with empty, zero, oversized, and negative space. Test registration in isolation from Jest's built-in setup.

Run type checking, focused tests, Docker visual checks, and `npm run test:chart-config`; inspect changed snapshots, the standalone declaration, and JSON Schema. Add a Storybook story and a guide with a live `docs/examples` example for the supported configuration; see [Local development](../development.md#documentation-examples).

Keep series-specific decisions inside plugins. Extend the contract when necessary rather than adding series-name branches to shared runtime.
