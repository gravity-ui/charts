# Area plugin

## Interpolation

### Why stacks do not use independent splines

Nonnegative observations do not guarantee nonnegative interpolated thickness. A cardinal spline can overshoot below zero, and separately smoothed cumulative boundaries can cross between observations. Smoothing the upper and lower edges independently therefore cannot guarantee disjoint layers.

The priorities are to prevent overlaps and keep zero-valued intervals empty, then preserve the selected outer contour where possible. Internal boundaries may flatten or develop corners when those requirements conflict with smoothness.

### Preserving the outer contour

Each side of the stack gets an outer contour from the selected interpolation. Interpolated contributions provide nonnegative weights that divide that extent cumulatively. Adjacent layers share the resulting boundary exactly. Accumulation happens in data values before projection: screen-space thickness would give incorrect results on logarithmic axes.

If every eligible cardinal weight overshoots below zero, endpoint weights restore the outer extent. A zero-valued interval has no endpoint weight and stays empty. Percent extents are capped at 100; an outer contour crossing its baseline is clipped there.

On uneven X grids, cardinal handles can turn backwards. Stacked handles are constrained to keep one ordered cross-section per X. This deliberately changes stacked cardinal geometry; unstacked curves retain their original shape.

### Sign changes follow the selected curve

A linear zero crossing would disagree with a smooth outline. Signed intervals instead split at the selected curve's roots, and each resulting part contributes to its own side of the baseline. At a root, a layer can end and restart at different stack offsets. Those ends stay disconnected because joining them would cut through other layers.

Across a sign change, the outer extent comes from the signed contributions rather than a separately rescaled contour. This preserves the curve's zero crossings and avoids discontinuous rescaling, at the cost of changing the outer contour there.

### Why the result is a shared mesh

Clamping and redistributing thickness does not generally produce another cubic Bézier curve. The constrained geometry is therefore sampled adaptively, and every layer uses the same X samples. Fill, outline and hit testing consume that same mesh, avoiding discrepancies between independently approximated boundaries.

Quarter-point probes catch inflections that a midpoint can miss. The rendering target is 0.1 CSS pixels; subdivision stops after 12 levels to bound the work. X clipping happens before subdivision so offscreen intervals do not consume that budget during deep zoom.

Domain fitting uses the same constrained geometry but samples only Y, targeting one millionth of each clipped interval's Y range in axis coordinates. X is normalized to [0, 1] only for clipping. A pixel tolerance or assumed plot width would make fitted bounds depend on display geometry rather than the curve's values.
