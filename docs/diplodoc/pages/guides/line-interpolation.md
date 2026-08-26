# Line Interpolation

By default, line series connect data points with straight segments. The `interpolation` option enables smooth curve rendering while keeping markers, tooltips, and interactions attached to the original data points.

## Monotone

`monotone` uses a cubic spline that is monotone in x. The curve passes through every data point without introducing artificial extrema between adjacent points — a good default choice for most smooth line charts.

```javascript
{
    type: 'line',
    interpolation: {type: 'monotone'},
}
```

<div data-chart-example="line-interpolation/monotone"></div>

## Cardinal

`cardinal` produces a cardinal spline. The `tension` parameter (0–1, default `0`) controls how tightly the curve follows the control points: `0` gives a loose curve, `1` collapses it to straight segments.

```javascript
{
    type: 'line',
    interpolation: {type: 'cardinal', tension: 0.5},
}
```

<div data-chart-example="line-interpolation/cardinal"></div>

## Notes

- Curves pass through every original data point.
- `monotone` requires data points to be ordered monotonically by their x values.
- `nullMode` behavior is preserved: gaps and zero-fills are applied before interpolation.
- To disable interpolation explicitly, set `interpolation: {type: 'linear'}` or omit the option entirely.
