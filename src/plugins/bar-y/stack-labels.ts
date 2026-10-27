import {group} from 'd3-array';

import type {PreparedYAxis} from '~core/axes/types';
import type {ChartScale} from '~core/scales/types';
import type {PreparedBarYSeries, PreparedSeriesOptions} from '~core/series/types';
import {prepareBarYData} from '~core/shapes/bar-y/prepare-data';
import type {PreparedBarYData} from '~core/shapes/bar-y/types';
import {getDataCategoryValue} from '~core/utils';

import {getBarStackLabelTotal} from '../bar-stack-labels';
import type {StackLabelAnchor} from '../stack-labels';
import {createStackLabelScalePaddingPreparer} from '../stack-labels';
import {resolveStackLabelsOptions} from '../stack-labels-options';

export const getBarYStackLabelScalePadding = createStackLabelScalePaddingPreparer(
    async (args) => {
        const {xAxis, xScale, yAxis = [], yScale = []} = args;
        if (!xAxis || !xScale) return [];

        const data = await prepareBarYData({
            ...args,
            series: args.series as PreparedBarYSeries[],
            xAxis,
            xScale,
            yAxis,
            yScale,
        });

        return getBarYStackLabelAnchors(data.shapes, {
            xScale,
            seriesOptions: args.seriesOptions,
            yAxis,
        });
    },
    (args) => args.seriesOptions['bar-y'].stackLabels,
);

export function getBarYStackLabelAnchors(
    data: PreparedBarYData[],
    {
        xScale,
        seriesOptions,
        yAxis,
    }: {
        xScale: ChartScale;
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
        data.filter(
            (item) =>
                item.series.stacking || optionsBySeries.get(item.series)?.valueSource === 'custom',
        ),
        (item, index) =>
            JSON.stringify([
                item.series.stacking ? item.series.stackId : [item.series.id, index],
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
        const participants = items.filter((item) => optionsBySeries.get(item.series)?.enabled);
        if (!participants.length) continue;

        const options = optionsBySeries.get(participants[0].series);
        if (!options) continue;

        const custom = options.valueSource === 'custom';
        const geometry = custom ? items : participants;

        const pointsBySign = group(
            geometry.filter(
                (item) => typeof item.data.x === 'number' && Number.isFinite(item.data.x),
            ),
            (item) => Number(item.data.x) < 0,
        );

        for (const negative of [false, true]) {
            const points = pointsBySign.get(negative);
            if (!points?.length) continue;

            const total = getBarStackLabelTotal(points, {
                valueAxis: 'x',
                custom,
                hasNegativeStack: pointsBySign.has(true),
                isEnabled: (point) => Boolean(optionsBySeries.get(point.series)?.enabled),
            });
            if (total === undefined) continue;

            const extendsRight = negative === reversed;
            const outer = points.reduce((end, item) =>
                (extendsRight ? item.x + item.width > end.x + end.width : item.x < end.x)
                    ? item
                    : end,
            );
            let x = extendsRight ? outer.x + outer.width : outer.x;
            // Percent bars may extend beyond the plot due to border compensation.
            if (items[0].series.stacking === 'percent') {
                x = Math.max(
                    Math.min(rangeStart, rangeEnd),
                    Math.min(Math.max(rangeStart, rangeEnd), x),
                );
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
