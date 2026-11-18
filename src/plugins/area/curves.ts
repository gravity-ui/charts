import {line} from 'd3-shape';

import {evaluateCubicBezier} from '~core/utils/bezier';

import type {SeriesInterpolation} from '../../types';
import {getCurveFactory} from '../interpolation';

export interface CurvePoint {
    x: number;
    y: number | null;
}

interface Coordinate {
    x: number;
    y: number;
}

export interface CurveSection {
    from: Coordinate;
    to: Coordinate;
    first: Coordinate;
    second: Coordinate;
}

export function intervalKey(from: number, to: number) {
    return `${from}:${to}`;
}

export function evaluateSection(section: CurveSection, t: number): Coordinate {
    const {from, first, second, to} = section;
    return {
        x: evaluateCubicBezier(from.x, first.x, second.x, to.x, t),
        y: evaluateCubicBezier(from.y, first.y, second.y, to.y, t),
    };
}

function normalizedX(section: CurveSection, t: number) {
    const width = section.to.x - section.from.x;
    return evaluateCubicBezier(
        0,
        (section.first.x - section.from.x) / width,
        (section.second.x - section.from.x) / width,
        1,
        t,
    );
}

/** Invert X in local coordinates, retaining precision even on a deeply zoomed interval. */
export function getParameterAtX(section: CurveSection, fraction: number) {
    if (fraction <= 0) return 0;
    if (fraction >= 1) return 1;
    const width = section.to.x - section.from.x;
    const first = (section.first.x - section.from.x) / width;
    const second = (section.second.x - section.from.x) / width;
    if (
        Math.abs(first - 1 / 3) <= Number.EPSILON * 4 &&
        Math.abs(second - 2 / 3) <= Number.EPSILON * 4
    )
        return fraction;
    let low = 0;
    let high = 1;
    // Stop at representable precision rather than a fixed relative error that
    // becomes hundreds of pixels when offscreen coordinates are large.
    while (true) {
        const middle = low + (high - low) / 2;
        if (middle === low || middle === high) {
            return Math.abs(normalizedX(section, low) - fraction) <
                Math.abs(normalizedX(section, high) - fraction)
                ? low
                : high;
        }
        const x = normalizedX(section, middle);
        if (x === fraction) return middle;
        if (x < fraction) low = middle;
        else high = middle;
    }
}

export function evaluateAtX(section: CurveSection, fraction: number) {
    const t = getParameterAtX(section, fraction);
    return evaluateCubicBezier(section.from.y, section.first.y, section.second.y, section.to.y, t);
}

/** Critical parameters of the scalar Y polynomial, normalized to avoid overflow. */
export function getCriticalParameters(section: CurveSection) {
    const scale = Math.max(
        Math.abs(section.from.y),
        Math.abs(section.first.y),
        Math.abs(section.second.y),
        Math.abs(section.to.y),
    );
    if (!scale) return [];
    const start = section.from.y / scale;
    const first = section.first.y / scale;
    const second = section.second.y / scale;
    const end = section.to.y / scale;
    const a = -start + 3 * first - 3 * second + end;
    const b = 2 * (start - 2 * first + second);
    const c = first - start;
    const critical: number[] = [];
    if (a === 0) {
        if (b !== 0) critical.push(-c / b);
    } else {
        const discriminant = b * b - 4 * a * c;
        if (discriminant >= 0) {
            const q = -0.5 * (b + (b >= 0 ? 1 : -1) * Math.sqrt(discriminant));
            if (q === 0) critical.push(-b / (2 * a));
            else critical.push(q / a, c / q);
        }
    }
    return [...new Set(critical.filter((t) => t > 0 && t < 1))].sort((x, y) => x - y);
}

/** Parameters where the scalar curve crosses zero, including stationary crossings. */
export function getZeroParameters(section: CurveSection) {
    const cuts = [0, ...getCriticalParameters(section), 1];
    const roots = new Set<number>();
    const value = (t: number) =>
        evaluateCubicBezier(section.from.y, section.first.y, section.second.y, section.to.y, t);
    for (const t of cuts) if (t > 0 && t < 1 && value(t) === 0) roots.add(t);
    for (let i = 1; i < cuts.length; i++) {
        let low = cuts[i - 1];
        let high = cuts[i];
        const sign = Math.sign(value(low));
        if (sign === 0 || Math.sign(value(high)) === sign || value(high) === 0) continue;
        while (true) {
            const middle = low + (high - low) / 2;
            if (middle === low || middle === high) {
                roots.add(Math.abs(value(low)) < Math.abs(value(high)) ? low : high);
                break;
            }
            const at = value(middle);
            if (at === 0) {
                roots.add(middle);
                break;
            }
            if (Math.sign(at) === sign) low = middle;
            else high = middle;
        }
    }
    return [...roots].sort((a, b) => a - b);
}

export function getZeroFractions(section: CurveSection) {
    return getZeroParameters(section).map((t) => normalizedX(section, t));
}

export function collectSections(
    points: CurvePoint[],
    interpolation: SeriesInterpolation,
    constrainX = false,
) {
    const sections = new Map<string, CurveSection>();
    let previous: Coordinate = {x: 0, y: 0};
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
                    // Cardinal tangents can reverse X on uneven grids. A stack needs
                    // a single ordered cross-section at each X to keep its layers disjoint.
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
        // Duplicate X values encode a jump at a gap boundary. Neither tangent
        // may borrow observations from the other side of that discontinuity.
        if (point.y === null || run[run.length - 1]?.x === point.x) flush();
        if (point.y !== null) run.push(point);
    }
    flush();
    return sections;
}
