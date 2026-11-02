# Events and interactions

- `chart.events.click` runs on clicks and taps inside the main plot. Set `chart.events.clickMode: 'plot'` to receive every click, including empty space and disabled tooltips, with `{targets, position, event, chart}`. The default mode, `'tooltip'`, preserves the previous callback arguments and runs only when the tooltip selection finds a point.
- `chart.events.pointermove` runs on pointer movement and touch start/movement; pauses while the tooltip is pinned. Receives tooltip selection and axes, or `undefined` on leaving the plot, with the event as the second argument.
- `legend.events.itemClick` runs before a discrete legend item's visibility action. Receives `{id, name, visible}` and a native `MouseEvent`. Set `legend.itemClickAction: 'none'` to manage selection yourself.
- `<Chart onReady>` runs after the first shapes are prepared and repeats when dimensions or the callback identity change. Legend, zoom, range slider and data changes alone do not trigger it. Receives `{dimensions: {width, height}}`.
- `<Chart onResize>` runs on initialization and changes to chart dimensions. Receives `{dimensions}`, initially possibly `undefined`.

See [Legend](legend.md) and [Tooltip](tooltip.md) for their configuration.

## Click selection

`targets` contains exact hits from uppermost to lowest, including covered elements. Use `targets[0]` for the element under the pointer; an empty array means no hit. Labels, grids, connectors, halos, hover-only markers, and range-slider previews are excluded. Hits respect painted contours, visibility, and built-in clipping.

`targets` is computed synchronously on first access and cached for that click payload. Read it inside the click handler before updating the chart or awaiting asynchronous work. A delayed first read uses the geometry available at that time. Destructuring `targets` or spreading the payload also reads it; handlers that never read it skip exact hit testing.

Each item contains `series` metadata (`type`, `id`, `name`, optional `custom`) and its `point`. Most elements return point data; whole lines, areas, area ranges, and radar polygons return `{kind: 'shape', points}`. Sankey links return `{kind: 'link', source, target, value}`. Scatter clusters expose their members in `point.cluster.points`.

Point payloads preserve the original objects and values, including `null` when `nullMode: 'zero'` draws a zero. This applies to `targets` and both `getClosest` modes. The deprecated top-level `point` retains its previous, potentially normalized values.

The example selects bars with tooltips disabled and finds a nearby category when clicking empty space:

<div data-chart-example="interactions/click-targets"></div>

`position: [x, y]` is in pixels relative to the main plot's top-left corner. `event` is the native click `MouseEvent`, including clicks produced by taps.

## Nearest selection

Use `chart.getClosest(position)` to find the nearest series reference position in plot-relative pixels, independently of tooltip enablement. Reference positions are point coordinates, rectangle centers, area/range midpoints, pie segment centers, and Sankey node centers or link midpoints. Equal distances follow prepared series order, then point order.

Nearest selection uses prepared data and reference positions, which may lie outside the visible plot for clipped shapes. Use `targets` when selection must match visible paint under the pointer.

Use `chart.getClosest(position, {mode: 'tooltip'})` for the old click handler's selection policy and tooltip eligibility. Both modes query the supplied position against current data, rather than reading a pinned tooltip. They return `null` outside the plot, for non-finite coordinates, or when no plot is available.

The `chart` API comes from the click payload. You can retain it for later queries; it uses the current chart state and returns `null` after unmounting. The component's `ChartRef` provides only `reflow()` for resizing.

For a screenshot or export after changing the container size, await `ref.current.reflow()`. It completes after the current shapes, axes, legend and range slider preview have committed, including coalesced resize requests. Identical requests join the preparation already in progress. If the size is unchanged and the chart is already ready, it completes without another `onReady` callback. Use `reflow({immediate: true})` to skip the resize debounce.

Pie nodes returned by `renderCustomShape`, including built-in `CustomShapeRenderer.pieCenterText` totals, are inserted when their callbacks finish. The main chart renders immediately, while `reflow()` waits for the current nodes to be inserted.

A rejected callback omits only its custom node and allows completion. A callback that never settles keeps the export promise pending without hiding the main chart.

A newer resize supersedes unfinished rendering; pending requests then wait for the latest chart. Unmounting cancels pending requests, and obsolete callbacks cannot insert nodes.

Preparation errors reject with their original cause. An ignored promise still reports a preparation failure as an unhandled rejection. Host-unavailable, zero-size and unmount cancellations also reject, but are handled automatically for callers that ignore the promise.

### Updating implementations of ChartRef

`ChartRef.reflow()` now returns `Promise<void>`. Existing calls can continue to ignore its result. Custom ref implementations and test mocks that previously returned `void` must return a promise that settles after their rendering completes. Forwarding wrappers should return the underlying promise:

```ts
const chartRef: ChartRef = {
  reflow: (options) => underlyingChart.reflow(options),
};
```

For a synchronous test mock, use `reflow: async () => {}`. Do not resolve a production wrapper's promise before the underlying chart commits.

The promise rejects if preparation fails, the host is missing or has zero size, or the chart unmounts before completion. Handle rejection when awaiting it. Existing calls that ignore the return value remain supported.

## Typing interaction data

The interaction API is generic: `ChartInteractionItem<TPoint, TType>` describes a complete point payload and a series type string. It does not infer point shapes from series names. Without type arguments, `point` is an opaque object; narrow it before reading its fields.

Pass your result type as the second parameter of `ChartData<Custom, Item>`, or as the parameter of `ChartOptions<Item>`, `ChartClickData<Item>` and `ChartApi<Item>`. The first `ChartData` parameter still describes point `custom` metadata. Use a result type covering every possible hit in the chart, including whole shapes or links where applicable. The example above uses `ChartInteractionItem<BarYSeriesData<IssueFilter>, 'bar-y'>` for its bar results.

## Migrating click handlers

Existing handlers continue to use `clickMode: 'tooltip'` by default. Their top-level `point`, `series`, and second event argument remain available; the callback is skipped when no tooltip-eligible point is selected.

`clickMode` only controls when the callback runs. Both modes retain the legacy fields and second argument for compatibility. In `'plot'` mode, `point` and `series` are `undefined` when the tooltip selection finds no point.

The chart always supplies `targets`, `position`, `chart`, and `event`. These fields are optional in the callback type because existing wrappers may forward only `{point, series}`. Check the fields you use. When writing a wrapper, forward the entire payload to preserve modern data. `ChartClickData` describes a complete modern payload after checking its fields.

To retain the previous selection policy while receiving every plot click, query it explicitly and handle a missing result:

```ts
import type {ChartOptions} from '@gravity-ui/charts';

const chart: ChartOptions = {
  events: {
    clickMode: 'plot',
    click: ({chart, position, event}) => {
      if (!chart || !position || !event) return;
      const selected = chart.getClosest(position, {mode: 'tooltip'});
      if (selected) handleSelection(selected.point, selected.series, event);
    },
  },
};
```

Use `targets[0]` instead when you need an exact hit. The new event is native, series metadata is a subset of the legacy prepared series, and Sankey links include both endpoints instead of only the source node.

In the next major release, `'plot'` will become the default and legacy callback arguments will be removed. Handlers using explicit `'plot'` mode and only the fields of `ChartClickData` are ready for that change.
