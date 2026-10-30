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

Set `min`, `max`, or both inside `padding`. They refer to the minimum and maximum **values**, including on reversed axes. An omitted minimum adds no space. The maximum defaults to `'1%'` on X and `'5%'` on Y. Heatmap axes and datetime Y axes with explicit `timestamps` default to `0`.

### Choosing a size

- **Automatic** — use `'auto'` to fit markers, their borders, enabled hover sizes, and visible scatter halos. It reuses space already available in the range. Space is reserved before hovering, so hovering does not move the axes.
- **Pixels** — use a nonnegative number or pixel string, such as `12` or `'12px'`.
- **Percentages** — extend the chosen boundary by a share of the axis value range before padding. Both sides use the same range, taken from the data extent and any explicit limits.

For a linear range of `[0, 100]`, this configuration extends the minimum by 10 and the maximum by 25, giving `[-10, 125]` before space for bars and labels and tick rounding:

```ts
padding: {
    min: '10%',
    max: '25%',
}
```

Percentages do not describe fractions of the final visible width or height. Pixel and automatic sizes add space beyond the otherwise computed range. Tick rounding can leave more space than requested.

Oversized padding requests are bounded to keep a usable scale; markers can still clip when the chart is too small.

On a logarithmic axis, percentages extend the original logarithmic span. For `[1, 100]`, setting both ends to `'25%'` produces approximately `[0.316, 316.23]` before other offsets and rounding. Equal percentages extend both sides equally in scale coordinates, independently of axis direction.

### Limits and ticks

Padding extends only free boundaries. An explicit `min` or `max` takes precedence on that side. `startOnTick` and `endOnTick` can round the extended boundaries outward.

For percentages on X, tick rounding uses the range before padding. The percentage extension itself is not rounded: `[0, 100]` with `padding.max: '25%'` ends at 125 even with `endOnTick: true`, and that boundary can fall between ticks.

{% note info "When padding is ignored" %}

- Zoomed boundaries stay fixed for every padding unit, including percentages.
- X padding is ignored when `xAxis.rangeSlider.enabled` is `true`. The range slider overview does not fit pixel or automatic padding.
- Category axes and axes normalized with `stacking: 'percent'` ignore `padding` entirely.

{% endnote %}

### Supported series

Automatic padding measures markers in line, area, area-range, and scatter series. Labels and tooltips do not contribute. Other Cartesian series on the same axis use the extended range too. Explicit sizes work on continuous axes regardless of series type.

{% note info "Migrating from v1" %}

`maxPadding` has been replaced by `padding.max`. Convert fractions to percentage strings: `maxPadding: 0.25` becomes `padding: {max: '25%'}`. Numbers inside `padding` are pixels.

See [Migrating from v1 to v2](../../development/migration-v2.md) for automatic conversion and the corrected zoom and logarithmic behavior.

{% endnote %}

## Labels

See [Axis labels](./axis-labels.md) for label styling and HTML labels.

## Related guides

- See [Value Formatting](../value-formatting.md) for number and datetime label formatting.
- See [Theming](../theming.md) for axis grid-line and tick-mark colors.
