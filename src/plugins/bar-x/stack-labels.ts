import {group} from 'd3-array';

import type {PrepareShapeDataArgs} from '~core/series/plugin';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import {getDataCategoryValue, isBandScale} from '~core/utils';
import {sumDecimals} from '~core/utils/math';

import {getStackLabelValue} from '../stack-labels';
import type {StackLabelAnchor} from '../stack-labels';
import {resolveStackLabelsOptions} from '../stack-labels-options';

export function getBarXStackLabelAnchors(data: PreparedBarXData[], args: PrepareShapeDataArgs) {
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
        const yAxisIndex = items[0].series.yAxis;
        const plotIndex = args.yAxis?.[yAxisIndex]?.plotIndex ?? 0;
        const yScale = args.yScale?.[yAxisIndex];
        const pointsBySign = group(
            items.filter((item) => typeof item.data.y === 'number' && Number.isFinite(item.data.y)),
            (item) => Number(item.data.y) < 0,
        );
        for (const negative of [false, true]) {
            const points = pointsBySign.get(negative);
            if (!points?.length) continue;
            const axisTotal = sumDecimals(points.map((item) => Number(item.data.y)));
            const total =
                typeof options.aggregation === 'function'
                    ? getStackLabelValue(
                          options,
                          points.map((item) => item.data),
                          axisTotal,
                      )
                    : axisTotal;
            const zeroBesideNegative = axisTotal === 0 && pointsBySign.has(true);
            if (zeroBesideNegative && total === 0) continue;

            const extendsUp = points[0].extendsUp;
            const outer = points.reduce((end, item) =>
                (extendsUp ? item.y < end.y : item.y + item.height > end.y + end.height)
                    ? item
                    : end,
            );
            let y = extendsUp ? outer.y : outer.y + outer.height;
            if (zeroBesideNegative && yScale && !isBandScale(yScale)) {
                y = (args.split?.plots[plotIndex]?.top ?? 0) + yScale(0);
            }

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
