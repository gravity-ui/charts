# Axis Labels

Axis labels show a value or category for each tick. Configure them with `xAxis.labels` for the X axis and `yAxis[].labels` for Y axes.

## Font size

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

## HTML labels

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

- See [Axis Types](./axis-types.md) for choosing between linear, logarithmic, datetime, and category axes.
- See [Value Formatting](../value-formatting.md) for number and datetime label formatting.
- See [Theming](../theming.md) for axis grid-line and tick-mark colors.
