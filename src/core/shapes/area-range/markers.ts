import type {PreparedYAxis} from '../../axes/types';
import type {ChartScale} from '../../scales/types';
import type {PreparedAreaRangeSeries} from '../../series/types';
import {createGradientColorResolver} from '../../utils/gradient';
import {buildHoverMarkerGetter, getMarkerFill} from '../marker';
import type {HoveredShapeData, MarkerItem} from '../types';

import type {AreaRangePointData} from './types';
import {getRangeBBox} from './utils';

export function prepareAreaRangeMarkers(args: {
    points: AreaRangePointData[];
    series: PreparedAreaRangeSeries;
    yAxis: PreparedYAxis;
    yScale: ChartScale;
    yAxisTop: number;
    isOutsideBounds: (x: number, y: number) => boolean;
}) {
    const {points, series, yAxis, yScale, yAxisTop, isOutsideBounds} = args;
    const {normal, hover} = series.marker.states;
    const bbox = series.gradient ? getRangeBBox(points) : null;
    const getColor =
        series.gradient && bbox ? createGradientColorResolver(series.gradient, bbox) : undefined;
    const minY = yAxisTop + Math.min(...yScale.range());
    const maxY = yAxisTop + Math.max(...yScale.range());
    const markers: MarkerItem[] = [];
    const getters: Array<(data: HoveredShapeData[]) => MarkerItem[]> = [];

    const getHoverStyle = (fill: string): NonNullable<MarkerItem['hover']> => ({
        radius: hover.radius,
        symbolType: hover.symbol,
        fill: hover.color ?? fill,
        stroke: hover.borderColor,
        strokeWidth: hover.borderWidth,
        halo: hover.halo.enabled ? {size: hover.halo.size, opacity: hover.halo.opacity} : undefined,
    });

    for (const boundary of ['y0', 'y1'] as const) {
        const boundaryPoints = points.flatMap((point) => {
            const y = point[boundary];
            const value = point.data[boundary];
            if (
                point.hiddenInTooltip ||
                y === null ||
                value === null ||
                (boundary === 'y1' && point.y0 === point.y1) ||
                !Number.isFinite(point.x) ||
                !Number.isFinite(y) ||
                isOutsideBounds(point.x, y) ||
                y < minY - 0.5 ||
                y > maxY + 0.5 ||
                (typeof yAxis.min === 'number' && value < yAxis.min) ||
                (typeof yAxis.max === 'number' && value > yAxis.max)
            ) {
                return [];
            }
            const color = point.data.marker?.color ?? point.data.color ?? normal.color;
            return [
                {
                    x: point.x,
                    y,
                    data: point.data,
                    color,
                    fill: color === undefined ? getColor?.(point.x, y) : undefined,
                },
            ];
        });
        const hoverOnlyPoints = boundaryPoints.filter((point) => {
            const normalEnabled = point.data.marker?.states?.normal?.enabled ?? normal.enabled;
            if (!normalEnabled) return true;
            const fill = getMarkerFill(point, series.color);
            markers.push({
                cx: point.x,
                cy: point.y,
                radius: normal.radius,
                symbolType: normal.symbol,
                fill,
                stroke: normal.borderColor,
                strokeWidth: normal.borderWidth,
                opacity: 1,
                active: true,
                clipped: false,
                series: {id: series.id},
                data: point.data,
                hover: hover.enabled ? getHoverStyle(fill) : undefined,
            });
            return false;
        });
        getters.push(
            buildHoverMarkerGetter(hoverOnlyPoints, {
                ...series,
                marker: {
                    states: {normal: {...normal, enabled: false, symbol: hover.symbol}, hover},
                },
            }),
        );
    }

    return {
        markers,
        getHoverMarkers: (hovered: HoveredShapeData[]) => {
            const selected = hovered.map(({data, series: hoveredSeries}) => ({
                data,
                series: hoveredSeries,
            }));
            return getters
                .flatMap((getMarkers) => getMarkers(selected))
                .map((marker) => ({
                    ...marker,
                    ...getHoverStyle(marker.fill),
                }));
        },
    };
}
