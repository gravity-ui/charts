# Chart interactions

Use `chart.events.click` for clicks and taps in the main plot. The callback runs even when no series element is hit or tooltips are disabled. Clicks outside the main plot do not invoke it.

## Exact hits

Use the provided exact hits when an action should apply only to the rendered element under the pointer:

```ts
click: ({targets}) => {
  const target = targets[0];
  if (target && isIssueTarget(target)) {
    openIssues(target.point.custom);
  }
};
```

`isIssueTarget` is an application type guard that narrows the entire item to the expected series and custom data type. The live example below shows a complete guard and handler with tooltips disabled, including series-level tooltip enablement.

<div data-chart-example="interactions/click-targets"></div>

Hits include covered series elements and follow current paint order from uppermost to lowest. An empty array means no exact hit. Selecting only the first item prevents navigation through an overlaid series; search the array explicitly if your application allows lower hits.

Each item contains `series` metadata (`type`, prepared `id`, `name`, optional `custom`) and a series-specific `point`. A bar or cell exposes its data. A line, area, area range, or radar polygon exposes `{kind: 'shape', points}`; a normal marker exposes its point. A Sankey link exposes `{kind: 'link', source, target, value}`. Scatter clusters retain original membership in `point.cluster.points`. These payloads describe data, not SVG geometry, and may contain existing prepared-data normalization.

Fill and border parts of one element produce one hit. Labels, connectors, grids, annotations, hover markers, halos, and range-slider previews do not produce series hits. Exact hits respect contours, effective visibility, and built-in clipping. Solid fills and strokes with zero color alpha do not produce hits; partially transparent colors remain interactive.

## Nearest selection

```ts
click: ({chart, position}) => {
  const selected = chart.getClosest(position);
  if (selected) {
    selectElement(selected);
  }
};
```

The default `chart` mode finds the minimum Euclidean distance in screen pixels across all eligible series reference positions, ignoring point- and series-level tooltip enablement. It can select an item in empty plot space. It compares point coordinates, rectangle centers, area/range vertical midpoints, radar vertices, pie mid-angle/mid-radius positions, and Sankey node centers or link path midpoints. Plugins define these positions; exact contours belong to `targets`. Ties follow the chart's series/layer order, then candidate order.

Use `chart.getClosest(position, {mode: 'tooltip'})` for the same selection and eligibility rules as the old click handler. This query uses the supplied plot position, not a previously pinned tooltip. Global tooltip visibility, sorting, and custom renderers do not affect it.

Exact hits are computed for every click. Nearest queries compute on request for the supplied position. Computing exact hits does not also search for a nearest point. The `chart` API is stable and can be retained or accessed through `ChartRef` outside handlers. Each query reads the current chart state; keep the returned item when you need the selection at a particular time. Queries return `null` outside the plot, for non-finite coordinates, and while no plot is available.

The component ref exposes the same API, so a query does not require a chart click:

```tsx
const chartRef = React.useRef<ChartRef>(null);

function inspect() {
  const selected = chartRef.current?.getClosest([40, 60]);
  if (selected) selectElement(selected);
}

return (
  <>
    <Chart ref={chartRef} data={data} />
    <button onClick={inspect}>Inspect position</button>
  </>
);
```

Import `Chart` and `ChartRef` from `@gravity-ui/charts`. Call the query after the chart is mounted, for example from another event handler. `ChartRef` also retains the existing `reflow()` method.

## Coordinates and event

The payload provides `position: [x, y]` in pixels relative to the main plot's top-left corner and `event`, the native browser `MouseEvent`. Native click events produced by taps use the same contract. Existing chart gesture handling still applies.

## Migrating existing handlers

The top-level `point` and `series` fields are deprecated, as is the second event argument. They remain available until the next major release. The old fields retain tooltip-derived selection and can now be `undefined`: callbacks also run on clicks that previously had no eligible candidate.

Replace:

```ts
click: ({point, series}, event) => {
  if (point) handleSelection(point, series, event);
};
```

with:

```ts
click: ({chart, position, event}) => {
  const selected = chart.getClosest(position, {mode: 'tooltip'});
  if (selected) handleSelection(selected.point, selected.series, event);
};
```

The new `event` is native; the deprecated second argument keeps its previous runtime form. New series metadata is a documented subset rather than the entire legacy prepared series. For Sankey links, the query returns both endpoints and the link value, while the old `point` contains only the source node. Use `targets` when the action requires an exact hit rather than the old nearest-selection behavior.
