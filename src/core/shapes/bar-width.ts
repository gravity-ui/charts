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

/** Allow wider grouped series without packing them into slots capped by the shared limit. */
export function getBarLayoutWidth<T extends PreparedBarXSeries | PreparedBarYSeries>(
    series: T[],
    slotSize: number,
    padding: number,
    maxWidth: number,
) {
    const sharedWidth = getBarWidth(slotSize, padding, maxWidth);
    return series.reduce(
        (width, s) =>
            s.grouping !== false && s.stackBarMaxWidth > maxWidth
                ? Math.max(width, getBarWidth(slotSize, s.stackBarPadding, s.stackBarMaxWidth))
                : width,
        sharedWidth,
    );
}
