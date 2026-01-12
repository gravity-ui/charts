# Legend

## Introduction

The legend is a key component that identifies the various series or categories present on the chart by displaying their names and corresponding colors. Its primary purpose is to help viewers distinguish between different data sets, making the chart easier to interpret.

The visibility of the legend is controlled by the `enabled` property within its configuration section, allowing you to show or hide it as needed for your design. For the full list of properties, see the [API reference](../api/Configuration/interfaces/ChartLegend.md).

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
