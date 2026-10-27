# Axes

Configure the X axis with `xAxis` and Y axes with `yAxis`. Choose an [axis type](./axis-types.md), then adjust limits, ticks, and labels.

## Axis limits and tick rounding

Use `min` and `max` to set axis limits. Numeric axes accept numbers, datetime axes accept timestamps, and category axes accept category indices after ordering. Category limits are not supported for waterfall and heatmap charts.

`startOnTick` and `endOnTick` round the corresponding limits outward to convenient tick values, including explicitly set limits. For exact linear limits, set both to `false`. These options default to `true` for X axes and datetime Y axes, and `false` for linear/logarithmic Y axes.

Two linear Y axes in the same plot synchronize their ticks when both enable `startOnTick` and `endOnTick`. Logarithmic axes calculate their ticks independently.

## Axis padding {#axis-padding}

Markers at an axis limit can be clipped by the plot edge. Automatic axis padding extends the value range just enough to fit them, including their hover state. Ticks and grid lines cover the extended range as usual.

This example makes room for markers at the free limits:

<div data-chart-example="layout/axis-padding"></div>

```ts
xAxis: {
    padding: {min: 'auto', max: 'auto'},
}
```

Set `min`, `max`, or both inside `padding`. They refer to the minimum and maximum **values**, including on reversed axes. An omitted minimum adds no space; an omitted maximum keeps the existing `maxPadding` behavior.

### Choosing a size

- **Automatic** — use `'auto'` to fit markers, their borders, enabled hover sizes, and visible scatter halos. It reuses space already available in the range. Space is reserved before hovering, so hovering does not move the axes.
- **Pixels** — use a nonnegative number or pixel string, such as `12` or `'12px'`.
- **Percentages** — expand both ends using the same initial scale, before space for bars and labels and tick rounding. For a linear range of `[0, 100]`, `padding: {min: '10%', max: '25%'}` gives `[-10, 125]` before rounding. The percentages do not describe fractions of the final visible width or height.

Pixel and automatic sizes add space beyond the otherwise computed range. Tick rounding can leave more space than requested. Oversized visual-space requests are bounded to keep a usable scale; markers can still clip when the chart is too small.

On a logarithmic axis, percentages extend the original logarithmic span. For `[1, 100]`, setting both ends to `'25%'` produces approximately `[0.316, 316.23]` before other offsets and rounding. Equal percentages extend both sides equally in scale coordinates, independently of axis direction.

An omitted maximum continues to use `maxPadding` and its defaults. On a logarithmic axis, that calculation differs from an explicit percentage. Set both `padding.min` and `padding.max` to control both ends with the percentage rule.

### Limits and ticks

Padding extends only free boundaries. An explicit `min` or `max` takes precedence on that side. Use `startOnTick` or `endOnTick` to round the extended boundary to a tick.

Pixel and automatic padding do not extend zoomed boundaries. Percentage padding keeps the same initial-scale calculation during zoom. X padding is ignored when `xAxis.rangeSlider.enabled` is `true`. The range slider overview does not apply visual-space fitting. Category axes ignore visual-space fitting, and normalized percentage axes ignore padding.

Y axes with explicit `timestamps` ignore percentage padding.

### Supported series

Automatic padding measures markers in line, area, area-range, and scatter series. Labels and tooltips do not contribute. Other Cartesian series on the same axis use the extended range too. Explicit sizes work on continuous axes regardless of series type.

## Labels

See [Axis labels](./axis-labels.md) for label styling and HTML labels.

## Related guides

- See [Value Formatting](../value-formatting.md) for number and datetime label formatting.
- See [Theming](../theming.md) for axis grid-line and tick-mark colors.
