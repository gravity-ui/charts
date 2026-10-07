# Axis Types

Choosing the correct axis type is crucial for accurate data representation. This guide covers available axis types and their applications.

The axis type is set like this:

```
// The types are 'linear', 'logarithmic', 'datetime'  or 'category'
xAxis: {
    type: 'linear',
}
```

## Linear Axis

A linear axis distributes values evenly across the axis with constant intervals between tick marks. The distance between 0 and 10 is the same as between 90 and 100.

<div data-chart-example="axis-types/linear"></div>

### Best Use Cases

- General numeric data with uniform distribution
- Comparing absolute differences between values
- Data where proportional visual distance matters
- Most common default choice for numeric data

## Logarithmic Axis

A logarithmic axis uses a logarithmic scale where each interval represents a multiplication factor (typically powers of 10). The distance between 1 and 10 equals the distance between 10 and 100.

<div data-chart-example="axis-types/logarithmic"></div>

### Best Use Cases

- Data spanning multiple orders of magnitude
- Exponential growth patterns (population, viral spread)
- Financial data with percentage-based changes
- Scientific measurements (pH, decibels, earthquake magnitude)
- Comparing relative/proportional changes

### Data Restrictions

- All data points must be strictly positive

## DateTime Axis

A datetime axis is specifically designed for temporal data, handling dates and times with appropriate formatting, intervals, and timezone awareness.

<div data-chart-example="axis-types/datetime"></div>

### Best Use Cases

- Time series data
- Historical trends and forecasting
- Event timelines
- Any data with temporal relationships
- Scheduling and calendar visualizations

### Data Restrictions

- **Only Unix timestamps are supported**
- Timestamps must be provided in milliseconds (not seconds)
- Values must be positive integers representing time since Unix epoch (January 1, 1970)
- Other date formats (ISO strings, Date objects) must be converted to timestamps before use

## Category Axis

A category axis displays discrete, non-numeric labels. Each category occupies equal space regardless of any inherent ordering or value.

<div data-chart-example="axis-types/category"></div>

### Best Use Cases

- Nominal data (names, labels, types)
- Ordinal data (ratings, size categories)
- Bar charts comparing distinct groups
- Data without meaningful numeric intervals

### Data Restrictions

- Values are treated as discrete labels, not numbers
- No mathematical interpolation between points
- Order is determined by data order
- Categories must be unique — duplicate values in the categories array will cause unexpected behavior

### Important Notes

- Plotting continuous data on category axis loses interpolation
- Large number of categories may cause readability issues
- Consider grouping or filtering if categories exceed ~20-30 items

## Inspecting X values on plot clicks

Use `chart.events.plotclick` to inspect the position of a click independently of the selected data point. The callback handles clicks on the SVG plot background and shapes inside the plot bounds, including blank regions and a plot with all series hidden. Clicks on HTML overlays are not included. Its second argument is the native `MouseEvent`.

The callback receives `position: [x, y]` in pixels relative to the top-left corner of the plot area, and an optional `xAxisValue` derived from the current X scale. The value accounts for the current zoom and chart layout:

- On `datetime` axes, `xAxisValue` is a Unix timestamp in milliseconds.
- On `linear` and `logarithmic` axes, it is a numeric axis value.
- On category axes or when the X scale is unavailable, it is `undefined`.

The example supplies `xAxis.timestamps` explicitly as an optional date domain. With a `chart.events.plotclick` callback configured, hiding all legend items preserves axes and their domains from configured series, so coordinate inspection can continue without `timestamps`. Charts without `plotclick` retain their existing behavior when all legend items are hidden.

The existing `chart.events.click` callback still receives a selected `point` and `series`, and runs only when a point is selected. Both callbacks can run for the same click when a point is available. Use `plotclick` alone for actions based on the axis coordinate, and `click` for actions based on the selected point.

In this example, click above the area or between data points to compare the continuous plot date with the selected point's date. Then choose **Hide all series** and click the empty plot: the plot date still updates, while the selected-point callback does not run. Drag horizontally to zoom and inspect dates within the new view.

<div data-chart-example="axis-types/plot-click"></div>
