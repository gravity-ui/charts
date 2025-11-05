import type {BaseType, ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import {path, select} from 'd3';
import get from 'lodash/get';

import type {BasicInactiveState} from '../../types';
import {getDataCategoryValue} from '../../utils';
import type {ChartScale} from '../useAxisScales';
import type {PreparedAxis} from '../useChartOptions/types';

import type {PreparedLineData} from './line/types';

const ONE_POINT_DOMAIN_DATA_CAPACITY = 3;

export function getXValue(args: {
    point: {x?: number | string | null};
    points?: {x?: number | string | null}[];
    xAxis: PreparedAxis;
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
        const x1 = points[0].x;
        const xTarget = points[1].x;
        const x3 = points[2].x;
        if (typeof x1 === 'number' && typeof xTarget === 'number' && typeof x3 === 'number') {
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
    yAxis: PreparedAxis;
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
        const y1 = points[0].y;
        const yTarget = points[1].y;
        const y2 = points[2].y;
        if (y1 && yTarget && y2) {
            const yMin = Math.min(y1 as number, yTarget as number, y2 as number);
            const yMax = Math.max(y1 as number, yTarget as number, y2 as number);
            yLinearScale = yLinearScale
                .copy()
                .domain([
                    yMin + ((yTarget as number) - yMin) / 2,
                    yMax - (yMax - (yTarget as number)) / 2,
                ]) as ScaleLinear<number, number> | ScaleTime<number, number>;
        }
    }

    return point.y === null ? null : yLinearScale(point.y as number);
}

export function shapeKey(d: unknown) {
    return (d as PreparedLineData).id || -1;
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
