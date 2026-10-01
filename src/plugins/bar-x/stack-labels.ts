import {group} from 'd3-array';

import type {PrepareShapeDataArgs} from '~core/series/plugin';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import {sumDecimals} from '~core/utils/math';

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
        (item) => JSON.stringify([item.series.yAxis, item.series.stackId, item.x]),
    );
    for (const items of stacks.values()) {
        const options = optionsBySeries.get(items[0].series);
        if (!options?.enabled) continue;
        const plotIndex = args.yAxis?.[items[0].series.yAxis]?.plotIndex ?? 0;
        const pointsBySign = group(
            items.filter((item) => typeof item.data.y === 'number' && Number.isFinite(item.data.y)),
            (item) => Number(item.data.y) < 0,
        );
        for (const negative of [false, true]) {
            const points = pointsBySign.get(negative);
            if (!points?.length) continue;
            const total = sumDecimals(points.map((item) => Number(item.data.y)));
            // Zero segments do not add a separate total beside a negative stack.
            if (total === 0 && pointsBySign.has(true)) continue;
            const extendsUp = points[0].extendsUp;
            const y = extendsUp
                ? Math.min(...points.map((item) => item.y))
                : Math.max(...points.map((item) => item.y + item.height));
            anchors.push({
                options,
                x: points[0].x + points[0].width / 2,
                y,
                total,
                direction: extendsUp ? 'top' : 'bottom',
                plotIndex,
            });
        }
    }
    return anchors;
}
