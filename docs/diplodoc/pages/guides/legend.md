# Legend

## Introduction

The legend is a key component that identifies the various series or categories present on the chart by displaying their names and corresponding colors. Its primary purpose is to help viewers distinguish between different data sets, making the chart easier to interpret.

The visibility of the legend is controlled by the `enabled` property within its configuration section, allowing you to show or hide it as needed for your design. For the full list of properties, see the [API reference](../api/Configuration/interfaces/ChartLegend.md).

## Item layout

Set `legend.layout: 'vertical'` to place one item per row, independently of `position`. The default is `'horizontal'`. This option applies to discrete legends with SVG or HTML labels.

For vertical layout, use `align` to position the list and `verticalAlign` for vertical alignment of side legends; `justifyContent` only affects horizontal layout. Long labels are truncated, and lists that exceed the available height use pagination. If a single row is taller than the page, its content is clipped to keep the pagination controls accessible.

<div data-chart-example="legend/vertical"></div>

## Legend width

Without an explicit width, a discrete legend uses the available chart width for `top` and `bottom` positions, or half the available width after subtracting the legend margin for `left` and `right` positions. A continuous legend uses `width` for its gradient and defaults to 200 pixels.

### Explicit width

Set `legend.width` to a finite, nonnegative pixel value (`200` or `'200px'`) or a finite, nonnegative decimal percentage such as `'25%'`. For a discrete legend, this width is capped at the chart width excluding chart margins. The resulting width is used to wrap items onto new rows and truncate long labels, including HTML labels. If a legend on the left or right leaves no room for the plot, only the legend and chart title are drawn; the plot and axes are omitted.

Percentages use the chart width after left/right chart margins, before legend or axis space is deducted, and are recalculated on resize. Values above `'100%'` use the full available width for both discrete and continuous legends. The external `legend.margin` is added separately.

Negative widths, `NaN`, infinite values, and invalid strings use the same default sizing as an omitted `width`, without failing the chart. Size strings must contain a decimal number followed by `px` or `%`, without whitespace or exponent notation; a leading dot is allowed (`'.5px'`, `'.5%'`). Continuous pixel widths are not capped at the available chart width unless `maxWidth` is set.

```javascript
legend: {
  enabled: true,
  position: 'left',
  width: '25%',
}
```

### Content-based width

Set `width: 'auto'` for a discrete legend on the left or right to fit its rows, title, and pagination controls instead of reserving half the available width. All pages contribute, so turning pages does not move the plot. Width is recalculated when the chart size, content, or text styles change. For top/bottom and continuous legends, `'auto'` uses the default width.

Without `maxWidth`, content-based width uses up to the available chart width.

### Maximum width

Use `maxWidth` to cap legend width without changing alignment. It applies to all positions and both discrete and continuous legends, with omitted, explicit, or `'auto'` width. It uses the units and percentage base described above, includes markers and text spacing, and excludes `legend.margin`. Invalid limits are ignored; negative numbers and size strings with a leading minus resolve to zero.

Long labels and titles are truncated. For content-based side legends and discrete legends with `maxWidth`, the title is hidden if there is no available width or insufficient height for the title, an item row, and any necessary pagination. It returns when space becomes available.

Resize the example below to see how `width: 'auto'` and `maxWidth: '30%'` work together.

<div data-chart-example="legend/content-based-width"></div>

## Overriding legend labels

By default, legend labels use the `name` of the series or individual data point, depending on the visualization type. Set `legend.itemText` on that series or point to override its legend label without changing its name elsewhere.

The example uses abbreviated legend labels. Hover over the lines to see the full series names in the tooltip.

<div data-chart-example="legend/labels"></div>
