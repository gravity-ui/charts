import type {CurveFactory} from 'd3-shape';
import {curveLinear, line} from 'd3-shape';

import type {AxisDomainValue, DomainViewport} from '~core/series/axis-contract';

import {getSectionYValues} from './interpolation/curves';

interface PathPoint {
    x?: AxisDomainValue;
    y?: AxisDomainValue;
}

interface Args {
    points: readonly PathPoint[];
    viewport: DomainViewport;
    curveFactory?: CurveFactory;
}

/** Clip renderer path pieces and include analytic Bézier extrema. */
export function getVisiblePathYValues({
    points,
    viewport,
    curveFactory = curveLinear,
}: Args): AxisDomainValue[] | undefined {
    if (viewport.x.type === 'category' || viewport.y.type === 'category') {
        return undefined;
    }
    const projectX = viewport.x.type === 'logarithmic' ? Math.log : Number;
    const projectY = viewport.y.type === 'logarithmic' ? Math.log : Number;
    const invertY = viewport.y.type === 'logarithmic' ? Math.exp : Number;
    const min = viewport.x.range ? projectX(viewport.x.range[0]) : -Infinity;
    const max = viewport.x.range ? projectX(viewport.x.range[1]) : Infinity;
    const values: AxisDomainValue[] = [];
    if ((viewport.x.range && (!Number.isFinite(min) || !Number.isFinite(max))) || min > max) {
        return values;
    }
    const projected = Array.from(points, (point) => ({
        x: point?.x === null || point?.x === undefined ? NaN : projectX(Number(point.x)),
        y: point?.y === null || point?.y === undefined ? NaN : projectY(Number(point.y)),
    }));
    let previous: {x: number; y: number} | undefined;
    let unsupportedCurve = false;
    const context = {
        moveTo(x: number, y: number) {
            previous = {x, y};
            if (x >= min && x <= max) {
                values.push(invertY(y));
            }
        },
        lineTo(x: number, y: number) {
            const from = previous;
            previous = {x, y};
            if (!from || Math.max(from.x, x) < min || Math.min(from.x, x) > max) {
                return;
            }
            if (from.x === x) {
                values.push(invertY(from.y), invertY(y));
                return;
            }
            const a = (min - from.x) / (x - from.x);
            const b = (max - from.x) / (x - from.x);
            for (const t of [Math.max(0, Math.min(a, b)), Math.min(1, Math.max(a, b))]) {
                values.push(invertY(from.y + t * (y - from.y)));
            }
        },
        bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
            const from = previous;
            previous = {x, y};
            if (!from) {
                return;
            }
            for (const value of getSectionYValues(
                {
                    from,
                    first: {x: x1, y: y1},
                    second: {x: x2, y: y2},
                    to: {x, y},
                },
                viewport.x.range ? [min, max] : undefined,
            )) {
                values.push(invertY(value));
            }
        },
        quadraticCurveTo() {
            unsupportedCurve = true;
        },
        closePath() {
            previous = undefined;
        },
    };
    line<{x: number; y: number}>()
        .defined((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
        .x((point) => point.x)
        .y((point) => point.y)
        .curve(curveFactory)
        .context(context as unknown as CanvasRenderingContext2D)(projected);
    return unsupportedCurve ? undefined : values;
}
