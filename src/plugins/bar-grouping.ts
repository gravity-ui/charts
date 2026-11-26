import {i18n} from '~core/i18n';

import {CHART_ERROR_CODE, ChartError} from '../libs';
import type {BarXSeries, BarYSeries, ChartSeries} from '../types';

type BarSeries = BarXSeries | BarYSeries;

export function validateBarGrouping(args: {
    series: BarSeries;
    allSeries: ChartSeries[];
    getStackKey: (series: BarSeries) => string;
}) {
    const {series, allSeries, getStackKey} = args;
    // Check the collection once per plugin, including initially hidden series.
    if (allSeries.find((item) => item.type === series.type) !== series) return;

    const stacks = new Map<string, BarSeries>();
    for (const bar of allSeries) {
        if (bar.type !== series.type) continue;
        const grouping = bar.grouping ?? true;
        // Non-stacked overlays have independent layout keys even with an explicit stackId.
        if (!bar.stacking && (!bar.stackId || !grouping)) continue;

        const key = getStackKey(bar);
        const previous = stacks.get(key);
        if (previous && (previous.grouping ?? true) !== grouping) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_inconsistent-stack-grouping', {
                    firstSeries: previous.name,
                    secondSeries: bar.name,
                }),
            });
        }
        stacks.set(key, bar);
    }
}
