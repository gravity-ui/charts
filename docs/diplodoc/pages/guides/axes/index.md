# Axes

Configure the X axis with `xAxis` and Y axes with `yAxis`. Choose an [axis type](./axis-types.md), then adjust limits, ticks, and labels.

## Axis limits and tick rounding

Use `min` and `max` to set axis limits. Numeric axes accept numbers, datetime axes accept timestamps, and category axes accept category indices after ordering. Category limits are not supported for waterfall and heatmap charts.

`startOnTick` and `endOnTick` round the corresponding limits outward to convenient tick values, including explicitly set limits. For exact linear limits, set both to `false`. These options default to `true` for X axes and datetime Y axes, and `false` for linear/logarithmic Y axes.

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
- **Percentages** — use a string such as `'5%'`, relative to the axis length after margins, axes, and legend layout.

Explicit sizes add space beyond the otherwise computed range. Tick rounding can leave more space than requested. Oversized requests are bounded to keep a usable scale; markers can still clip when the chart is too small.

### Limits and ticks

Padding extends only free boundaries. An explicit `min` or `max` takes precedence on that side. Use `startOnTick` or `endOnTick` to round the extended boundary to a tick.

Zoomed boundaries and the selected X range stay fixed. The range slider overview does not apply axis padding. Category axes and normalized percentage axes ignore it.

### Supported series

Automatic padding measures markers in line, area, area-range, and scatter series. Labels and tooltips do not contribute. Other Cartesian series on the same axis use the extended range too. Explicit sizes work on continuous axes regardless of series type.

### Migrating from `maxPadding`

`maxPadding` is deprecated but keeps its numeric type, defaults, and behavior. Set `padding.max` to override it, including with `0` or `'auto'`. Setting only `padding.min` leaves `maxPadding` in effect.

Legacy `maxPadding` numbers are fractions; new `padding` numbers are pixels. For example, `maxPadding: 0.05` requests a proportion comparable to `padding: {max: '5%'}`. The resulting limits can differ because the new option fits space after the existing axis layout. Keep `maxPadding` when exact legacy behavior is required.

## Labels {#labels}

Axis labels show a value or category for each tick. Configure them with `xAxis.labels` for the X axis and `yAxis[].labels` for Y axes.

### Font size {#font-size}

Set `labels.style.fontSize` to a CSS font-size value. The X and Y axes can use different sizes.

```javascript
xAxis: {
  labels: {
    style: {
      fontSize: '16px',
    },
  },
},
yAxis: [
  {
    labels: {
      style: {
        fontSize: '18px',
      },
    },
  },
],
```

The following example applies custom font sizes to both axes:

<div data-chart-example="axis-labels/font-size"></div>

### HTML labels {#html-labels}

HTML labels are supported only on category axes (`type: 'category'`). Rotation options are disabled when `html: true`.

```javascript
xAxis: {
  type: 'category',
  categories: [
    '<span style="color:#4fc4b7"><b>Jan</b></span>',
    '<span style="color:#e8684a"><b>Feb</b></span>',
  ],
  labels: {
    html: true,
  },
}
```

HTML strings are inserted as-is. Sanitize any content that comes from users or other untrusted sources. See [HTML Content](../html.md) for security guidance and a comparison of SVG and HTML rendering.

## Related guides

- See [Value Formatting](../value-formatting.md) for number and datetime label formatting.
- See [Theming](../theming.md) for axis grid-line and tick-mark colors.
