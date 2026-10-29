import {isNil} from 'es-toolkit/compat';

import type {PreparedSeries} from '~core/series/types';

interface IdentityQueue {
    series: PreparedSeries[];
    index: number;
}

export function reconcileLegendSelection(
    selected: string[],
    previousSeries: PreparedSeries[],
    nextSeries: PreparedSeries[],
): string[] {
    const selectedIds = new Set(selected);
    const nextIds = new Set(nextSeries.map((series) => series.legend.groupId));
    const previousIds = new Set<string>();
    const previousByIdentity = new Map<string, IdentityQueue>();

    for (const series of previousSeries) {
        previousIds.add(series.legend.groupId);
        // Reserve surviving groups before matching regenerated IDs by name.
        if (nextIds.has(series.legend.groupId) || !isNil(series.legend.source?.groupId)) continue;
        const identity = JSON.stringify([series.type, series.name]);
        let queue = previousByIdentity.get(identity);
        if (!queue) {
            queue = {series: [], index: 0};
            previousByIdentity.set(identity, queue);
        }
        queue.series.push(series);
    }

    const result = new Set<string>();
    for (const series of nextSeries) {
        let visible: boolean;
        if (previousIds.has(series.legend.groupId)) {
            visible = selectedIds.has(series.legend.groupId);
        } else if (isNil(series.legend.source?.groupId)) {
            const queue = previousByIdentity.get(JSON.stringify([series.type, series.name]));
            const previous = queue?.series[queue.index++];
            visible = previous ? selectedIds.has(previous.legend.groupId) : series.visible;
        } else {
            visible = series.visible;
        }
        if (visible) result.add(series.legend.groupId);
    }
    return [...result];
}
