/**
 * - `'outside'`: Outside the value end of the bar.
 * - `'inside-end'`: Inside the visible bar, next to its value end.
 * - `'inside-center'`: Centered in the visible part of the bar.
 */
export type BarSeriesDataLabelPlacementPosition = 'outside' | 'inside-end' | 'inside-center';

/**
 * - `'show'`: Draw at the first available candidate, shifted into the plot, even if it does not fit.
 * - `'hide'`: Hide the label when no candidate fits.
 */
export type BarSeriesDataLabelPlacementFallback = 'show' | 'hide';

/** @minItems 1 */
type BarSeriesDataLabelPlacementPositions = BarSeriesDataLabelPlacementPosition[];

export interface BarSeriesDataLabelPlacementOptions {
    /**
     * Candidate positions tried in order. `'auto'` means `['outside', 'inside-end']`.
     * Candidates must fit entirely within the plot; inside candidates must also fit
     * within the visible bar, with `padding` at both ends along the value axis.
     * In stacks, outside is skipped for inner segments when inside candidates are available.
     * Outside-only placement labels every segment, including inner segments.
     * Takes precedence over `inside`, including in percent stacks.
     * Uses the available plot space without reserving extra axis space for labels,
     * except for non-percent bar-y with only outside candidates, which reserves X axis space.
     * When omitted, the existing `inside` behavior is preserved.
     */
    placement?: 'auto' | BarSeriesDataLabelPlacementPositions;
    /**
     * Used when none of the placement candidates fits. Only applies when `placement` is set.
     * Overlap filtering still follows `allowOverlap`.
     * @default 'show'
     */
    placementFallback?: BarSeriesDataLabelPlacementFallback;
}
