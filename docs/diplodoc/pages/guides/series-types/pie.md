# Pie series

A pie series divides a circle into slices proportional to their values. An inner radius turns it into a donut.

## When to use

Use it for a few non-negative categories that form one total. Use [Bar-Y](bar-y.md) when accurate comparisons or many categories matter more than part-to-whole composition.

## Example

<div data-chart-example="series-types/pie"></div>

## Data

Set `type: 'pie'`. Each point contains `name` and `value`. Null values are skipped by default; `nullMode: 'zero'` treats them as zero.

## Series options

Set `innerRadius`, for example `'50%'`, to make a donut. Use `radius` and `center` to control its size and position. `borderWidth`, `borderColor`, and `borderRadius` control slice borders.

## Data labels

Labels are enabled by default. Set `dataLabels.enabled: false` to hide them. Use a point’s `label` for custom text, `dataLabels.format` for value formatting, and `distance` and connector options inside `dataLabels` for placement. Custom formatters can access the visible slice percentage; see [Value formatting](../value-formatting.md).

## Legend

Each slice has a legend item using its point `name`. Set `data[].legend.itemText` to change that text. Selecting items changes which slices contribute to the visible total. See [Legend](../legend.md).

## Tooltip

Custom `tooltip.valueFormat` formatters can access the slice’s percentage of the visible total; see [Value formatting](../value-formatting.md).

## API reference

[PieSeries](../../api/Series/Pie/interfaces/PieSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
