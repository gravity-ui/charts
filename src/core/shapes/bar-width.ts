import type {PreparedBarXSeries, PreparedBarYSeries} from '../series/types';
import {getSeriesStackId} from '../series/utils';

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
    const stackKey = (s: T) => JSON.stringify(['yAxis' in s ? s.yAxis : 0, getSeriesStackId(s)]);
    const paddingByStack = new Map<string, number>();
    for (const s of series) {
        const key = stackKey(s);
        paddingByStack.set(key, Math.max(paddingByStack.get(key) ?? s.barPadding, s.barPadding));
    }

    return new Map(
        series.map((s) => [
            s,
            getBarWidth(
                s.grouping === false ? groupSize : barSlotSize,
                paddingByStack.get(stackKey(s)) ?? s.barPadding,
                maxWidth,
            ),
        ]),
    );
}
