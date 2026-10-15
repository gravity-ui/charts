import {i18n} from '~core/i18n';
import {getSeriesStackId} from '~core/series/utils';
import {getBarXStackKey} from '~core/shapes/bar-x/utils';

import {CHART_ERROR_CODE, ChartError} from '../libs';
import type {BarXSeries, BarYSeries, ChartSeries} from '../types';

export function validateBarGrouping(args: {
    series: BarXSeries | BarYSeries;
    allSeries: ChartSeries[];
}) {
    const {series, allSeries} = args;
    // Check the collection once per plugin, including initially hidden series.
    if (allSeries.find((item) => item.type === series.type) !== series) return;

    const stacks = new Map<string, BarXSeries | BarYSeries>();
    for (const item of allSeries) {
        if (item.type !== series.type) continue;
        const bar = item as BarXSeries | BarYSeries;
        const grouping = bar.grouping ?? true;
        // Non-stacked overlays have independent layout keys even with an explicit stackId.
        if (!bar.stacking && (!bar.stackId || !grouping)) continue;

        const key = bar.type === 'bar-x' ? getBarXStackKey(bar) : getSeriesStackId(bar);
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
