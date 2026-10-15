# Area series

An area series fills the space between a line and its baseline.

## When to use

Use it to emphasize volume over time, or stack related series to show how they contribute to a total. Use [line](line.md) when comparing individual trends matters more than volume. Keep a zero baseline when the filled area represents magnitude.

## Example

<div data-chart-example="series-types/area-basic"></div>

## Data

Set `type: 'area'`. Each point contains `x` and `y`. For a category axis, use a category name or its zero-based index in `categories`; for a datetime axis, use a timestamp in milliseconds. See [Axis types](../axes/axis-types.md).

## Series options

### Stacking

Set `stacking: 'normal'` to show cumulative values or `stacking: 'percent'` to show shares. Use `stackId` to separate stacks. Enable `stackLabels` to show [stack totals](../data-labels.md#stack-total-labels).

### Markers

Set `marker.enabled: true` to show points. Configure hover markers through `series.options.area.states.hover.marker`; see [Markers](line.md#markers).

## Colors

The `color` property controls the line and, by default, the area fill. Use `fillColor` for a different fill. Both accept solid colors or [gradients](../colors.md#gradients).

Use `opacity` to change only the fill opacity. It does not affect the line. The legend uses the fill color; the tooltip symbol follows the line’s point color.

Line gradient bounds include the points that participate in the line; fill gradient bounds additionally include the area baseline.

The following example combines a solid line with a top-to-bottom gradient fill:

<div data-chart-example="series-types/area"></div>

## API reference

[AreaSeries](../../api/Series/Area/interfaces/AreaSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
