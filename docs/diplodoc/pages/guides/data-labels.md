# Data Labels

## Introduction

Data Labels are a feature used to display textual or numeric information directly on the chart's data points, such as bars, pie slices, or line markers. Their primary purpose is to make the visualization more readable and informative by explicitly showing the value, name, or a custom string associated with each element, eliminating the need to constantly cross-reference the axes. The configuration and behavior of data labels vary significantly between series types; for instance, on a column chart, they are typically placed at the top of each bar, while on a pie chart, they can be positioned outside the slices, connected by leader lines to avoid clutter.

For more granular control over the positioning and appearance of data labels for a specific series type, refer to the detailed configuration options within the series' own type definition. For example, see the `dataLabels` options for the [PieSeries](../api/Series/Pie/interfaces/PieSeries.md#properties).

## Enabling and Disabling Data Labels

Whether labels are displayed by default depends on the series type. However, this behavior can be manually overridden. For all series, the dataLabels configuration section contains an enabled property, which provides direct control over their visibility.

**Example:** disable data labels for a pie chart

```javascript
series: {
  data: [{
    type: 'pie',
    dataLabels: {
        enabled: false
    },
    data: [ ... ]
  }]
}
```
