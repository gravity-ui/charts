# Theming

## CSS custom properties

The chart exposes a set of CSS custom properties that you can override to customize the appearance without changing the chart configuration.

To override them, define the variables on the element wrapping the `Chart` component:

```css
.my-chart-container {
  --gcharts-axis-tick-color: #ccc;
}
```

```jsx
<div className="my-chart-container">
  <Chart data={data} />
</div>
```

### Available properties

| Property                            | Default                          | Description                                                                                                        |
| ----------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `--gcharts-axis-tick-color`         | `var(--g-color-line-generic)`    | Stroke color for axis grid lines                                                                                   |
| `--gcharts-axis-tick-mark-color`    | Grid color or domain color       | Stroke color for axis tick marks. Defaults to grid line color when grid is enabled, or domain line color otherwise |
| `--gcharts-data-labels`             | `var(--g-color-text-secondary)`  | Font color for data labels on shapes                                                                               |
| `--gcharts-shape-border-color`      | `var(--g-color-base-background)` | Border color for shapes (e.g. bar segments in stacked charts)                                                      |
| `--gcharts-tooltip-content-padding` | `8px 0`                          | Padding inside the tooltip content area                                                                            |
| `--gcharts-brush-color`             | `rgba(51, 92, 173, 0.25)`        | Fill color of the brush selection area                                                                             |
| `--gcharts-brush-border-color`      | `rgb(153, 153, 153)`             | Border color of the brush selection area                                                                           |
