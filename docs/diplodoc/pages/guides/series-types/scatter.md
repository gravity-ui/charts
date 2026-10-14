# Scatter series

A scatter series places independent observations by their X and Y values.

## When to use

Use it to examine relationships between two numeric variables, clusters, and outliers. Each point should represent one observation. A pattern suggests association, not causation.

## Example

<div data-chart-example="series-types/scatter-basic"></div>

## Data

Set `type: 'scatter'`. Each point contains `x` and `y`. For a category axis, use a category name or its zero-based index in `categories`; for a datetime axis, use a timestamp in milliseconds. See [Axis types](../axes/axis-types.md).

## Series options

### Markers

Use `marker` to set point size and symbol.

### Point clustering

Clustering is disabled by default. Enable it on a scatter series to group visible points into square grid cells:

```javascript
{
  type: 'scatter',
  name: 'Issues',
  data: [
    {x: 1, y: 2, custom: {issueId: 'A'}},
    {x: 1.1, y: 2.1, custom: {issueId: 'B'}},
  ],
  cluster: {
    enabled: true,
    layoutAlgorithm: {type: 'grid', gridSize: 50},
    overlapMode: 'shift',
    marker: {color: '#1F68A9', radius: 8, symbol: 'circle'},
  },
}
```

<div data-chart-example="series-types/scatter"></div>

The only supported algorithm is `grid`. The default `gridSize` is `50` pixels. A number or a string ending in `px` specifies pixels; a percentage is relative to the plot width. Points in the same cell form a cluster when there are at least `minimumClusterSize` of them (default: `2`). The grid and memberships are recalculated when the chart size, zoom, or selected range changes.

Clustering supports linear X and Y axes, or a datetime X axis with a linear Y axis. Other axis combinations are rejected when clustering is enabled. Existing scatter behavior for those axes is unchanged when clustering is disabled.

By default, `overlapMode: 'allow'` leaves cluster markers at their centroids. With `'shift'`, cluster markers can move within their own grid cells to avoid neighboring markers in the same series, including single points. This changes display positions only: the original data coordinates and cluster membership are preserved. Some markers cannot fit inside a small cell, and tightly packed markers cannot always be separated. Single points are never moved.

`cluster.marker` supports `enabled`, `radius`, `symbol`, `color`, `borderColor`, and `borderWidth`. `cluster.dataLabels` supports `enabled`, `style`, `format`, and `allowOverlap`. The count is shown by default in the center of each cluster marker and remains visible on hover. Marker overlap and label overlap are configured separately.

## Colors

Series use the chart palette by default. Set `color` on a series or point to override it. See [Colors](../colors.md). For markers, `data[].marker.color` takes precedence over point and series colors.

## Data labels

Set `dataLabels.enabled: true` on the series to show point values. Use `dataLabels.format` to format them or a point’s `label` to supply custom text. See [Data labels](../data-labels.md). Cluster counts are controlled separately through `cluster.dataLabels`.

## Legend

The discrete legend shows one item per series, using its `name`. Set `legend.itemText` on a series to change the legend text. See [Legend](../legend.md) for layout and selection.

## Tooltip

For an ordinary point, the tooltip shows its Y value and the axis header identifies its X position. Set `tooltip.valueFormat` on the series to format the value; see [Tooltip](../tooltip.md).

### Cluster data

A clustered point supplies `cluster: {size, points}` to tooltip renderers and chart click callbacks. `size` equals `points.length`; each member retains its original coordinates and `custom` fields. Ordinary points have no `cluster` field:

```javascript
chart: {
  events: {
    click: ({point}) => {
      if (point.cluster) {
        console.log(point.cluster.points);
      }
    },
  },
}
```

The default tooltip displays the cluster count independently of the series Y-value format. Tooltip value sorting and built-in totals use that count, while the axis header uses the data centroid. Use a custom tooltip renderer to list members or show other aggregates. Clicking a cluster does not zoom automatically.

Scatter tooltip chunks also include `displayPosition` in plot pixels. Crosshairs snap to that rendered position when a cluster marker has shifted; the data centroid and original member coordinates remain unchanged.

The range-slider overview remains unclustered. `cluster` controls the main chart; `rangeSlider.visible` still controls whether the series appears in the overview.

## API reference

[ScatterSeries](../../api/Series/Scatter/interfaces/ScatterSeries.md) · [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md)
