# Bar-Y series

A Bar-Y series displays horizontal bars. Each point provides an `x` value and a `y` coordinate or category. Set `series.data[].type` to `bar-y`.

See the [BarYSeries API reference](../../api/Series/Bar-Y/interfaces/BarYSeries.md) for all series options and [ChartSeriesOptions](../../api/Series/General/interfaces/ChartSeriesOptions.md) for shared defaults.

## Grouping and stacking

Multiple series are grouped by default. Use `stacking: 'normal'` to stack their values or `stacking: 'percent'` to show their proportions. Percent stacking supports only non-negative values. Use `stackId` to create separate stacks and `series.options['bar-y'].stackGap` to set the gap between segments in pixels.

Set `grouping: false` on non-stacked series to overlay their bars at the category center. Each bar starts at the value-axis baseline without accumulating values or taking up grouped slots. Stacked series ignore this option.

Later series in `series.data` cover earlier ones, including their borders. The example places Plan before Actual to draw Actual on top.

{% note warning "Bar thickness" %}

Thickness is controlled by the shared `series.options['bar-y'].barPadding` and `barMaxWidth` options, so Plan and Actual have the same thickness. Independent thickness requires [per-series padding (#761)](https://github.com/gravity-ui/charts/issues/761); this example will then be updated to show a wider Plan behind a narrower Actual.

{% endnote %}

<div data-chart-example="series-types/bar-y-overlay"></div>

## Appearance

### Borders

Set `borderWidth` in pixels (default `0`), `borderColor` as a CSS color, and `borderRadius` in pixels. Set defaults in `series.options['bar-y']` and override them on individual series. The default border color is `var(--gcharts-shape-border-color)`.

### Opacity

Set `opacity` from `0` to `1` in `series.options['bar-y']`, and override it on individual series or points. Omitted or `null` values inherit the next level, defaulting to `1`. Opacity affects the fill and border and leaves normal data labels opaque.

The legend symbol follows series opacity. Tooltip markers follow point opacity, falling back to series opacity. Legend and tooltip text remain opaque; hidden series keep the standard inactive legend symbol.

The example combines borders with a default opacity of `0.8`, `0.3` on Plan, and a point override of `0.6` in February.

<div data-chart-example="series-types/bar-y"></div>

### States

Hover changes the fill color; the border retains its configured color. The inactive state multiplies the resolved fill and border opacity by `states.inactive.opacity`, so transparent bars stay transparent. SVG data labels use the inactive opacity directly. When it ends, bars restore their point or series opacity.
