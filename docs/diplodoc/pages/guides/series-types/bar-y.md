# Bar-Y series

A Bar-Y series displays horizontal bars. Each point provides an `x` value and a `y` coordinate or category. Set `series.data[].type` to `bar-y`.

## Point clicks

Set `events.pointClick` on a Bar-Y series to handle clicks on its rendered bars. The callback receives `{point, series}` with the original configured objects and the native `MouseEvent`. It also works when chart, series, or point tooltips are disabled.

<div data-chart-example="series-types/bar-y-events"></div>

A background click does not invoke a point callback. Range slider previews do not invoke point actions. Data labels keep their existing pointer behavior: labels inside a bar let the click reach the bar, and labels outside it do not invoke a point action.

The separate `chart.events.click` callback keeps its nearest-point behavior. Native `event.stopPropagation()` prevents it from receiving the bar click; `event.preventDefault()` keeps normal event propagation. Callback return values have no effect.
