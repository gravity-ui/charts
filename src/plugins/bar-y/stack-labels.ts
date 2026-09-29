import {group} from 'd3-array';

import type {ChartScale} from '~core/scales/types';
import type {PreparedSeriesOptions} from '~core/series/types';
import type {PreparedBarYData} from '~core/shapes/bar-y/types';
import {sumDecimals} from '~core/utils/math';

import type {StackLabelAnchor} from '../stack-labels';
import {resolveStackLabelsOptions} from '../stack-labels-options';

export function getBarYStackLabelAnchors(
    data: PreparedBarYData[],
    {
        xScale,
        boundsWidth,
        seriesOptions,
    }: {xScale: ChartScale; boundsWidth: number; seriesOptions: PreparedSeriesOptions},
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
        (item) => JSON.stringify([item.series.stackId, item.y]),
    );
    for (const items of stacks.values()) {
        const options = optionsBySeries.get(items[0].series);
        if (!options?.enabled) continue;
        const pointsBySign = group(
            items.filter((item) => typeof item.data.x === 'number' && Number.isFinite(item.data.x)),
            (item) => Number(item.data.x) < 0,
        );
        for (const negative of [false, true]) {
            const points = pointsBySign.get(negative);
            if (!points?.length) continue;
            const total = sumDecimals(points.map((item) => Number(item.data.x)));
            // Zero segments do not add a separate total beside a negative stack.
            if (total === 0 && pointsBySign.has(true)) continue;
            const extendsRight = negative === reversed;
            let x = extendsRight
                ? Math.max(...points.map((item) => item.x + item.width))
                : Math.min(...points.map((item) => item.x));
            // Percent bars may extend beyond the plot due to border compensation.
            if (items[0].series.stacking === 'percent') {
                x = Math.max(0, Math.min(boundsWidth, x));
            }
            anchors.push({
                options,
                x,
                y: points[0].y + points[0].height / 2,
                total,
                direction: extendsRight ? 'right' : 'left',
                plotIndex: 0,
            });
        }
    }
    return anchors;
}
