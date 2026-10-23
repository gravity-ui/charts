# Line series

A line series connects points to show how a value changes along an ordered axis.

## When to use

Use it for trends over time and comparisons between a few metrics. Keep the X values in their meaningful order; use [scatter](scatter.md) when points have no sequence.

## Example

<div data-chart-example="series-types/line-basic"></div>

## Data

Set `type: 'line'`. Each point contains `x` and `y`. For a category axis, use a category name or its zero-based index in `categories`; for a datetime axis, use a timestamp in milliseconds. See [Axis types](../axes/axis-types.md).

## Series options

### Markers

Set `marker.enabled: true` to keep point markers visible. Configure their hover radius, border color, and border width through `series.options.line.states.hover.marker`.

Hover styles apply to both always-visible and hover-only markers. The normal appearance returns when hover moves to another point or leaves the chart. Set `states.hover.enabled: false` to keep always-visible markers unchanged while retaining hover-only markers. Set `states.hover.marker.enabled: false` to disable both marker hover styles and hover-only markers. Area and area-range series support the same options under their respective series keys.

<div data-chart-example="series-types/line-markers"></div>

Use [axis padding](../axes/index.md#axis-padding) to fit markers at free axis limits.

### Line interpolation

By default, lines connect points with straight segments. Set `interpolation: {type: 'monotone'}` to draw a smooth curve through the points without introducing new extrema. Order points monotonically by X. Markers, tooltips, and interactions stay attached to the original points.

<div data-chart-example="line-interpolation/monotone"></div>

For a cardinal spline, set `interpolation: {type: 'cardinal', tension: 0.5}`. The `tension` ranges from `0` (default, a loose curve) to `1` (straight segments). Below `1`, the curve can overshoot the data extrema and be clipped at the plot boundary.

Both curves preserve `nullMode`: gaps and zero-fills are applied before interpolation. Omit `interpolation` or set `{type: 'linear'}` to restore straight segments.

## Colors

The `color` property accepts a solid color or a [gradient](../colors.md#gradients). Gradient bounds include the points that participate in the line.

## Data labels

<a id="data-label-placement"></a>

By default, labels appear above their points and shift into the plot when they do not fit. Use `dataLabels.placement` to choose other positions.

### Marker boundary

Set `dataLabels.anchor: 'marker-edge'` to measure `padding` from the normal marker's outer bounds, including its shape and border. The default, `anchor: 'center'`, measures padding from the data point coordinates.

```javascript
{
  type: 'line',
  marker: {enabled: true, radius: 10},
  dataLabels: {enabled: true, anchor: 'marker-edge', padding: 5},
}
```

<div data-chart-example="data-labels/marker-edge"></div>

This works with every placement direction, automatic placement, and SVG or HTML labels. Hidden markers use the point coordinates; hover does not move labels. Labels are still shifted into the plot area and use the configured fallback, so overlaps can occur near the edges. Labels render above their series' markers regardless of the anchor.

### Automatic placement

Set `placement: 'auto'` to try top, bottom, left, and right in that order. The first position that avoids all line series and already placed labels is used. When labels compete for space, the series listed first in `series.data` wins.

<div data-chart-example="data-labels/placement-auto"></div>

### Fixed positions and fallback

An array sets the positions to try, for example `placement: ['bottom', 'top']`. A single entry fixes the position. Use `placementFallback: 'hide'` to hide labels that do not fit; the default `'show'` draws them at the first position anyway:

```javascript
{
  type: 'line',
  dataLabels: {enabled: true, placement: ['bottom'], placementFallback: 'hide'},
}
```

`allowOverlap: true` permits overlap with other labels; lines are still avoided. Placement works with SVG and HTML labels (`html: true`), and collision checks follow interpolated curves.

See [LineSeriesDataLabels](../../api/Series/Line/interfaces/LineSeriesDataLabels.md) for the complete configuration.

## API reference

[LineSeries](../../api/Series/Line/interfaces/LineSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
