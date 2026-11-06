import {max, min} from 'd3-array';
import isNil from 'es-toolkit/compat/isNil';

import type {AxisDomainValue, DomainAxis, GetAxisDataArgs} from '~core/series/axis-contract';
import {getDomainPoints} from '~core/series/domain-points';
import {getLineSegments, segmentIntersectsRect} from '~core/shapes/line/auto-placement';
import {filterPoints} from '~core/zoom/filter-data';
import type {FilterSeriesDataArgs} from '~core/zoom/filter-data';

import type {LineSeries} from '../../types';
import {getVisiblePathYValues} from '../path-domain';

import {getCurveFactory} from './interpolation';

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
    const selection = filterPoints(series.data, viewport, {mode: 'path'});
    if (selection.data.length || !selection.shapeData?.length) return selection;

    // Retained anchors can straddle an axis without a defined path entering the selected rectangle.
    const projectX = createCoordinateProjector(viewport.x);
    const projectY = createCoordinateProjector(viewport.y);
    const points = selection.shapeData.map((point) => ({
        x: projectX(point.x),
        y: projectY(point.y),
    }));
    const segments = getLineSegments([
        {points, curveFactory: getCurveFactory(series.interpolation), lineWidth: 0},
    ]);
    const [xMin, xMax] = viewport.x.range
        ? viewport.x.range.map(projectX)
        : [min(segments, (segment) => segment.xMin), max(segments, (segment) => segment.xMax)];
    const [yMin, yMax] = viewport.y.range
        ? viewport.y.range.map(projectY)
        : [min(segments, (segment) => segment.yMin), max(segments, (segment) => segment.yMax)];
    if (isNil(xMin) || isNil(xMax) || isNil(yMin) || isNil(yMax)) {
        return {...selection, shapeData: []};
    }
    const rect = {x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin};
    const hasGeometry = segments.some((segment) => segmentIntersectsRect(segment, rect));
    return hasGeometry ? selection : {...selection, shapeData: []};
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
