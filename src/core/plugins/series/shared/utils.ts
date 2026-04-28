import {path} from 'd3-path';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3-scale';
import type {BaseType} from 'd3-selection';
import {select} from 'd3-selection';
import get from 'lodash/get';

import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import type {ChartScale} from '../../../scales/types';
import type {BasicInactiveState} from '../../../types';
import {getDataCategoryValue} from '../../../utils';
import type {ZoomState} from '../../../zoom/types';

const ONE_POINT_DOMAIN_DATA_CAPACITY = 3;

export function getXValue(args: {
    point: {x?: number | string | null};
    points?: {x?: number | string | null}[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
}) {
    const {point, points, xAxis, xScale} = args;

    if (xAxis.type === 'category') {
        const xBandScale = xScale as ScaleBand<string>;
        const categories = get(xAxis, 'categories', [] as string[]);
        const dataCategory = getDataCategoryValue({axisDirection: 'x', categories, data: point});
        return (xBandScale(dataCategory) || 0) + xBandScale.step() / 2;
    }

    let xLinearScale = xScale as ScaleLinear<number, number> | ScaleTime<number, number>;
    const [xMinDomain, xMaxDomain] = xLinearScale.domain();

    if (
        Number(xMinDomain) === Number(xMaxDomain) &&
        points?.length === ONE_POINT_DOMAIN_DATA_CAPACITY
    ) {
        const x1 = Number(points[0].x);
        const xTarget = Number(points[1].x);
        const x3 = Number(points[2].x);
        if (!Number.isNaN(x1) && !Number.isNaN(xTarget) && !Number.isNaN(x3)) {
            const xMin = Math.min(x1, xTarget, x3);
            const xMax = Math.max(x1, xTarget, x3);
            xLinearScale = xLinearScale
                .copy()
                .domain([xMin + (xTarget - xMin) / 2, xMax - (xMax - xTarget) / 2]) as
                | ScaleLinear<number, number>
                | ScaleTime<number, number>;
        }
    }

    return point.x === null ? null : xLinearScale(point.x as number);
}

export function getYValue(args: {
    point: {y?: number | string | null};
    points?: {y?: number | string | null}[];
    yAxis: PreparedYAxis;
    yScale: ChartScale;
}) {
    const {point, points, yAxis, yScale} = args;

    if (yAxis.type === 'category') {
        const yBandScale = yScale as ScaleBand<string>;
        const categories = get(yAxis, 'categories', [] as string[]);
        const dataCategory = getDataCategoryValue({axisDirection: 'y', categories, data: point});
        return (yBandScale(dataCategory) || 0) + yBandScale.step() / 2;
    }

    let yLinearScale = yScale as ScaleLinear<number, number> | ScaleTime<number, number>;
    const [yMinDomain, yMaxDomain] = yLinearScale.domain();

    if (
        Number(yMinDomain) === Number(yMaxDomain) &&
        points?.length === ONE_POINT_DOMAIN_DATA_CAPACITY
    ) {
        const y1 = Number(points[0].y);
        const yTarget = Number(points[1].y);
        const y3 = Number(points[2].y);
        if (!Number.isNaN(y1) && !Number.isNaN(yTarget) && !Number.isNaN(y3)) {
            const yMin = Math.min(y1, yTarget, y3);
            const yMax = Math.max(y1, yTarget, y3);
            yLinearScale = yLinearScale
                .copy()
                .domain([yMin + (yTarget - yMin) / 2, yMax - (yMax - yTarget) / 2]) as
                | ScaleLinear<number, number>
                | ScaleTime<number, number>;
        }
    }

    return point.y === null ? null : yLinearScale(point.y as number);
}

// Slack for d3 scale rounding (a `500` edge can come back as `499.9999`).
// Half a pixel matches the ±0.5 of a 1px centered stroke and far exceeds any
// plausible float error.
const Y_RANGE_PIXEL_TOLERANCE = 0.5;

/**
 * Hides out-of-range points from line/area path generators via `hiddenInLine`.
 * Neighbors of in-range points are kept as anchors so the path retains its
 * slope at the plot edges instead of stopping abruptly at the visible point.
 *
 * Pixel check alone is not enough: a degenerate/clamped scale domain (see the
 * y-scale.ts guard) can map out-of-range data into the plot rectangle, leaving
 * phantom hover targets. Pass `axisMin`/`axisMax` + `getDataY` to also reject
 * points whose raw value is outside the user's intended range.
 *
 * Stacked shapes must NOT pass the data check — `point.data.y` is the unstacked
 * value and doesn't reflect where the point actually lands on the plot.
 */
export function markHiddenPointsOutOfYRange<
    P extends {y: number | null; hiddenInLine?: boolean},
>(args: {
    points: P[];
    yScale: ChartScale;
    yAxisTop: number;
    axisMin?: number;
    axisMax?: number;
    getDataY?: (point: P) => unknown;
}): void {
    const {points, yScale, yAxisTop, axisMin, axisMax, getDataY} = args;
    const [yRangeA, yRangeB] = yScale.range() as [number, number];
    const yMinPx = yAxisTop + Math.min(yRangeA, yRangeB);
    const yMaxPx = yAxisTop + Math.max(yRangeA, yRangeB);
    const hasDataBoundsCheck =
        Boolean(getDataY) && (typeof axisMin === 'number' || typeof axisMax === 'number');

    const isInRange = (point: P): boolean => {
        if (point.y === null) {
            return false;
        }

        if (hasDataBoundsCheck) {
            const dataY = getDataY?.(point);

            if (typeof dataY === 'number') {
                if (typeof axisMin === 'number' && dataY < axisMin) {
                    return false;
                }

                if (typeof axisMax === 'number' && dataY > axisMax) {
                    return false;
                }
            }
        }

        return (
            point.y >= yMinPx - Y_RANGE_PIXEL_TOLERANCE &&
            point.y <= yMaxPx + Y_RANGE_PIXEL_TOLERANCE
        );
    };

    const inRange = points.map(isInRange);
    for (let idx = 0; idx < points.length; idx++) {
        if (!inRange[idx] && !inRange[idx - 1] && !inRange[idx + 1]) {
            points[idx].hiddenInLine = true;
        }
    }
}

export function shapeKey(d: unknown) {
    return (d as {id?: string | number}).id || -1;
}

export function setActiveState<T extends {active?: boolean}>(args: {
    element: BaseType;
    datum: T;
    state: BasicInactiveState | undefined;
    active: boolean;
}) {
    const {element, datum, state, active} = args;
    const elementSelection = select<BaseType, T>(element);

    if (datum.active !== active) {
        datum.active = active;
        const opacity = datum.active ? null : state?.opacity;
        elementSelection.attr('opacity', opacity || null);
    }

    return datum;
}

export function getRectPath(args: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number | number[];
}) {
    const {x, y, width, height, borderRadius = 0} = args;
    const borderRadiuses =
        typeof borderRadius === 'number' ? new Array(4).fill(borderRadius) : borderRadius;
    const [
        borderRadiusTopLeft = 0,
        borderRadiusTopRight = 0,
        borderRadiusBottomRight = 0,
        borderRadiusBottomLeft = 0,
    ] = borderRadiuses ?? [];

    const p = path();

    let startAngle = -Math.PI / 2;
    const angle = Math.PI / 2;

    p.moveTo(x + borderRadiusTopLeft, y);
    p.lineTo(x + width - borderRadiusTopRight, y);
    p.arc(
        x + width - borderRadiusTopRight,
        y + borderRadiusTopRight,
        borderRadiusTopRight,
        startAngle,
        startAngle + angle,
    );
    startAngle += angle;

    p.lineTo(x + width, y + height - borderRadiusBottomRight);
    p.arc(
        x + width - borderRadiusBottomRight,
        y + height - borderRadiusBottomRight,
        borderRadiusBottomRight,
        startAngle,
        startAngle + angle,
    );
    startAngle += angle;

    p.lineTo(x + borderRadiusBottomLeft, y + height);
    p.arc(
        x + borderRadiusBottomLeft,
        y + height - borderRadiusBottomLeft,
        borderRadiusBottomLeft,
        startAngle,
        startAngle + angle,
    );
    startAngle += angle;

    p.lineTo(x, y + borderRadiusTopLeft);
    p.arc(
        x + borderRadiusTopLeft,
        y + borderRadiusTopLeft,
        borderRadiusTopLeft,
        startAngle,
        startAngle + angle,
    );

    p.closePath();

    return p;
}

export function getRectBorderPath(args: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderWidth: number;
    borderRadius?: number | number[];
}) {
    const {x, y, width, height, borderWidth, borderRadius = 0} = args;

    if (!borderWidth) {
        return '';
    }

    const halfWidth = borderWidth / 2;
    const expandedWidth = width + borderWidth;
    const expandedHeight = height + borderWidth;
    const innerWidth = width - borderWidth;
    const innerHeight = height - borderWidth;

    const borderRadiuses =
        typeof borderRadius === 'number' ? new Array(4).fill(borderRadius) : borderRadius;
    const [
        borderRadiusTopLeft = 0,
        borderRadiusTopRight = 0,
        borderRadiusBottomRight = 0,
        borderRadiusBottomLeft = 0,
    ] = borderRadiuses ?? [];

    const adjustOuterRadius = (radius: number) => (radius ? radius + halfWidth : 0);
    const outerBorderRadius = [
        adjustOuterRadius(borderRadiusTopLeft),
        adjustOuterRadius(borderRadiusTopRight),
        adjustOuterRadius(borderRadiusBottomRight),
        adjustOuterRadius(borderRadiusBottomLeft),
    ];

    const outerPath = getRectPath({
        x: x - halfWidth,
        y: y - halfWidth,
        width: expandedWidth,
        height: expandedHeight,
        borderRadius: outerBorderRadius,
    }).toString();

    if (innerWidth <= 0 || innerHeight <= 0) {
        return outerPath;
    }

    const innerBorderRadius = [
        Math.max(borderRadiusTopLeft - halfWidth, 0),
        Math.max(borderRadiusTopRight - halfWidth, 0),
        Math.max(borderRadiusBottomRight - halfWidth, 0),
        Math.max(borderRadiusBottomLeft - halfWidth, 0),
    ];

    const innerPath = getRectPath({
        x: x + halfWidth,
        y: y + halfWidth,
        width: innerWidth,
        height: innerHeight,
        borderRadius: innerBorderRadius,
    }).toString();

    return `${outerPath} ${innerPath}`;
}

export function getClipPathIdByBounds(args: {clipPathId: string; bounds?: 'horizontal'}) {
    const {bounds, clipPathId} = args;

    return bounds ? `${clipPathId}-${bounds}` : clipPathId;
}

export function getSeriesClipPathId(args: {
    clipPathId: string;
    yAxis: PreparedYAxis[];
    zoomState?: Partial<ZoomState>;
}) {
    const {clipPathId, yAxis, zoomState} = args;
    const hasMinOrMax = yAxis.some(
        (axis) => typeof axis?.min === 'number' || typeof axis?.max === 'number',
    );
    const hasZoom = zoomState && Object.keys(zoomState).length > 0;

    if (!hasZoom && !hasMinOrMax) {
        return `${clipPathId}-horizontal`;
    }

    return clipPathId;
}
