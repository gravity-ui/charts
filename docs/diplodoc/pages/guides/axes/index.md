# Axes

Configure the X axis with `xAxis` and Y axes with `yAxis`. Choose an [axis type](./axis-types.md), then adjust limits, ticks, and labels.

## Axis limits and tick rounding

Use `min` and `max` to set axis limits. Numeric axes accept numbers, datetime axes accept timestamps, and category axes accept category indices after ordering. Category limits are not supported for waterfall and heatmap charts.

`startOnTick` and `endOnTick` round the corresponding limits outward to convenient tick values, including explicitly set limits. For exact linear limits, set both to `false`. These options default to `true` for X axes and datetime Y axes, and `false` for linear/logarithmic Y axes.

{% note info %}

[Plot padding](../spacing.md#plot-padding) applies after limits and tick rounding. It can move the boundary values and ticks inward while the axis line still spans the plot, visually extending beyond them. For example, `max: 100` with `endOnTick: false` still ends at the value `100`, but top padding moves that mark below the top edge. Disabling tick rounding does not disable this space.

{% endnote %}

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
