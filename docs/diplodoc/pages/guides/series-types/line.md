# Line series

A line series connects data points to show how a value changes along the X axis. It is commonly used for time series, trends, and comparisons between several metrics.

Set `series.data[].type` to `line` and provide the point coordinates through `x` and `y`:

```javascript
series: {
  data: [
    {
      type: 'line',
      name: 'Revenue',
      data: [
        {x: 0, y: 42},
        {x: 1, y: 58},
        {x: 2, y: 51},
      ],
    },
  ],
}
```

See the complete configuration in the [LineSeries API reference](../../api/Series/Line/interfaces/LineSeries.md).

## Color and linear gradients

The `color` property accepts either a solid CSS color string or a linear gradient. A gradient contains at least two color stops with offsets in non-decreasing order from `0` to `1`. Gradient stop colors support hex, rgb/rgba, hsl/hsla, and named color formats.

The optional `angle` follows the CSS convention:

- `0` — bottom to top
- `90` — left to right
- `180` — top to bottom (default)
- `270` — right to left

The gradient uses the bounding box of the points that participate in the rendered line. Zoom recalculates this box from the displayed points, and the range slider resolves its gradient independently, so their colors can differ. Each point receives the gradient color at its position on the line. Marker color priority is `data[].marker.color`, then `data[].color`, the gradient color at the point position, and finally the series color.

Markers and the tooltip symbol use the resolved point color. The legend represents a gradient with its color at `t = 0.5`; it does not render a gradient symbol.

The following example renders a left-to-right gradient line:

<div data-chart-example="series-types/line"></div>

See [LinearGradient](../../api/Series/Visual/interfaces/LinearGradient.md) and [GradientStop](../../api/Series/Visual/interfaces/GradientStop.md) for the complete gradient configuration.

## Data label placement

By default, a label is drawn above its point and shifted into the plot area when it does not fit. Line series can try several positions instead and decide what to do when none of them fits.

### Automatic placement

`placement: 'auto'` tries the positions top, bottom, left and right in order and takes the first one where the label box does not cross a line of any line series and does not overlap already placed labels. When labels of several series compete for the same spot, the series listed first in `series.data` wins.

```javascript
{
  type: 'line',
  dataLabels: {enabled: true, placement: 'auto'},
}
```

<div data-chart-example="data-labels/placement-auto"></div>

### Custom order and fixed position

An array sets the exact positions to try. A single position pins the label there:

```javascript
{
  type: 'line',
  dataLabels: {enabled: true, placement: ['bottom']},
}
```

<div data-chart-example="data-labels/placement-fixed"></div>

### Fallback

`placementFallback` decides what happens when none of the positions fits: `show` (default) draws the label at the first position anyway, `hide` hides it.

```javascript
{
  type: 'line',
  dataLabels: {enabled: true, placement: ['bottom'], placementFallback: 'hide'},
}
```

<div data-chart-example="data-labels/placement-fallback-hide"></div>

Notes:

- `allowOverlap: true` lets the label be placed over other labels; lines are still avoided.
- Both SVG and HTML labels (`html: true`) support placement.
- With [line interpolation](../line-interpolation.md) the collision check follows the rendered curve.

See [LineSeriesDataLabels](../../api/Series/Line/interfaces/LineSeriesDataLabels.md) for the complete data label configuration.
