# Scatter series

A scatter series plots points with numeric X and Y values. Set `type: 'scatter'` and provide each point's `x` and `y` values.

## Point clustering

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

## Tooltip and click data

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
