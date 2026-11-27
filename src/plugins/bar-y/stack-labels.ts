import {group} from 'd3-array';

import type {PreparedYAxis} from '~core/axes/types';
import type {ChartScale} from '~core/scales/types';
import type {PreparedSeriesOptions} from '~core/series/types';
import {getDataCategoryValue} from '~core/utils';

import {getStackLabelGroups, getStackLabelValue} from '../stack-labels';
import type {StackLabelAnchor} from '../stack-labels';
import {resolveStackLabelsOptions} from '../stack-labels-options';

import type {PreparedBarYData} from './types';

export function getBarYStackLabelAnchors(
    data: PreparedBarYData[],
    {
        xScale,
        boundsWidth,
        seriesOptions,
        yAxis,
    }: {
        xScale: ChartScale;
        boundsWidth: number;
        seriesOptions: PreparedSeriesOptions;
        yAxis?: PreparedYAxis[];
    },
) {
    const anchors: StackLabelAnchor[] = [];
    const optionsBySeries = new Map(
        [...new Set(data.map((item) => item.series))].map((series) => [
            series,
            resolveStackLabelsOptions(seriesOptions['bar-y'].stackLabels, series.stackLabels),
        ]),
    );
    const [rangeStart, rangeEnd] = xScale.range();
    const reversed = rangeStart > rangeEnd;
    const stacks = group(
        data.filter((item) => item.series.stacking && optionsBySeries.get(item.series)?.enabled),
        (item) =>
            JSON.stringify([
                item.series.stackId,
                yAxis?.[0]?.type === 'category'
                    ? getDataCategoryValue({
                          axisDirection: 'y',
                          categories: yAxis[0].categories ?? [],
                          data: item.data,
                      })
                    : item.data.y,
            ]),
    );
    for (const items of stacks.values()) {
        const options = optionsBySeries.get(items[0].series);
        if (!options?.enabled) continue;
        const groups = getStackLabelGroups(items, (item) => item.data.x, options.mode);
        for (const {points, edgePoints, negative, total} of groups) {
            const extendsRight = negative === reversed;
            const outer = edgePoints.reduce((end, item) =>
                (extendsRight ? item.x + item.width > end.x + end.width : item.x < end.x)
                    ? item
                    : end,
            );
            let x = extendsRight ? outer.x + outer.width : outer.x;
            // Percent bars may extend beyond the plot due to border compensation.
            if (items[0].series.stacking === 'percent') {
                x = Math.max(0, Math.min(boundsWidth, x));
            }
            anchors.push({
                options,
                x,
                y: outer.y + outer.height / 2,
                total:
                    typeof options.aggregation === 'function'
                        ? getStackLabelValue(
                              options,
                              points.map((item) => item.data),
                              total,
                          )
                        : total,
                direction: extendsRight ? 'right' : 'left',
                plotIndex: 0,
            });
        }
    }
    return anchors;
}
