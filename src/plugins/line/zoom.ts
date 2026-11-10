import {max, min} from 'd3-array';
import isNil from 'es-toolkit/compat/isNil';

import type {AxisDomainValue, DomainAxis, GetAxisDataArgs} from '~core/series/axis-contract';
import {getDomainPoints} from '~core/series/domain-points';
import {
    getLineSegments,
    isDrawnPoint,
    segmentIntersectsRect,
} from '~core/shapes/line/auto-placement';
import {filterPoints} from '~core/zoom/filter-data';
import type {FilterSeriesDataArgs} from '~core/zoom/filter-data';

import type {LineSeries} from '../../types';
import {getVisiblePathYValues} from '../path-domain';

import {getCurveFactory} from './interpolation';

interface PathRun {
    start: number;
    end: number;
    first: number;
    last: number;
}

function createCoordinateProjector(axis: DomainAxis) {
    const categories = axis.type === 'category' ? new Map<string, number>() : undefined;
    if (categories) {
        axis.categories?.forEach((category, index) => {
            if (!categories.has(category)) categories.set(category, index);
        });
    }
    const transform = axis.type === 'logarithmic' ? Math.log : Number;
    return (value: AxisDomainValue): number | null => {
        if (isNil(value)) return null;
        const numeric =
            categories && typeof value === 'string' ? categories.get(value) : Number(value);
        if (isNil(numeric) || (categories && numeric === -1)) return null;
        const projected = transform(numeric);
        return Number.isFinite(projected) ? projected : null;
    };
}

export function filterLineData({series, viewport}: FilterSeriesDataArgs<LineSeries>) {
    const projectX = createCoordinateProjector(viewport.x);
    const projectY = createCoordinateProjector(viewport.y);
    const selection = filterPoints(series.data, viewport, {
        mode: 'path',
        isDefined: (point) => projectX(point.x) !== null && projectY(point.y) !== null,
    });
    const smooth = series.interpolation && series.interpolation.type !== 'linear';
    if (
        selection.data.length ||
        viewport.x.type === 'category' ||
        viewport.x.excluded ||
        viewport.y.excluded
    )
        return selection;

    // One defined linear X crossing needs neither a geometry scan nor gap separators.
    if (!smooth && !viewport.y.range && selection.shapeData?.length === 2) return selection;

    // Check the original path: segments entering adjacent rectangle edges may have no retained anchors.
    const points = series.data.map((point) => ({
        x: projectX(point.x),
        y: projectY(point.y),
    }));
    const segments = getLineSegments([
        {
            points,
            curveFactory: smooth ? getCurveFactory(series.interpolation) : undefined,
            lineWidth: 0,
            trackPointIndices: true,
        },
    ]);
    const [xMin, xMax] = viewport.x.range
        ? viewport.x.range.map(projectX)
        : [min(segments, (segment) => segment.xMin), max(segments, (segment) => segment.xMax)];
    const [yMin, yMax] = viewport.y.range
        ? viewport.y.range.map(projectY)
        : [min(segments, (segment) => segment.yMin), max(segments, (segment) => segment.yMax)];
    if (isNil(xMin) || isNil(xMax) || isNil(yMin) || isNil(yMax) || xMin > xMax || yMin > yMax) {
        return {...selection, shapeData: []};
    }
    const rect = {x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin};
    const runs: PathRun[] = [];
    let run: PathRun | undefined;
    const pointRuns = points.map((point, index) => {
        if (!isDrawnPoint(point)) {
            run = undefined;
            return undefined;
        }
        if (!run) {
            run = {start: index, end: index, first: Infinity, last: -1};
            runs.push(run);
        }
        run.end = index;
        return run;
    });
    for (const segment of segments) {
        if (!segmentIntersectsRect(segment, rect)) continue;
        const [from, to] = segment.pointIndices as readonly [number, number];
        const pathRun = pointRuns[from] as PathRun;
        pathRun.first = Math.min(pathRun.first, from);
        pathRun.last = Math.max(pathRun.last, to);
    }
    const shapeData: LineSeries['data'] = [];
    let gapIndex: number | undefined;
    for (const pathRun of runs) {
        if (pathRun.last === -1) continue;
        if (gapIndex !== undefined) shapeData.push(series.data[gapIndex]);
        let {first, last} = pathRun;
        if (smooth) {
            // Cardinal/monotone tangents also depend on the neighboring distinct samples.
            while (first > pathRun.start) {
                first--;
                if (
                    points[first].x !== points[pathRun.first].x ||
                    points[first].y !== points[pathRun.first].y
                )
                    break;
            }
            while (last < pathRun.end) {
                last++;
                if (
                    points[last].x !== points[pathRun.last].x ||
                    points[last].y !== points[pathRun.last].y
                )
                    break;
            }
        }
        // Preserve intervening points so an offscreen detour keeps its original path.
        for (let index = first; index <= last; index++) shapeData.push(series.data[index]);
        gapIndex = pathRun.end + 1;
    }
    return {...selection, shapeData};
}

export function getLineAxisData({series, viewport}: GetAxisDataArgs<LineSeries>) {
    if (!viewport?.x.range) return undefined;
    const values: AxisDomainValue[] = [];
    for (const item of series) {
        const contribution =
            getVisiblePathYValues({
                points: item.data,
                viewport,
                curveFactory: getCurveFactory(item.interpolation),
            }) ?? Array.from(getDomainPoints(item.data, viewport), (point) => point?.y);
        for (const value of contribution) values.push(value);
    }
    return {domainValues: values};
}
