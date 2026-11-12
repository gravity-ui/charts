# Adding a series plugin

Add a series type in `src/plugins/<type>/`. Its plugin owns data preparation, geometry, rendering, styles, defaults, and interaction. Core combines plugins into a chart.

{% note info %}

This guide covers adding a built-in type to the repository. External registration and selective imports are not yet supported.

{% endnote %}

## 1. Define the data and plugin

Define the raw series and point types, then decide which features the series supports: axes, mixed charts, labels, tooltip, zoom, and range-slider previews. Follow existing config names and defaults. Put specialized options on the new series type; add fields to `Base*` only when every series implements them.

Implement [SeriesPlugin](https://github.com/gravity-ui/charts/blob/main/src/core/series/plugin.ts). Its main flow is:

1. `prepareSeries` resolves raw configuration into prepared series.
2. `prepareShapeData` produces render geometry and private tooltip/interaction lookup data.
3. `renderShapes` draws geometry into `plot` and SVG labels into `labelsPlot`.

Keep implementation files and styles in the plugin directory; import styles from its entry point. Reuse core's geometry, label, marker, and measurement helpers.

Use one type map with `SeriesPlugin`. A minimum declaration needs only raw series, prepared series, and geometry types:

```typescript
const samplePlugin = {
  type: 'sample',
  prepareSeries,
  prepareShapeData,
  renderShapes,
} satisfies SeriesPlugin<{
  raw: SampleSeries;
  prepared: PreparedSampleSeries;
  shape: SampleShape;
}>;
```

Add `options` for the plugin's config namespace. Lookup defaults to geometry; specify `tooltipItem` when they differ. Tooltip chunks default to raw points with prepared series metadata; specify `tooltipChunk`, `formatContext`, or `interaction` for different payloads. Mixed-chart context is opaque unless explicitly described with `allRaw`/`allPrepared`.

Every plugin uses the same contract. See the [custom-plugin fixture](https://github.com/gravity-ui/charts/blob/main/src/core/series/__tests__/fixtures/custom-plugin.ts) for the minimal declaration and optional adapters.

## 2. Prepare and render the series

Prepared series must include `BasePreparedSeries` metadata, even with the legend disabled. Use `prepareSeriesMetadata` from `core/series/prepare-series-metadata.ts` for common defaults, then add the plugin's `type` and prepared data. For example, inside the plugin declaration:

```typescript
prepareSeries: ({series, colorScale, legend}) =>
    series.map((raw) => ({
        ...prepareSeriesMetadata({
            series: raw,
            color: colorScale(raw.name ?? ''),
            legend,
        }),
        type: raw.type,
        data: raw.data,
    })),
```

The helper accepts a resolved color and an optional resolved legend symbol. IDs must be chart-unique across preparation calls and layers; the helper generates them and retains an explicit ID when the raw type provides one. Core rejects duplicate IDs. Use `legend.groupId` to preserve legend selection across data updates.

`prepareShapeData` returns private `renderData` for rendering. Supply `tooltipItems` when tooltip or interaction needs lookup data; core retains their owner separately, so they need no `type` or `series` field. Both fields can use different structures.

Return `markers`, `annotations`, `htmlLabels`, and `getHoverMarkers` only when needed; core renders these separately from the geometry. Use `layoutData` to reserve label groups for lower layers through their `otherLayers` input. SVG labels stay in render geometry or the layer-wide `labels` field.

Preserve raw configuration and original points. Store derived values separately, register derived point copies with `withSourcePoint`, and use `getSourcePoint` for nested callback payloads. Hoist reusable calculations and DOM measurements out of point loops.

Preparation can run for several layers and slider previews. Core calls render cleanup before reusing a container or unmounting. Register delayed DOM work during rendering and respect the cancellation signal; see [RenderShapesArgs](https://github.com/gravity-ui/charts/blob/main/src/core/series/plugin.ts).

## 3. Add tooltip and interaction

`tooltip.prepareData` returns one selection strategy:

- `{chunks}`: the plugin selects tooltip chunks itself.
- `{xLookupPoints}`: core selects points in the nearest X column. Each point must carry the chunk's required fields, including formatter context.

Do not return both strategies. Multiple chunks and multiple rows per chunk are supported. Mark at most one selected chunk `closest`; when `measureDistance` is true, provide distance to the drawn geometry for that chunk and every X lookup point. Core resolves the active chunk across plugins, preferring the upper layer on equal distance. Reuse core's geometry helpers and cache reusable contours.

Define `tooltip.rows` for displayed content, `getValue` for sorting/totals, and optional `header` and `getValueFormatContext` for formatting. Return raw values and resolve category indices to names. Reuse helpers from `core/tooltip/utils.ts`.

Tooltip and interaction are independent optional capabilities. For chart queries and clicks, implement `interaction.prepareNearestData` with unfiltered reference positions and `getTargetElements` with painted SVG geometry. Map every target to its original point and series. Include permanent markers; exclude labels and hover markers. Use `getClosestItem` for composite selections.

## 4. Register and verify

- Register the plugin in [plugins/index.ts](https://github.com/gravity-ui/charts/blob/main/src/plugins/index.ts).
- Extend the raw series/options unions and public type exports. Add the prepared type to `core/series/types.ts`.
- Expose namespace defaults through `plugin.defaults`. Shape preparation and rendering receive defaults merged with user `series.options`. `prepareSeries` receives raw options and resolves its own fallbacks; apply individual series and point overrides there. Keep defaults and input immutable.
- Add focused tests for supported features, including mixed charts, visibility/data updates, resize, and relevant zoom/slider behavior. Check empty data and zero-sized plots. Test registration separately from Jest's automatic built-in setup.
- Run type checking, focused unit tests, Docker visual tests, and `npm run test:chart-config`. Inspect changed snapshots, the standalone declaration, and JSON Schema.
- Add a Storybook story and a user guide with a live `docs/examples` example. See [Local development](../development.md#documentation-examples).

Keep series-specific behavior in the plugin. Extend the contract when needed; do not add series-name branches or plugin implementation imports to shared runtime.

## Additional capabilities

Use these only when the new series needs them:

- **Axes:** `axes: true` enables scalar X/Y coordinates. For custom coordinates, domains, or ticks, use [SeriesAxes](https://github.com/gravity-ui/charts/blob/main/src/core/series/axis-contract.ts). Core selects visible contributions and combines requests. Guard absent scales, select the series' Y axis (default `0`), and add its split plot's top once to projected Y. Reuse `getXValue`/`getYValue` from `core/shapes/utils.ts` for scalar/category projection.
- **Padding:** `axisPadding` reserves label space before the initial X scale and measures paint extents before scale fitting. Follow the units and precedence in [SeriesAxisPadding](https://github.com/gravity-ui/charts/blob/main/src/core/series/plugin.ts); account for split-plot origins.
- **Zoom:** declare supported directions in `zoom`. Use `filterData` for custom coordinates or retained path anchors, reusing `filterPoints` from `core/zoom/filter-data.ts`. Keep filtering, domains, sorting, and missing-value handling consistent with rendering.
- **Layers:** the default is one layer per plugin type. `getLayerKey` selects independent layers or groups; `getClipPath` controls shape/SVG-label clipping. Preserve stack/group geometry when partitioning layers.
- **Gradients:** provide `prepareGradientGeometry` when paints need a full-series reference across viewport changes.

The [plugin contract](https://github.com/gravity-ui/charts/blob/main/src/core/series/plugin.ts) documents capability arguments, results, and defaults.
