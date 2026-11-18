import type {DomainAxis} from '~core/series/axis-contract';
import {getDataCategoryValue} from '~core/utils';
import type {FilterSeriesDataArgs} from '~core/zoom/filter-data';
import {filterPoints} from '~core/zoom/filter-data';

import type {AreaSeries, AreaSeriesData} from '../../types';

import {collectSections} from './curves';

interface AreaPathSeries extends Pick<
    AreaSeries,
    'data' | 'interpolation' | 'stacking' | 'nullMode'
> {}

interface PathNode {
    point: AreaSeriesData;
    x: number;
}
interface PathInterval {
    from: number;
    to: number;
    min: number;
    max: number;
}
interface PathIndex {
    key: string;
    categories?: readonly string[];
    nodes: PathNode[];
    intervals: PathInterval[];
}

const pathIndexes = new WeakMap<readonly AreaSeriesData[], PathIndex>();
const breaksBefore = new WeakMap<readonly AreaSeriesData[], ReadonlySet<AreaSeriesData>>();

export function getAreaGeometryBreaks(data: readonly AreaSeriesData[]) {
    return breaksBefore.get(data);
}

function getPathIndex(series: AreaPathSeries, axis: DomainAxis): PathIndex {
    const interpolation = series.interpolation ?? {type: 'linear'};
    const key = JSON.stringify([axis.type, interpolation, series.nullMode, series.stacking]);
    const cached = pathIndexes.get(series.data);
    if (cached?.key === key && cached.categories === axis.categories) return cached;
    const categories = [...(axis.categories ?? [])];
    const categoryIndexes = new Map(categories.map((name, index) => [name, index]));
    const transform = axis.type === 'logarithmic' ? Math.log : Number;
    const byX = new Map<number, AreaSeriesData>();
    for (const point of series.data) {
        const defined = point.y !== null && point.y !== undefined;
        if (!defined && series.nullMode === 'connect') continue;
        const category =
            axis.type === 'category'
                ? getDataCategoryValue({axisDirection: 'x', categories, data: point})
                : undefined;
        const x =
            axis.type === 'category'
                ? categoryIndexes.get(String(category))
                : transform(Number(point.x));
        if (x !== undefined && Number.isFinite(x)) byX.set(x, point);
    }
    const nodes = [...byX].sort(([a], [b]) => a - b).map(([x, point]) => ({x, point}));
    const positions = new Map(nodes.map((node, index) => [node.x, index]));
    const nullValue = series.nullMode === 'zero' ? 1 : null;
    const curves = collectSections(
        nodes.map(({x, point}) => ({
            x,
            y: point.y === null || point.y === undefined ? nullValue : 1,
        })),
        interpolation,
        Boolean(series.stacking),
    );
    const intervals = [...curves.values()].map((curve) => ({
        from: positions.get(curve.from.x) ?? 0,
        to: positions.get(curve.to.x) ?? 0,
        min: Math.min(curve.from.x, curve.first.x, curve.second.x, curve.to.x),
        max: Math.max(curve.from.x, curve.first.x, curve.second.x, curve.to.x),
    }));
    const result = {key, categories: axis.categories, nodes, intervals};
    pathIndexes.set(series.data, result);
    return result;
}

export function filterAreaData({series, viewport}: FilterSeriesDataArgs<AreaPathSeries>) {
    const defined = (point: AreaSeriesData) => point.y !== null && point.y !== undefined;
    const points = series.nullMode === 'connect' ? series.data.filter(defined) : series.data;
    const selection = filterPoints(points, viewport, {
        mode: 'path',
        axes: series.stacking ? 'x' : 'xy',
        isDefined: defined,
    });
    if (!series.interpolation || series.interpolation.type === 'linear') return selection;
    if (viewport.x.excluded || viewport.y.excluded) return {...selection, shapeData: []};
    if (!viewport.x.range) return {...selection, shapeData: points};
    const index = getPathIndex(series, viewport.x);
    const transform = viewport.x.type === 'logarithmic' ? Math.log : Number;
    const [min, max] = viewport.x.range.map(transform);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max)
        return {...selection, shapeData: []};
    const retained = new Set<number>();
    const retain = (from: number, to: number) => {
        // Retain one tangent neighbor on each side of a visible section.
        for (let i = Math.max(0, from - 1); i <= Math.min(index.nodes.length - 1, to + 1); i++)
            retained.add(i);
    };
    index.nodes.forEach((node, i) => {
        if (node.x >= min && node.x <= max) retain(i, i);
    });
    for (const interval of index.intervals) {
        if (interval.max >= min && interval.min <= max) retain(interval.from, interval.to);
    }
    const ordered = [...retained].sort((a, b) => a - b);
    const shapeData = ordered.map((i) => index.nodes[i].point);
    const gaps = new Set<AreaSeriesData>();
    for (let i = 1; i < ordered.length; i++) {
        if (ordered[i] !== ordered[i - 1] + 1) gaps.add(shapeData[i]);
    }
    breaksBefore.set(shapeData, gaps);
    return {...selection, shapeData};
}
