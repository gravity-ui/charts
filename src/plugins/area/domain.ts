import {group} from 'd3-array';

import type {AxisDomainValue, DomainViewport, GetAxisDataArgs} from '~core/series/axis-contract';
import {getDomainPoints} from '~core/series/domain-points';
import {getStackedDomainValues} from '~core/series/stacked-domain';
import {getSeriesStackId} from '~core/series/utils';
import {
    createAreaStackAccumulator,
    getAreaNeighborPoint,
    getAreaStackContext,
} from '~core/shapes/area/stack';

import type {AreaSeries, AreaSeriesData} from '../../types';
import {getVisiblePathYValues} from '../path-domain';

interface AreaDomainSeries extends Pick<AreaSeries, 'data' | 'stacking' | 'stackId' | 'nullMode'> {
    fullData?: readonly AreaSeriesData[];
}

function getSampleDomain(series: readonly AreaDomainSeries[], viewport?: DomainViewport) {
    return getStackedDomainValues({
        series,
        categoryKey: 'x',
        valueKey: 'y',
        getData: (item) => {
            const points = getDomainPoints(item.data, viewport, {axes: item.stacking ? 'x' : 'xy'});
            // Area projection keeps the last point at each X, including an explicit null.
            return [...new Map(points.map((point) => [String(point.x), point])).values()];
        },
    });
}

/** Clip both boundaries after stacking on the same X grid used by the renderer. */
function getVisibleStackValues(series: readonly AreaDomainSeries[], viewport: DomainViewport) {
    const context = getAreaStackContext(series, viewport.x, false);
    const keys = new Set<string>();
    const dataMaps = series.map((item, index) => {
        const data =
            item.fullData && item.fullData !== item.data
                ? new Map(item.data.map((point) => [String(point.x), point]))
                : context.dataMaps[index];
        for (const key of data.keys()) keys.add(key);
        return data;
    });
    const orderedKeys = Array.from(keys).sort((a, b) => Number(a) - Number(b));
    const getStackOffsets = createAreaStackAccumulator();
    const values: AxisDomainValue[] = [];
    for (let index = series.length - 1; index >= 0; index--) {
        const item = series[index];
        const upper: {x: number; y: number | null}[] = [];
        const lower: typeof upper = [];
        for (const key of orderedKeys) {
            const point = dataMaps[index].get(key);
            if (
                item.nullMode === 'connect' &&
                (!point || point.y === null || point.y === undefined)
            ) {
                continue;
            }
            const value = point ? (point.y ?? (item.nullMode === 'zero' ? 0 : null)) : 0;
            const x = Number(key);
            if (typeof value !== 'number') {
                upper.push({x, y: null});
                lower.push({x, y: null});
                continue;
            }
            const neighbors = context.neighbors.get(key);
            const offsets = getStackOffsets({
                key,
                value,
                prev: getAreaNeighborPoint(context.dataMaps[index], neighbors?.prev),
                next: getAreaNeighborPoint(context.dataMaps[index], neighbors?.next),
                nullMode: item.nullMode,
            });
            upper.push({x, y: value + offsets.prev});
            lower.push({x, y: offsets.prev});
            if (offsets.prev !== offsets.next) {
                upper.push({x, y: value + offsets.next});
                lower.push({x, y: offsets.next});
            }
        }
        for (const points of [upper, lower]) {
            for (const value of getVisiblePathYValues({points, viewport}) ?? []) values.push(value);
        }
    }
    return values;
}

export function getAreaAxisData({series, viewport}: GetAxisDataArgs<AreaDomainSeries>) {
    if (!viewport?.x.range || viewport.x.type === 'category' || viewport.y.type === 'category') {
        return {domainValues: getSampleDomain(series, viewport)};
    }
    const values: AxisDomainValue[] = [];
    for (const stack of group(series, getSeriesStackId).values()) {
        const clipStack =
            stack.some((item) => item.stacking === 'normal') &&
            !stack.some((item) => item.stacking === 'percent');
        const contribution = clipStack
            ? getVisibleStackValues(stack, viewport)
            : getSampleDomain(stack, viewport);
        for (const value of contribution) values.push(value);
    }
    return {domainValues: values};
}
