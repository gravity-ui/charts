import {group} from 'd3-array';

import type {PrepareShapeDataArgs} from '~core/series/plugin';
import type {PreparedBarXSeries} from '~core/series/types';
import {prepareBarXData} from '~core/shapes/bar-x/prepare-data';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import {getDataCategoryValue} from '~core/utils';

import {getBarStackLabelTotal} from '../bar-stack-labels';
import type {StackLabelAnchor} from '../stack-labels';
import {createStackLabelScalePaddingPreparer} from '../stack-labels';
import {resolveStackLabelsOptions} from '../stack-labels-options';

export const getBarXStackLabelScalePadding = createStackLabelScalePaddingPreparer(
    async (args) => {
        const {xAxis, xScale, yAxis = [], yScale = [], split} = args;
        if (!xAxis || !xScale || !split) return [];

        const data = await prepareBarXData({
            ...args,
            series: args.series as PreparedBarXSeries[],
            xAxis,
            xScale,
            yAxis,
            yScale,
            split,
        });

        return getBarXStackLabelAnchors(data, args);
    },
    (args) => args.seriesOptions['bar-x'].stackLabels,
);

export function getBarXStackLabelAnchors(data: PreparedBarXData[], args: PrepareShapeDataArgs) {
    const anchors: StackLabelAnchor[] = [];
    const optionsBySeries = new Map(
        [...new Set(data.map((item) => item.series))].map((series) => [
            series,
            resolveStackLabelsOptions(args.seriesOptions['bar-x'].stackLabels, series.stackLabels),
        ]),
    );
    const stacks = group(
        data.filter(
            (item) =>
                item.series.stacking || optionsBySeries.get(item.series)?.valueSource === 'custom',
        ),
        (item, index) =>
            JSON.stringify([
                item.series.yAxis,
                item.series.stacking ? item.series.stackId : [item.series.id, index],
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
        const participants = items.filter((item) => optionsBySeries.get(item.series)?.enabled);
        if (!participants.length) continue;

        const options = optionsBySeries.get(participants[0].series);
        if (!options) continue;

        const custom = options.valueSource === 'custom';
        const geometry = custom ? items : participants;
        const plotIndex = args.yAxis?.[items[0].series.yAxis]?.plotIndex ?? 0;
        const pointsBySign = group(
            geometry.filter(
                (item) => typeof item.data.y === 'number' && Number.isFinite(item.data.y),
            ),
            (item) => Number(item.data.y) < 0,
        );

        for (const negative of [false, true]) {
            const points = pointsBySign.get(negative);
            if (!points?.length) continue;

            const total = getBarStackLabelTotal(points, {
                valueAxis: 'y',
                custom,
                hasNegativeStack: pointsBySign.has(true),
                isEnabled: (point) => Boolean(optionsBySeries.get(point.series)?.enabled),
            });
            if (total === undefined) continue;

            const extendsUp = points[0].extendsUp;
            const outer = points.reduce((end, item) =>
                (extendsUp ? item.y < end.y : item.y + item.height > end.y + end.height)
                    ? item
                    : end,
            );
            const y = extendsUp ? outer.y : outer.y + outer.height;
            anchors.push({
                options,
                x: outer.x + outer.width / 2,
                y,
                total,
                direction: extendsUp ? 'top' : 'bottom',
                plotIndex,
            });
        }
    }

    return anchors;
}
