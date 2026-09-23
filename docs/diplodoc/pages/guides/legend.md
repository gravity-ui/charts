# Legend

## Introduction

The legend is a key component that identifies the various series or categories present on the chart by displaying their names and corresponding colors. Its primary purpose is to help viewers distinguish between different data sets, making the chart easier to interpret.

The visibility of the legend is controlled by the `enabled` property within its configuration section, allowing you to show or hide it as needed for your design. For the full list of properties, see the [API reference](../api/Configuration/interfaces/ChartLegend.md).

## Legend width

Set `legend.width` to allocate a fixed width in pixels. For a discrete legend, this width is capped at the chart width excluding chart margins. The resulting width is used to wrap items onto new rows and truncate long labels, including HTML labels. If a legend on the left or right leaves no room for the plot, only the legend and chart title are drawn; the plot and axes are omitted.

```javascript
legend: {
  enabled: true,
  position: 'left',
  width: 230,
}
```

Without an explicit width, a discrete legend uses the available chart width for `top` and `bottom` positions, or half the available width after subtracting the legend margin for `left` and `right` positions. A continuous legend uses `width` for its gradient and defaults to 200 pixels.

### Content-based side legends

Set `width: 'auto'` for a discrete legend on the left or right to fit its rows, title, and pagination controls. All pages contribute to the width, so turning pages does not move the plot. Width is recalculated when the chart size, content, or text styles change.

`maxWidth` caps the width without forcing short content to fill it. It accepts pixels (`230` or `'230px'`) and percentages (`'30.5%'`) of chart width after left/right chart margins, before legend or axis space is deducted. The limit includes markers and text spacing but excludes `legend.margin`. Long labels and titles are truncated.

Resize the example below to see how `width: 'auto'` and `maxWidth: '30%'` work together.

<div data-chart-example="legend/content-based-width"></div>

`maxWidth` also caps numeric widths and continuous legends. Invalid limits are ignored; negative limits resolve to zero. Without it, automatic width is limited only by available space. Omitting both settings preserves existing sizing. For top/bottom and continuous legends, `width: 'auto'` uses the default width.

## Overriding legend labels

By default, the legend uses the name property of the series or individual data point (depending on the visualization type) for its entries. You can override this behavior by defining a custom label that will be displayed exclusively in the legend. This is useful when you want to provide a simplified, abbreviated, or more descriptive name in the legend compared to the main data point identification.

To implement this, use the `legend.itemText` property on the series or data point, which takes precedence over the standard name property specifically for legend entries.

**Example:** customizing legend labels for pie series

```javascript
series: {
  data: [
    {
      type: 'pie',
      data: [
        {
          name: 'Series 1',
          value: 10,
          legend: {
            itemText: 'Custom legend name',
          },
        },
      ],
    },
  ];
}
```
