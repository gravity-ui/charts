# Chart interactions and tooltip separation

Status: agreed direction, implemented for evaluation on this branch. Not released.

Tracked in the [next major release plan](NEXT_MAJOR_PLAN.md). Product context: [issue #767](https://github.com/gravity-ui/charts/issues/767).

## Problem

The existing `chart.events.click` callback receives `({point, series}, event)`. Selection comes from tooltip lookup and picks the first chunk marked `closest`. It neither reliably identifies a rendered element under the pointer nor exposes other elements at that position.

Global tooltip visibility does not itself disable lookup. Point- and series-level settings filter candidates and can suppress the callback. Click delivery and tooltip pinning also share the same handler flow.

The bar-navigation scenario needs exact hits without tooltips. Other applications need nearest selection, covered elements, or the same selection as the legacy handler. Computing every interpretation for every click is unnecessary.

## Target public contract

```ts
chart: {
    events: {
        click: ({targets, position, event, chart}) => {
            const target = targets[0];
            if (target && isIssueTarget(target)) {
                openIssues(target.point.custom);
            }
        },
    },
}
```

`isIssueTarget` is an application type guard narrowing the whole interaction item to a navigable bar. Narrowing only the nested `series.type` does not necessarily narrow `point` in TypeScript.

The event supplies:

- `targets: ChartInteractionItem[]`: exact hits, provided for every click.
- `position: [number, number]`: pixels relative to the main plot's top-left corner.
- `event: MouseEvent`: the native browser click event, including clicks produced by taps.
- `chart: ChartApi`: the stable public query API, also available through the component ref. Queries take explicit plot-relative coordinates and use the current chart state. Returned items describe the data at query time.

```ts
interface ChartApi {
  getClosest(
    position: [number, number],
    options?: {mode?: 'chart' | 'tooltip'},
  ): ChartInteractionItem | null;
}
```

`targets` contains all exact hits, including covered elements, in current paint order from uppermost to lowest. An empty array means no interactive series geometry was hit. Use the first item for navigation that must not pass through another series.

`chart.getClosest(position)` defaults to `mode: 'chart'`: the minimum Euclidean distance in plot-relative pixels across all eligible plugin reference positions, without point/series tooltip enablement filtering. Plugins enumerate candidates without preselecting by X or containment. References are point coordinates, rectangle centers, area/range vertical midpoints, radar vertices, pie mid-angle/mid-radius positions, and Sankey node centers or link path midpoints. Exact contours belong to `targets`. Equal distances follow the chart's prepared series/layer order, then candidate order. Empty plot space can still have a nearest item.

`chart.getClosest(position, {mode: 'tooltip'})` uses the legacy click handler's selection policy and eligibility. It does not read the currently displayed or pinned tooltip. Global tooltip visibility, sorting, and a custom renderer do not change this selection.

Exact hit detection runs for every delivered click when an application callback is registered. Nearest selection runs on demand for the supplied position against the current rendered data. Queries do not cache results across calls or chart updates. Exact hits do not implicitly calculate nearest selection or tooltip membership. There are no `closest` or `inTooltip` flags on hits. Existing internal tooltip/legacy lookup still runs for its own consumers during migration.

### Meaning of point

Each result has mandatory `series` metadata (`type`, prepared `id`, `name`, optional `custom`) and a series-specific `point`. The metadata is not a promise to return the full original series configuration.

`point` describes a selected visualization element's data, not an SVG node or internal geometry. It need not be an original object from `series.data`:

- Bars, slices, heatmap cells, treemap nodes, funnel segments, waterfall columns, intervals, and ordinary scatter markers expose their selected data.
- Scatter clusters retain the existing `cluster.points` source membership.
- Exact hits on an entire line, area, area range, or radar polygon expose `{kind: 'shape', points}`. A normal marker exposes its own point. Hover markers and halos are decoration and do not add targets.
- Sankey nodes expose node data. Links expose `{kind: 'link', source, target, value}`. The new nearest query selects nodes or links, while deprecated fields retain the old source-node payload for links.

Do not silently label an endpoint as an exact hit on an entire segment or filled area. Keep raw fields and metadata separate from geometry; existing prepared data normalization remains part of the selected point's series-specific behavior. Do not promise universal source-object identity.

### Delivery and overlap

Deliver callbacks for clicks in the main plot, including positions with no exact hit or nearest candidate. Tooltip candidate availability and pinning do not gate delivery. Existing chart validation of completely empty input is unchanged.

Respect contours, clipping, and current DOM paint order. Merge fill and border hits belonging to one logical element. Labels, connectors, grid lines, annotations, hover decorations, and range-slider previews are not series targets. Tooltip rendering and pinning keep their own existing behavior.

Click and tap use the same contract. Existing zoom/drag handling remains responsible for suppressing clicks generated by chart gestures.

## Transition implemented before the major

Add `targets`, `position`, `event`, and `chart` to the first argument. Extend `ChartRef` with the same public `ChartApi` queries; the callback receives the same object as the ref. Retain top-level `point`, `series`, and the second argument. Mark legacy fields `@deprecated`; document the second argument's deprecation in callback TSDoc and the guide.

Legacy fields retain the previous tooltip-derived values. They can be `undefined` on newly delivered clicks with no legacy candidate. They must not be aliases of the independent chart selection or of new Sankey link payloads.

**Invocation conditions change now**, as explicitly agreed: no compatibility opt-in. Applications with legacy handlers must guard absent `point`/`series`. This behavior change is documented alongside the deprecations.

## Breaking changes in the next major

1. Remove top-level `point` and `series`. Choose exact hits or `chart.getClosest(position, {mode: 'tooltip'})` explicitly.
2. Remove the second callback argument. Read `payload.event` for the native event.
3. Remove the public second-argument `PointerEvent` promise that currently differs from the actual React event delivered there. Preserve its runtime behavior during transition.

Do not deprecate `chart.events.click`, tooltip configuration, tooltip renderer types, or `pointermove`. The new default query has a geometric selection policy; the explicit `tooltip` mode and deprecated fields preserve the old selection policy.

## Architecture

Plugins declare `interaction.prepareNearestData` and `interaction.getTargetElements`. Series-specific interaction adapters live in `src/plugins/<type>/interaction.ts`, and their public payload types live in `src/plugins/<type>/interaction-types.ts`. The built-in union is aggregated in `src/plugins/interaction-types.ts`; core owns only common event/API types and shared geometry/query helpers. Both query modes consume the same prepared chart data. Axis plugins reuse their unfiltered point collectors; other plugins enumerate reference positions directly from prepared geometry. Core owns the common distance comparison. Tooltip lookup retains its existing selection algorithms and filtering order; it does not call nearest preparation or change priority. Sankey caches measured path midpoints by prepared link identity, invalidating naturally when geometry is replaced.

`getClosestPoints` coordinates only legacy tooltip results and the shared X-axis lookup. `getChartClosest` delegates either to that legacy policy or to the shared geometric comparison of plugin candidates. No series-name switches or lists belong in shared interaction code, and plugins do not duplicate nearest-selection algorithms.

The shared render pipeline registers a plugin layer and its normal marker layer. For each plot click, the plugin reads existing D3 data and enumerates relevant SVG geometry. Renderers do not bind extra handlers or tag individual shapes. Core tests native fill/stroke geometry, effective visibility and built-in clipping, orders hits by current DOM position, and deduplicates parts of the same element.

Queries need rendered chart context: coordinates plus raw series alone cannot reproduce scales, stacking, zoom, contours, clipping, and paint order.

## Verification

Cover all built-in series payloads, exact versus nearest selection, tooltip filtering, empty clicks, covered elements, rounded corners and borders, source metadata, data replacement, range previews, touch, and existing pinning. Verify queries work before a click, remain usable outside handlers, and read replacement data through a retained API object. Cover plot boundaries, non-finite coordinates, unavailable plots, mixed-series priority, deterministic equal-distance ties, and cases where X-first selection misses the nearest point.

Run typecheck, focused unit and Docker browser tests, chart-config generation/tests, and the embedded documentation example build. Inspect the generated standalone declaration and JSON Schema. Keep visual baselines unchanged.
