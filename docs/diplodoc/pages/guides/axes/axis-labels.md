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

## Additional levels

Use `labels.additionalLevels` to place group labels alongside the existing tick labels. The first entry is nearest the base labels; add more entries for broader groupings. This works on X and Y axes for every series that uses those axes.

```javascript
labels: {
  additionalLevels: [
    {
      ranges: [
        {from: 0, to: 2, value: 'North'},
        {from: 3, to: 4, value: 'South'},
      ],
    },
    {ranges: [{from: 0, to: 4, value: 2026}]},
  ],
}
```

For category axes, `from` and `to` are zero-based indexes **after `order`, before `min`/`max` and zoom**. Both endpoint categories are included in full. Recalculate ranges when changing category order. On datetime axes, boundaries are Unix timestamps in milliseconds; on linear and logarithmic axes, they are numeric coordinates (positive for logarithmic axes). Boundaries must be finite and `from <= to`.

`value` is independent of the axis type: pass a string or number, or use a level's optional `format` to format numbers, dates, or custom values. The format uses the same [ValueFormat](../value-formatting.md) contract as data labels, including `{type: 'custom', formatter: ({value}) => ...}`. Without `format`, the value is converted to a string. Base tick formatting is not inherited.

This example shows day ticks, month ranges, and a year range on the same time scale:

<div data-chart-example="axis-labels/additional-levels"></div>

Ranges can leave gaps, repeat label values, and have different widths. Labels are centered over the visible part of each range, including after zoom. The chart reserves room for the extra levels and moves axis titles accordingly. Labels follow the axis direction (horizontal on X, rotated on Y), use the axis label font size and padding, and are shortened to fit. Overlapping labels within a level may be hidden.

Additional levels always use plain SVG text; `html`, `rotation`, and the base tick format continue to control the base labels. `labels.enabled: false` or `visible: false` hides all levels. Calendar ranges are supplied explicitly by the caller.

## Related guides

- See [Axis Types](./axis-types.md) for choosing between linear, logarithmic, datetime, and category axes.
- See [Value Formatting](../value-formatting.md) for number and datetime label formatting.
- See [Theming](../theming.md) for axis grid-line and tick-mark colors.
