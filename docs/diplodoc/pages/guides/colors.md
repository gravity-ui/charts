# Colors

## Palette and series colors

Set `data.colors` to choose the chart palette. Series without an explicit color use the palette. Set `series.data[].color` to a CSS color string, such as `'#4da2f1'`, `'rgb(77, 162, 241)'`, or `'blue'`, to override a series color.

## Point colors

Set a point's `color` to override its color. For line, area, and area range series, this changes markers and tooltip symbols, leaving the line and fill colors unchanged.

Marker color priority is `data[].marker.color`, then `data[].color`, the gradient color at the marker position, and finally the series color. For line and area series, the tooltip symbol uses the same resolved color as the point's marker.

## Gradients

[Line](series-types/line.md), [area](series-types/area.md), and [area range](series-types/area-range.md) support gradients in `color`. Area and area range also support them in `fillColor`. Only linear gradients are supported.

A gradient contains at least two color stops with offsets in non-decreasing order from `0` to `1`. Stop colors support hex, rgb/rgba, hsl/hsla, and named color formats.

```javascript
color: {
  type: 'linear-gradient',
  angle: 90,
  stops: [
    {offset: 0, color: '#000000'},
    {offset: 1, color: '#f0f0f0'},
  ],
}
```

The optional `angle` follows the CSS convention:

- `0` — bottom to top
- `90` — left to right
- `180` — top to bottom (default)
- `270` — right to left

The following example renders a left-to-right gradient line. Select part of the X axis to zoom:

<div data-chart-example="series-types/line"></div>

See [LinearGradient](../api/Series/Visual/interfaces/LinearGradient.md) and [GradientStop](../api/Series/Visual/interfaces/GradientStop.md) for the complete configuration.

### Zoom and range slider

The gradient uses the full series bounds before zoom or range-slider filtering. Colors at retained points stay the same after zoom, reset, and range-slider changes. The range-slider preview uses the same colors. Resizing recalculates the full-series gradient for the new dimensions; oblique gradients can change color when the aspect ratio changes.

This applies to category, linear, datetime, and logarithmic axes, including reversed axes. Category axes keep the distances between categories when the other axis filters points. Neighboring points retained for clipping use the same gradient. Null gaps do not restart it.

## Legend colors

A discrete legend uses a solid symbol. For a gradient, it takes the color at offset `0.5`. The series guides describe whether the symbol uses the line or fill color. A [continuous legend](legend.md#continuous-legend) has its own color scale.
