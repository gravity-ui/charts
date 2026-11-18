import {line} from 'd3-shape';

import type {SeriesInterpolation} from '../../types';
import {getCurveFactory} from '../interpolation';
import type {CurveCoordinate, CurvePoint, CurveSection} from '../interpolation/curves';

export function intervalKey(from: number, to: number) {
    return `${from}:${to}`;
}

export function collectSections(
    points: CurvePoint[],
    interpolation: SeriesInterpolation,
    constrainX = false,
) {
    const sections = new Map<string, CurveSection>();
    let previous: CurveCoordinate = {x: 0, y: 0};
    const context = {
        moveTo(x: number, y: number) {
            previous = {x, y};
        },
        lineTo(x: number, y: number) {
            this.bezierCurveTo(
                previous.x + (x - previous.x) / 3,
                previous.y + (y - previous.y) / 3,
                previous.x + (2 * (x - previous.x)) / 3,
                previous.y + (2 * (y - previous.y)) / 3,
                x,
                y,
            );
        },
        bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
            if (previous.x !== x) {
                if (constrainX) {
                    // Keep stacked cardinal sections ordered in X.
                    x1 = Math.max(previous.x, Math.min(x, x1));
                    x2 = Math.max(x1, Math.min(x, x2));
                }
                sections.set(intervalKey(previous.x, x), {
                    from: previous,
                    to: {x, y},
                    first: {x: x1, y: y1},
                    second: {x: x2, y: y2},
                });
            }
            previous = {x, y};
        },
        closePath() {},
    };
    const generator = line<CurvePoint>()
        .x((point) => point.x)
        .y((point) => point.y as number)
        .curve(getCurveFactory(interpolation.type === 'step' ? {type: 'linear'} : interpolation))
        .context(context as unknown as CanvasRenderingContext2D);
    let run: CurvePoint[] = [];
    const flush = () => {
        if (run.length) generator(run);
        run = [];
    };
    for (const point of points) {
        // Duplicate X marks a gap boundary; tangents must not cross it.
        if (point.y === null || run[run.length - 1]?.x === point.x) flush();
        if (point.y !== null) run.push(point);
    }
    flush();
    return sections;
}
