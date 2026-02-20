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

### Best Use Cases

- General numeric data with uniform distribution
- Comparing absolute differences between values
- Data where proportional visual distance matters
- Most common default choice for numeric data

## Logarithmic Axis

A logarithmic axis uses a logarithmic scale where each interval represents a multiplication factor (typically powers of 10). The distance between 1 and 10 equals the distance between 10 and 100.

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

### Best Use Cases

- Nominal data (names, labels, types)
- Ordinal data (ratings, size categories)
- Bar charts comparing distinct groups
- Data without meaningful numeric intervals

### Data Restrictions

- Values are treated as discrete labels, not numbers
- No mathematical interpolation between points
- Order is determined by data order

### Important Notes

- Plotting continuous data on category axis loses interpolation
- Large number of categories may cause readability issues
- Consider grouping or filtering if categories exceed ~20-30 items
