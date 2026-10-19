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
    maxWidth: number,
) {
    return new Map(
        series.map((s) => [
            s,
            getBarWidth(
                s.grouping === false ? groupSize : barSlotSize,
                s.stackBarPadding,
                maxWidth,
            ),
        ]),
    );
}
