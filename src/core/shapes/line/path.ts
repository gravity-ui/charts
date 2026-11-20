import type {LineSeries} from '../../../types';

export interface LinePathPoint {
    x: number | null;
    y: number | null;
    hiddenInLine?: boolean;
    series?: Pick<LineSeries, 'interpolation'>;
}

export function hasSmoothInterpolation({interpolation}: Pick<LineSeries, 'interpolation'>) {
    return interpolation?.type === 'cardinal' || interpolation?.type === 'monotone';
}

export function isVisibleLinePoint<T extends LinePathPoint>(
    point: T,
): point is T & {x: number; y: number} {
    return point.x !== null && point.y !== null && !point.hiddenInLine;
}

function isFinitePathPoint<T extends LinePathPoint>(point: T): point is T & {x: number; y: number} {
    return Number.isFinite(point.x) && Number.isFinite(point.y);
}

/** Smooth paths use retained observations even when their markers are outside Y bounds. */
export function getLinePathPointFilter(series?: Pick<LineSeries, 'interpolation'>) {
    return series && hasSmoothInterpolation(series) ? isFinitePathPoint : isVisibleLinePoint;
}
