import type {PreparedBarXSeries, PreparedBarYSeries} from '../series/types';

import {MIN_BAR_GAP, MIN_BAR_WIDTH} from './bar-constants';

export function getBarWidth(slotSize: number, padding: number, maxWidth: number) {
    const gap = Math.max(slotSize * padding, MIN_BAR_GAP);
    return Math.max(MIN_BAR_WIDTH, Math.min(slotSize - gap, maxWidth));
}

export function getBarWidthBySeries<T extends PreparedBarXSeries | PreparedBarYSeries>(
    series: T[],
    barSlotSize: number,
    groupSize: number,
) {
    return new Map(
        series.map((s) => [
            s,
            getBarWidth(
                s.grouping === false ? groupSize : barSlotSize,
                s.stackBarPadding,
                s.stackBarMaxWidth,
            ),
        ]),
    );
}

/** Expand grouped slots only for drawn series with wider individual limits. */
export function getBarLayout<T extends PreparedBarXSeries | PreparedBarYSeries>(
    series: Iterable<T>,
    slotSize: number,
    padding: number,
    maxWidth: number,
) {
    const sharedWidth = getBarWidth(slotSize, padding, maxWidth);
    const sharedGap = Math.max(slotSize * padding, MIN_BAR_GAP);
    let width = sharedWidth;
    for (const s of series) {
        if (s.grouping !== false && s.stackBarMaxWidth > maxWidth) {
            width = Math.max(width, getBarWidth(slotSize, s.stackBarPadding, s.stackBarMaxWidth));
        }
    }
    // A wider bar consumes its slot's gap; preserving both would overflow the category band.
    const gap =
        width > sharedWidth
            ? Math.max(MIN_BAR_GAP, Math.min(sharedGap, slotSize - width))
            : sharedGap;
    return {width, gap};
}
