# Events and interactions

- `chart.events.click` runs on clicks and taps inside the main plot, including empty space and disabled tooltips. Receives `{targets, position, event, chart}`; see below.
- `chart.events.pointermove` runs on pointer movement and touch start/movement; pauses while the tooltip is pinned. Receives tooltip selection and axes, or `undefined` on leaving the plot, with the event as the second argument.
- `legend.events.itemClick` runs before a discrete legend item's visibility action. Receives `{id, name, visible}` and a native `MouseEvent`. Set `legend.itemClickAction: 'none'` to manage selection yourself.
- `<Chart onReady>` runs after shapes are ready and repeats on resize. Receives `{dimensions: {width, height}}`.
- `<Chart onResize>` runs on initialization and changes to chart dimensions. Receives `{dimensions}`, initially possibly `undefined`.

See [Legend](legend.md) and [Tooltip](tooltip.md) for their configuration.

## Click selection

`targets` contains exact hits from uppermost to lowest, including covered elements. Use `targets[0]` for the element under the pointer; an empty array means no hit. Labels, grids, connectors, halos, hover-only markers, and range-slider previews are excluded. Hits respect painted contours, visibility, and built-in clipping.

Each item contains `series` metadata (`type`, `id`, `name`, optional `custom`) and its `point`. Most elements return point data; whole lines, areas, area ranges, and radar polygons return `{kind: 'shape', points}`. Sankey links return `{kind: 'link', source, target, value}`. Scatter clusters expose their members in `point.cluster.points`.

The example selects bars with tooltips disabled and finds a nearby category when clicking empty space:

<div data-chart-example="interactions/click-targets"></div>

`position: [x, y]` is in pixels relative to the main plot's top-left corner. `event` is the native click `MouseEvent`, including clicks produced by taps.

## Nearest selection

Use `chart.getClosest(position)` to find the nearest series reference position in plot-relative pixels, independently of tooltip enablement. Reference positions are point coordinates, rectangle centers, area/range midpoints, pie segment centers, and Sankey node centers or link midpoints. Equal distances follow prepared series order, then point order.

Use `chart.getClosest(position, {mode: 'tooltip'})` for the old click handler's selection policy and tooltip eligibility. Both modes query the supplied position against current data, rather than reading a pinned tooltip. They return `null` outside the plot, for non-finite coordinates, or when no plot is available.

The `chart` API comes from the click payload. You can retain it for later queries; it uses the current chart state and returns `null` after unmounting. The component's `ChartRef` provides only `reflow()` for resizing.

## Migrating click handlers

Top-level `point`, `series`, and the second event argument are deprecated and will be removed in the next major release. Legacy fields can now be `undefined`, because empty clicks also invoke the callback. Replace their use with:

```ts
click: ({chart, position, event}) => {
  const selected = chart.getClosest(position, {mode: 'tooltip'});
  if (selected) handleSelection(selected.point, selected.series, event);
};
```

Use `targets[0]` instead when you need an exact hit. The new event is native, series metadata is a subset of the legacy prepared series, and Sankey links include both endpoints instead of only the source node.
