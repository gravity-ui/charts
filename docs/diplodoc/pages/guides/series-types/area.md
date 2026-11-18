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

### Interpolation

Use `interpolation` to smooth an area's boundary or show values that change in discrete steps. The same options work for unstacked, normal and percent-stacked areas.

<div data-chart-example="area-interpolation/smooth"></div>

```javascript
{
  type: 'area',
  stacking: 'normal',
  interpolation: {type: 'monotone'},
}
```

Choose the shape between observations:

- `linear`: Straight segments (default).
- `monotone`: A smooth monotone-X curve through the observations without adding extrema.
- `cardinal`: A cardinal spline with `tension` from `0` (default, loose) to `1` (straight segments).
- `step`: Horizontal and vertical segments. `position: 'after'` (default) holds the value until the next observation; `'before'` changes it at the current observation, and `'middle'` changes halfway between them.

Markers and tooltip values stay attached to the original observations. Percentages are calculated from the original values before interpolation. Null values retain the configured `nullMode` behavior; `connect` is available only without stacking.

#### Smoothing stacked areas

Set identical interpolation options on every series in a stack. Omitted settings use their defaults: for example, `{type: 'step'}` and `{type: 'step', position: 'after'}` are compatible. Conflicting settings are rejected with `INVALID_DATA`.

Smooth stacks preserve the outer contour where possible and adjust internal thicknesses so layers share boundaries without overlapping. An interval that is zero in a layer stays empty. Percent stacks retain their 100% outer boundary where totals are positive and do not invent shares for zero-total intervals.

{% note info %}

Safety adjustments can flatten an internal boundary or introduce a local corner, especially with `cardinal`. Its X tangents are constrained to keep stack sections ordered, and an outer contour that crosses its baseline is clipped to that baseline. Unstacked cardinal curves can overshoot observations, as in [line series](line.md#line-interpolation).

On intervals where a layer changes sign, positive and negative contributions are stacked separately along the selected curve; the outer contour can change there too.

{% endnote %}

### Markers

Set `marker.enabled: true` to show points. Configure hover markers through `series.options.area.states.hover.marker`; see [Markers](line.md#markers).

Halos are disabled by default. Set `halo.enabled: true` in those hover marker options to show a halo around hovered points, with or without always-visible markers.

Use [axis padding](../axes/index.md#axis-padding) to fit markers at free axis limits.

## Colors

The `color` property controls the line and, by default, the area fill. Use `fillColor` for a different fill. Both accept solid colors or [gradients](../colors.md#gradients).

Use `opacity` to change only the fill opacity. It does not affect the line. The legend uses the fill color; the tooltip symbol follows the line’s point color.

Line gradient bounds include the points that participate in the line; fill gradient bounds additionally include the area baseline.

The following example combines a solid line with a top-to-bottom gradient fill:

<div data-chart-example="series-types/area"></div>

## API reference

[AreaSeries](../../api/Series/Area/interfaces/AreaSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
