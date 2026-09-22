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

## Wrapping long labels

Set `legend.itemMaxRowCount` to a positive integer greater than `1` to wrap text inside each discrete legend item. The default is `1` (single-line truncation). This works with SVG and HTML labels in all legend positions.

Labels wrap within the legend width after subtracting the marker and its padding. Explicit line breaks are preserved, long unbroken words are split, and the final visible row is ellipsized when needed. HTML labels also support `<br>`.

Labels reflow on resize. Pagination keeps items together, reducing the row count only when an item is taller than a page.

<div data-chart-example="legend/wrapping"></div>

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
