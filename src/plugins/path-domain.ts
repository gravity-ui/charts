import type {CurveFactory} from 'd3-shape';
import {curveLinear, line} from 'd3-shape';

import type {AxisDomainValue, DomainViewport} from '~core/series/axis-contract';

interface PathPoint {
    x?: AxisDomainValue;
    y?: AxisDomainValue;
}

interface Args {
    points: readonly PathPoint[];
    viewport: DomainViewport;
    curveFactory?: CurveFactory;
}

/** Clip straight path pieces emitted by the same curve factory as the renderer. */
export function getVisiblePathYValues({
    points,
    viewport,
    curveFactory = curveLinear,
}: Args): AxisDomainValue[] | undefined {
    if (!viewport.x.range || viewport.x.type === 'category' || viewport.y.type === 'category')
        return undefined;
    const projectX = viewport.x.type === 'logarithmic' ? Math.log : Number;
    const projectY = viewport.y.type === 'logarithmic' ? Math.log : Number;
    const invertY = viewport.y.type === 'logarithmic' ? Math.exp : Number;
    const min = projectX(viewport.x.range[0]);
    const max = projectX(viewport.x.range[1]);
    const values: AxisDomainValue[] = [];
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return values;
    const projected = Array.from(points, (point) => ({
        x: point?.x === null || point?.x === undefined ? NaN : projectX(Number(point.x)),
        y: point?.y === null || point?.y === undefined ? NaN : projectY(Number(point.y)),
    }));
    let previous: {x: number; y: number} | undefined;
    let hasCurves = false;
    const context = {
        moveTo(x: number, y: number) {
            previous = {x, y};
            if (x >= min && x <= max) values.push(invertY(y));
        },
        lineTo(x: number, y: number) {
            const from = previous;
            previous = {x, y};
            if (!from || Math.max(from.x, x) < min || Math.min(from.x, x) > max) return;
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
        // Preserve sample-based domains for smooth curves until their extrema are supported.
        bezierCurveTo() {
            hasCurves = true;
        },
        quadraticCurveTo() {
            hasCurves = true;
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
    return hasCurves ? undefined : values;
}
