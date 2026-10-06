# Legend

## Introduction

The legend identifies chart series or categories by their names and colors.

Use `legend.enabled` to show or hide the legend. For the full list of properties, see the [API reference](../api/Configuration/interfaces/ChartLegend.md).

## Continuous legend

Set `legend.type: 'continuous'` to display a color scale configured through `legend.colorScale`. This scale is independent of series gradients and point colors; it does not assign colors to the plotted data. Configure the series and legend colors together when they should represent the same values.

## Item layout

Set `legend.layout: 'vertical'` to place one item per row, independently of `position`. The default is `'horizontal'`. This option applies to discrete legends with SVG or HTML labels.

For vertical layout, use `align` to position the list and `verticalAlign` for vertical alignment of side legends; `justifyContent` only affects horizontal layout. Lists that exceed the available height use pagination. If a single row is taller than the page, its content is clipped to keep the pagination controls accessible.

Use `legend.rowGap` to separate vertical items or wrapped horizontal rows in discrete legends with SVG or HTML labels. It accepts finite, nonnegative numbers (e.g. `4`) or decimal `px` strings (e.g. `'4px'`) and defaults to `0`; invalid values throw `INVALID_DATA`.

<div data-chart-example="legend/vertical"></div>

## Legend width

Without an explicit width, a discrete legend uses the available chart width for `top` and `bottom` positions, or half the available width after subtracting the legend margin for `left` and `right` positions. A continuous legend uses `width` for its gradient and defaults to 200 pixels.

### Explicit width

Set `legend.width` to a finite, nonnegative pixel value (`200` or `'200px'`) or a finite, nonnegative decimal percentage such as `'25%'`. For a discrete legend, this width is capped at the chart width excluding chart margins and, for left/right positions, `legend.margin`.

The resulting width is used to arrange items into rows and limit label width, including HTML labels. Labels use single-line truncation by default; SVG labels can [wrap onto multiple lines](#wrapping-long-labels). If a legend on the left or right leaves no room for the plot, only the legend and chart title are drawn; the plot and axes are omitted.

Percentages use the chart width after left/right chart margins, before legend or axis space is deducted, and are recalculated on resize. Values above `'100%'` use the full percentage base before the side-legend margin limit is applied. The external `legend.margin` is added separately.

Negative widths, `NaN`, infinite values, and invalid strings use the same default sizing as an omitted `width`, without failing the chart. Size strings must contain a decimal number followed by `px` or `%`, without whitespace or exponent notation; a leading dot is allowed (`'.5px'`, `'.5%'`). Continuous pixel widths are not capped at the available chart width unless `maxWidth` is set.

```javascript
legend: {
  enabled: true,
  position: 'left',
  width: '25%',
}
```

### Content-based width

Set `width: 'auto'` for a discrete legend on the left or right to fit its rows, title, and pagination controls instead of reserving a fixed width. All pages contribute, so turning pages does not move the plot. Width is recalculated when the chart size, content, or text styles change. For top/bottom and continuous legends, `'auto'` uses the default width.

With the default horizontal layout, `auto` wraps items within half the chart width after chart margins and `legend.margin`; this keeps rows from taking nearly all the space for the plot. An explicit `maxWidth` replaces that limit and can allow a wider legend. With vertical layout, `auto` uses up to the available chart width unless `maxWidth` is set.

### Maximum width

Use `maxWidth` to cap legend width without changing alignment. It applies to all positions and both discrete and continuous legends, with omitted, explicit, or `'auto'` width. It uses the units and percentage base described above. For discrete legends, the limit includes markers and text spacing and excludes `legend.margin`. For continuous legends, it limits the gradient; tick labels are laid out separately. Invalid and negative limits are ignored.

Discrete legend titles are truncated to the resolved width and reserve space above the rows. Continuous legend titles are truncated only when the limit reduces the gradient width. A discrete legend title is hidden if there is no available width or insufficient height for the title, an item row, and any necessary pagination. It returns when space becomes available.

Resize the example below to see how `width: 'auto'` and `maxWidth: '30%'` work together.

<div data-chart-example="legend/content-based-width"></div>

### Wrapping long labels

Set `legend.itemMaxRowCount` to a positive integer greater than `1` to wrap SVG labels in a discrete legend, regardless of its position. The default is `1` (single-line truncation). The option is ignored when `legend.html: true`, because HTML content can contain blocks or images and manages its own layout.

Item layout determines which items share a row; label wrapping adds lines within an individual item. Labels wrap within the resolved legend width after subtracting the marker and its padding. Explicit line breaks are preserved, long unbroken words are split, and the final visible row is ellipsized when needed.

Labels reflow on resize. Pagination keeps items together, reducing the row count only when an item is taller than a page. When truncation leaves all items on one page, no pagination controls are shown. The title is kept if the visible items fit below it, or if at least one text line, the marker, and pagination fit.

With `width: 'auto'`, the legend fits the visible text rows, title, and pagination across all pages, including after labels are shortened to fit the page height. Use `maxWidth` to limit the available wrapping width.

Resize the example below to see SVG labels wrap with `width: 'auto'`, `maxWidth: '40%'`, and vertical item layout.

<div data-chart-example="legend/wrapping"></div>

## Overriding legend labels

By default, legend labels use the `name` of the series or individual data point, depending on the visualization type. Set `legend.itemText` on that series or point to override its legend label without changing its name elsewhere.

The example uses abbreviated legend labels. Hover over the lines to see the full series names in the tooltip.

<div data-chart-example="legend/labels"></div>

## Legend item clicks

For a discrete legend, `legend.events.itemClick` receives the clicked item's `id`, full configured `name` before truncation, current `visible` state, and the native mouse event. The `name` may contain HTML: with `itemText: '<b>Created</b>'`, the callback receives `name: '<b>Created</b>'` even though the rendered label reads “Created”. By default, clicking applies the built-in visibility behavior: a regular click selects one item or restores all, while ⌘/Ctrl-click adds or removes an item from the visible set.

Set `legend.itemClickAction` to `'none'` to use a legend item for another action without changing series visibility. The callback still runs. Its return value and the mouse event's `defaultPrevented` flag do not control visibility.

```javascript
legend: {
  itemClickAction: 'none',
  events: {
    itemClick: ({id}) => {
      window.open(`/issues?series=${encodeURIComponent(id)}`, '_blank');
    },
  },
}
```

The `id` is the legend group's ID. Set `series.legend.groupId` explicitly if the handler needs a stable ID; for pie and funnel items, set `data[].legend.groupId` instead.
