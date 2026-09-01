/**
 * Sub-pixel slack for "does this point belong to the plot area?" checks.
 *
 * A point that mathematically lands exactly on a plot edge can come back from
 * the scales as `-1e-14` (or `499.9999` on the opposite side) — formally out of
 * bounds, visually indistinguishable from the edge itself. Without the slack such
 * a point silently loses its data label and gets its marker clipped, and the set
 * of affected points changes with every resize.
 *
 * Half a pixel matches the ±0.5 of a 1px centered stroke and far exceeds any
 * plausible float error.
 */
export const PLOT_BOUNDS_PIXEL_TOLERANCE = 0.5;
