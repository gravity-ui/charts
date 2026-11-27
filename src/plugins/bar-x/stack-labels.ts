import {group} from 'd3-array';

import type {PrepareLayerArgs} from '~core/series/plugin';
import type {PreparedSeriesOptions} from '~core/series/types';
import {getDataCategoryValue} from '~core/utils';

import type {StackLabelAnchor} from '../stack-labels';
import {getStackLabelGroups, getStackLabelValue} from '../stack-labels';
import {resolveStackLabelsOptions} from '../stack-labels-options';

import type {PreparedBarXData} from './types';

export function getBarXStackLabelAnchors(
    data: PreparedBarXData[],
    args: PrepareLayerArgs<unknown, PreparedSeriesOptions>,
) {
    const anchors: StackLabelAnchor[] = [];
    const optionsBySeries = new Map(
        [...new Set(data.map((item) => item.series))].map((series) => [
            series,
            resolveStackLabelsOptions(args.seriesOptions['bar-x'].stackLabels, series.stackLabels),
        ]),
    );
    const stacks = group(
        data.filter((item) => item.series.stacking && optionsBySeries.get(item.series)?.enabled),
        (item) =>
            JSON.stringify([
                item.series.yAxis,
                item.series.stackId,
                args.xAxis?.type === 'category'
                    ? getDataCategoryValue({
                          axisDirection: 'x',
                          categories: args.xAxis.categories ?? [],
                          data: item.data,
                      })
                    : item.data.x,
            ]),
    );
    for (const items of stacks.values()) {
        const options = optionsBySeries.get(items[0].series);
        if (!options?.enabled) continue;
        const plotIndex = args.yAxis?.[items[0].series.yAxis]?.plotIndex ?? 0;
        const groups = getStackLabelGroups(items, (item) => item.data.y, options.mode);
        for (const {points, edgePoints, total} of groups) {
            const extendsUp = edgePoints[0].extendsUp;
            const outer = edgePoints.reduce((end, item) =>
                (extendsUp ? item.y < end.y : item.y + item.height > end.y + end.height)
                    ? item
                    : end,
            );
            const y = extendsUp ? outer.y : outer.y + outer.height;
            anchors.push({
                options,
                x: outer.x + outer.width / 2,
                y,
                total:
                    typeof options.aggregation === 'function'
                        ? getStackLabelValue(
                              options,
                              points.map((item) => item.data),
                              total,
                          )
                        : total,
                direction: extendsUp ? 'top' : 'bottom',
                plotIndex,
            });
        }
    }
    return anchors;
}
