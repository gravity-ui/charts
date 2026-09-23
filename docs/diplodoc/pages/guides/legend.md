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

Set `width: 'auto'` for a discrete legend on the left or right to reserve only the space its content needs. The width includes the widest prepared row, title, and pagination controls across all pages, so turning pages does not move the plot. It is recalculated when the chart size, content, or configured text styles change.

```javascript
legend: {
  enabled: true,
  position: 'left',
  width: 'auto',
  maxWidth: '30%',
}
```

`maxWidth` is a ceiling, not a target: short rows can use less space in automatic mode. It accepts numbers or pixel strings (`230`, `'230px'`) and percentages including fractions (`'30.5%'`). Percentages refer to chart width after left/right chart margins, before subtracting legend or axis space. Markers and text spacing count towards the limit; the external `legend.margin` does not.

Long labels and titles are truncated to fit. HTML labels retain their markup and use CSS overflow. All rows are measured before choosing the automatic width. The existing horizontal item flow still determines how items wrap; `auto` does not change the item layout.

You can also supply `maxWidth` alone, with a numeric `width`, or for a continuous legend: the smaller width wins. Omitting it adds no user limit; available chart space still limits automatic width. Invalid limits are ignored and negative limits resolve to zero. Omitting both settings preserves the existing sizing behavior. `width: 'auto'` uses the default width for top/bottom and continuous legends.

Try **Other → Legend → Content-based width** in Storybook and resize the container.

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
