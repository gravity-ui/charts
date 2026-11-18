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
import {getCurveFactory} from '../interpolation';
import {getVisiblePathYValues} from '../path-domain';

import {buildAreaGeometry} from './geometry';
import {getAreaGeometryBreaks} from './zoom';

// Target one millionth of each visible interval's Y range, independently of pixels.
const DOMAIN_RELATIVE_TOLERANCE = 1e-6;

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
        for (const key of data.keys()) keys.add(key);
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
    const limits = viewport.x.range ?? [0, 1];
    const minX = transformX(limits[0]);
    const width = transformX(limits[1]) - minX;
    if (smooth && !(width > 0)) return getSampleDomain(series, viewport);
    const projectX = (value: number) => (transformX(value) - minX) / width;
    let positiveBase = 1;
    if (smooth && viewport.y.type === 'logarithmic') {
        let minimum = Infinity;
        for (const item of series)
            for (const point of item.data)
                if (typeof point.y === 'number' && point.y > 0)
                    minimum = Math.min(minimum, point.y);
        if (Number.isFinite(minimum)) positiveBase = minimum / 10;
    }
    const projectY =
        viewport.y.type === 'logarithmic'
            ? (value: number) => Math.log(value > 0 ? value : positiveBase)
            : Number;
    const invertY = viewport.y.type === 'logarithmic' ? Math.exp : Number;
    const geometry: Parameters<typeof buildAreaGeometry>[0] = [];
    for (let index = series.length - 1; index >= 0; index--) {
        const item = series[index];
        const breaks = smooth ? getAreaGeometryBreaks(item.data) : undefined;
        const upper: {x: number; y: number | null; stackValue?: number}[] = [];
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
            if (breaks?.has(point as AreaSeriesData)) {
                upper.push({x, y: null});
                lower.push({x, y: null});
            }
            upper.push({x, y: value + offsets.prev, stackValue: value});
            lower.push({x, y: offsets.prev});
            if (offsets.prev !== offsets.next) {
                upper.push({x, y: value + offsets.next, stackValue: value});
                lower.push({x, y: offsets.next});
            }
        }
        if (smooth) {
            geometry.push({
                series: item,
                points: upper.map((point, i) => ({
                    x: projectX(point.x),
                    y: point.y === null ? null : projectY(point.y),
                    y0: projectY(lower[i].y ?? 0),
                    stackValue: point.stackValue,
                })),
            });
            continue;
        }
        for (const points of [upper, lower]) {
            for (const value of getVisiblePathYValues({
                points,
                viewport,
                curveFactory: getCurveFactory(item.interpolation),
            }) ?? [])
                values.push(value);
        }
    }
    if (smooth) {
        for (const shape of buildAreaGeometry(geometry, projectY(0), 1, false, {
            projection: {project: projectY, invert: invertY},
            xRange: [0, 1],
            relativeYTolerance: DOMAIN_RELATIVE_TOLERANCE,
        })) {
            for (const column of shape.columns) {
                if (column) values.push(invertY(column.y0), invertY(column.y1));
            }
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
        const clipStack = !stack.some((item) => item.stacking === 'percent');
        const contribution = clipStack
            ? getVisibleStackValues(stack, viewport)
            : getSampleDomain(stack, viewport);
        for (const value of contribution) values.push(value);
    }
    return {domainValues: values};
}
