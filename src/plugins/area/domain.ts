import {group} from 'd3-array';

import type {AxisDomainValue, DomainViewport, GetAxisDataArgs} from '~core/series/axis-contract';
import {getDomainPoints} from '~core/series/domain-points';
import {getStackedDomainValues} from '~core/series/stacked-domain';
import {getSeriesStackId} from '~core/series/utils';

import type {AreaSeries, AreaSeriesData} from '../../types';
import {getCurveFactory} from '../interpolation';
import {getVisiblePathYValues} from '../path-domain';

import {getAreaGeometryDomain} from './geometry';
import {createAreaStackAccumulator, getAreaNeighborPoint, getAreaStackContext} from './stack';
import {withAreaGeometryBreaks} from './zoom';

interface AreaDomainSeries extends Pick<
    AreaSeries,
    'data' | 'stacking' | 'stackId' | 'nullMode' | 'interpolation'
> {
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
        for (const key of data.keys()) {
            keys.add(key);
        }
        return data;
    });
    const orderedKeys = Array.from(keys).sort((a, b) => Number(a) - Number(b));
    const getStackOffsets = createAreaStackAccumulator();
    const values: AxisDomainValue[] = [];
    const smooth = series.some(
        (item) =>
            item.interpolation?.type === 'monotone' || item.interpolation?.type === 'cardinal',
    );
    const transformX = viewport.x.type === 'logarithmic' ? Math.log : Number;
    const limits = viewport.x.range;
    const minX = limits ? transformX(limits[0]) : 0;
    const width = limits ? transformX(limits[1]) - minX : 1;
    if (!Number.isFinite(minX) || !Number.isFinite(width) || width < 0) {
        return [];
    }
    const projectX = (value: number) => (transformX(value) - minX) / (width || 1);
    let positiveBase = 1;
    if (smooth && viewport.y.type === 'logarithmic' && series.some((item) => item.stacking)) {
        let minimum = Infinity;
        for (const item of series) {
            for (const point of item.data) {
                if (typeof point.y === 'number' && point.y > 0) {
                    minimum = Math.min(minimum, point.y);
                }
            }
        }
        if (Number.isFinite(minimum)) {
            positiveBase = minimum / 10;
        }
    }
    const projectY =
        viewport.y.type === 'logarithmic'
            ? (value: number) => Math.log(value > 0 ? value : positiveBase)
            : Number;
    const invertY = viewport.y.type === 'logarithmic' ? Math.exp : Number;
    const geometry: Parameters<typeof getAreaGeometryDomain>[0] = [];
    for (let index = series.length - 1; index >= 0; index--) {
        const item = series[index];
        const upper: {
            x: number;
            y: number | null;
            stackValue?: number;
            data?: AreaSeriesData;
        }[] = [];
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
            upper.push({x, y: value + offsets.prev, stackValue: value, data: point});
            lower.push({x, y: offsets.prev, data: point});
            if (offsets.prev !== offsets.next) {
                upper.push({x, y: value + offsets.next, stackValue: value, data: point});
                lower.push({x, y: offsets.next, data: point});
            }
        }
        if (smooth && item.stacking) {
            geometry.push({
                series: item,
                points: withAreaGeometryBreaks(
                    upper.map((point, i) => ({
                        x: projectX(point.x),
                        y: point.y === null ? null : projectY(point.y),
                        y0: projectY(lower[i].y ?? 0),
                        stackValue: point.stackValue,
                        data: point.data,
                    })),
                    item.data,
                ),
            });
            continue;
        }
        for (const points of [upper, lower]) {
            for (const value of getVisiblePathYValues({
                points: withAreaGeometryBreaks(points, item.data),
                viewport,
                curveFactory: getCurveFactory(item.interpolation),
            }) ?? []) {
                values.push(value);
            }
        }
    }
    if (geometry.length) {
        for (const value of getAreaGeometryDomain(geometry, {
            projection: {project: projectY, invert: invertY},
            xRange: limits ? [0, width > 0 ? 1 : 0] : undefined,
            logarithmic: viewport.y.type === 'logarithmic',
        })) {
            values.push(value);
        }
    }
    return values;
}

export function getAreaAxisData({series, viewport}: GetAxisDataArgs<AreaDomainSeries>) {
    if (!viewport || viewport.x.type === 'category' || viewport.y.type === 'category') {
        return {domainValues: getSampleDomain(series, viewport)};
    }
    const values: AxisDomainValue[] = [];
    for (const stack of group(series, getSeriesStackId).values()) {
        const smooth = stack.some(
            (item) =>
                item.interpolation?.type === 'cardinal' || item.interpolation?.type === 'monotone',
        );
        const clipStack =
            (viewport.x.range || smooth) && !stack.some((item) => item.stacking === 'percent');
        const contribution = clipStack
            ? getVisibleStackValues(stack, viewport)
            : getSampleDomain(stack, viewport);
        for (const value of contribution) {
            values.push(value);
        }
    }
    return {domainValues: values};
}
