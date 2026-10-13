import get from 'lodash/get';
import groupBy from 'lodash/groupBy';

import type {ChartInteractionItem, TooltipDataChunk} from '../../types';
import {getSeriesPlugin} from '../series/seriesRegistry';
import type {TooltipItemData} from '../shapes/types';

import {getNearestItem} from './chart-interaction';
import {getClosestPointsByXValue, isPointTooltipEnabled} from './tooltip-helpers';
import type {ShapePoint} from './tooltip-helpers';

interface GetClosestPointsArgs {
    position: [number, number];
    shapesData: TooltipItemData[];
    boundsHeight: number;
    boundsWidth: number;
}

function getSeriesType(shapeData: TooltipItemData) {
    return (
        get(shapeData, 'series.type') ||
        get(shapeData, 'point.series.type') ||
        get(shapeData, 'type')
    );
}

export type {ShapePoint} from './tooltip-helpers';

export function getClosestPoints(args: GetClosestPointsArgs): TooltipDataChunk[] {
    const {position, shapesData, boundsHeight, boundsWidth} = args;
    const [pointerX, pointerY] = position;

    const result: TooltipDataChunk[] = [];
    const xLookupPoints: ShapePoint[] = [];
    const groups = groupBy(shapesData, getSeriesType);

    for (const [seriesType, list] of Object.entries(groups)) {
        let plugin;
        try {
            plugin = getSeriesPlugin(seriesType);
        } catch {
            continue;
        }

        const {chunks, xLookupPoints: seriesXLookupPoints} = plugin.tooltip.prepareData({
            data: list,
            position,
            boundsWidth,
            boundsHeight,
        });

        result.push(...chunks.filter(isPointTooltipEnabled));
        if (seriesXLookupPoints) {
            for (const p of seriesXLookupPoints) {
                if (isPointTooltipEnabled(p)) {
                    xLookupPoints.push(p);
                }
            }
        }
    }

    if (xLookupPoints.length) {
        result.push(
            ...(getClosestPointsByXValue(pointerX, pointerY, xLookupPoints) as TooltipDataChunk[]),
        );
    }

    return result;
}

interface GetChartClosestArgs extends GetClosestPointsArgs {
    mode: 'chart' | 'tooltip';
    seriesOrder: string[];
}

export function getChartClosest(args: GetChartClosestArgs): ChartInteractionItem | null {
    if (args.mode === 'chart') {
        const candidates = Object.entries(groupBy(args.shapesData, getSeriesType)).flatMap(
            ([seriesType, data]) => {
                const plugin = getSeriesPlugin(seriesType);
                return plugin.interaction?.prepareNearestData({data}) ?? [];
            },
        );
        return getNearestItem(args.position, candidates, args.seriesOrder);
    }
    // Preserve the legacy tooltip candidate priority and eligibility in this mode.
    const selected = getClosestPoints(args).find((item) => item.closest);
    if (!selected) return null;
    const plugin = getSeriesPlugin(selected.series.type);
    return (
        plugin.interaction?.getClosestItem?.(selected) ??
        ({
            point: selected.data,
            series: selected.series,
        } as ChartInteractionItem)
    );
}
