# HTML Content

## Introduction

Several chart elements support HTML content in their text: data labels, axis labels, legend items, and tooltips. HTML strings are inserted as-is via `dangerouslySetInnerHTML` — the library does not sanitize or validate the input in any way.

This gives you full control over presentation, but also means you are responsible for safety. If the content originates from user input or any untrusted source, sanitize it before passing it to the chart config.

## Security: sanitizing untrusted content

When the data comes from users or external systems, sanitize HTML before building the chart config. Use any sanitization library you prefer — for example [DOMPurify](https://github.com/cure53/DOMPurify) or [sanitize-html](https://github.com/apostrophecms/sanitize-html).

```javascript
// DOMPurify
import DOMPurify from 'dompurify';
label: DOMPurify.sanitize(userInput);

// sanitize-html
import sanitizeHtml from 'sanitize-html';
label: sanitizeHtml(userInput, {
  allowedTags: ['b', 'i', 'span'],
  allowedAttributes: {span: ['style']},
});
```

Apply sanitization when building the config:

```javascript
series: {
  data: [{
    type: 'bar-x',
    dataLabels: {enabled: true, html: true},
    data: [{
      x: 0,
      y: 1200,
      label: sanitize(userInput),
    }],
  }],
}
```

If your content is completely under your control (hardcoded strings, values from your own trusted database), sanitization is not required.

## SVG vs HTML overlay

The `html` flag does not affect sanitization. It controls where in the DOM the element is rendered: inside the SVG or as a separate HTML layer on top of it.

### SVG rendering

Without `html: true`, text elements are rendered directly inside the `<svg>` as `<text>` / `<tspan>` nodes.

```javascript
series: {
  data: [{
    type: 'bar-x',
    dataLabels: {
      enabled: true,
      // html is false by default
    },
    data: [{x: 0, y: 800, label: 'Q1'}],
  }],
}
```

**Advantages:**

- Participates in SVG clipping and masking — labels never bleed outside the plot area.
- Automatic label rotation is supported (`autoRotation`, `rotation` on axis labels).
- Text truncation with ellipsis works via `maxWidth`.
- Fully included in SVG export.
- Predictable z-order relative to chart elements.

**Limitations:**

- Only plain text; HTML tags are not interpreted.
- Styling is limited to `fontSize`, `fontWeight`, `fontColor` from `BaseTextStyle`.
- Multi-line layout requires explicit newline handling.

### HTML overlay

When `html: true` is set, the element is rendered outside the SVG, on a separate HTML layer over the chart.

```javascript
series: {
  data: [{
    type: 'bar-x',
    dataLabels: {
      enabled: true,
      html: true,
    },
    data: [{
      x: 0,
      y: 800,
      label: '<span style="background:#4fc4b7;color:#fff;padding:4px;border-radius:4px;">Q1</span>',
    }],
  }],
}
```

**Advantages:**

- Any HTML tags and inline CSS work: `<b>`, `<i>`, `<span>`, custom fonts, background colors, borders, images, etc.
- Rich multi-line layouts via `<br>` or block elements.
- Full CSS box model — padding, border-radius, shadows.

**Limitations:**

- Rendered outside the SVG, so it does not participate in SVG clipping. Content may visually overflow the chart area in edge cases.
- Not included in SVG export — if you export the chart as an SVG file, HTML labels will be missing.
- Label rotation is not supported — `rotation` and `autoRotation` on axis labels are ignored when `html: true`.
- For axis labels, only `type: 'category'` axes support `html: true`. Datetime and numeric axes do not.
- z-index stacking is managed separately from SVG elements.

## Where 'html: true' is available

### Data labels

Available on most series types: `bar-x`, `bar-y`, `line`, `area`, `pie`, `heatmap`, `treemap`, and others.

```javascript
series: {
  data: [{
    type: 'line',
    dataLabels: {
      enabled: true,
      html: true,
    },
    data: [
      {x: 1, y: 540, label: '<b style="color:#4fc4b7">540</b>'},
      {x: 2, y: 820, label: '<b style="color:#e8684a">820</b>'},
    ],
  }],
}
```

### Axis labels

Only supported on category axes (`type: 'category'`). Rotation options are disabled when `html: true`.

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

### Legend

```javascript
legend: {
  enabled: true,
  html: true,
}
```

When `legend.html` is set, item names in `series.data[].name` are rendered as HTML:

```javascript
legend: {
  enabled: true,
  html: true,
},
series: {
  data: [
    {
      type: 'pie',
      data: [
        {
          name: '<span style="font-weight:bold;color:#4fc4b7">Revenue</span>',
          value: 1200,
        },
        {
          name: '<span style="font-weight:bold;color:#e8684a">Expenses</span>',
          value: 800,
        },
      ],
    },
  ],
}
```

### Tooltip

Tooltip rows support HTML in series names out of the box — no `html` flag required. The tooltip renders series names and formatted values via `dangerouslySetInnerHTML`, so HTML in `series.data[].name` or in `valueFormat` prefix/suffix will be interpreted.

```javascript
series: {
  data: [{
    type: 'bar-x',
    name: '<b>Revenue</b>',
    data: [{x: 0, y: 1200}],
  }],
}
```

## Choosing between SVG and HTML

| Consideration                        | SVG (default) | HTML overlay (`html: true`) |
| ------------------------------------ | ------------- | --------------------------- |
| Plain text values                    | ✓             | ✓                           |
| Rich formatting (bold, colors, etc.) | —             | ✓                           |
| Label rotation                       | ✓             | —                           |
| Text truncation (`maxWidth`)         | ✓             | —                           |
| SVG export                           | ✓             | —                           |
| Clipping to plot area                | ✓             | Partial                     |
| Category axis                        | ✓             | ✓                           |
| Datetime / numeric axis              | ✓             | —                           |

Use SVG rendering when your labels contain plain values and you need rotation, export, or strict clipping. Use the HTML overlay when you need rich formatting — styled badges, custom colors, icons, or multi-line layouts.
