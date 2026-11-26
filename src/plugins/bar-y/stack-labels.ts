import {group} from 'd3-array';

import type {PreparedYAxis} from '~core/axes/types';
import type {ChartScale} from '~core/scales/types';
import type {PreparedSeriesOptions} from '~core/series/types';
import type {PreparedBarYData} from '~core/shapes/bar-y/types';
import {getDataCategoryValue, isBandScale} from '~core/utils';
import {sumDecimals} from '~core/utils/math';

import {getStackLabelValue} from '../stack-labels';
import type {StackLabelAnchor} from '../stack-labels';
import {resolveStackLabelsOptions} from '../stack-labels-options';

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
        const pointsBySign = group(
            items.filter((item) => typeof item.data.x === 'number' && Number.isFinite(item.data.x)),
            (item) => Number(item.data.x) < 0,
        );
        for (const negative of [false, true]) {
            const points = pointsBySign.get(negative);
            if (!points?.length) continue;
            const axisTotal = sumDecimals(points.map((item) => Number(item.data.x)));
            const total =
                typeof options.aggregation === 'function'
                    ? getStackLabelValue(
                          options,
                          points.map((item) => item.data),
                          axisTotal,
                      )
                    : axisTotal;
            const isZeroGroup = axisTotal === 0;
            if (isZeroGroup && total === 0 && pointsBySign.has(true)) continue;

            const extendsRight = negative === reversed;
            const outer = points.reduce((end, item) =>
                (extendsRight ? item.x + item.width > end.x + end.width : item.x < end.x)
                    ? item
                    : end,
            );
            let x = extendsRight ? outer.x + outer.width : outer.x;
            const {stackValueEndX} = outer;
            if (isZeroGroup && outer.series.stacking === 'normal' && !isBandScale(xScale)) {
                x = xScale(0);
            } else if (
                stackValueEndX !== undefined &&
                (Math.min(x, stackValueEndX) < 0 || Math.max(x, stackValueEndX) > boundsWidth)
            ) {
                x = stackValueEndX;
            }

            // Percent bars may extend beyond the plot due to border compensation.
            if (items[0].series.stacking === 'percent') {
                x = Math.max(0, Math.min(boundsWidth, x));
            }
            anchors.push({
                options,
                x,
                y: outer.y + outer.height / 2,
                total,
                direction: extendsRight ? 'right' : 'left',
                plotIndex: 0,
            });
        }
    }
    return anchors;
}
