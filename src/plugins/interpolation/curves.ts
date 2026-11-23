import {evaluateCubicBezier} from '~core/utils/bezier';

export interface CurvePoint {
    x: number;
    y: number | null;
}

export interface CurveCoordinate extends CurvePoint {
    y: number;
}

export interface CurveSection {
    from: CurveCoordinate;
    to: CurveCoordinate;
    first: CurveCoordinate;
    second: CurveCoordinate;
}

export function evaluateSection(section: CurveSection, t: number): CurveCoordinate {
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

/** Invert monotone X in local coordinates, retaining precision during deep zoom. */
export function getParameterAtX(section: CurveSection, fraction: number) {
    if (fraction <= 0) {
        return 0;
    }
    if (fraction >= 1) {
        return 1;
    }
    const width = section.to.x - section.from.x;
    const first = (section.first.x - section.from.x) / width;
    const second = (section.second.x - section.from.x) / width;
    if (
        Math.abs(first - 1 / 3) <= Number.EPSILON * 4 &&
        Math.abs(second - 2 / 3) <= Number.EPSILON * 4
    ) {
        return fraction;
    }
    let low = 0;
    let high = 1;
    let parameter = fraction;
    const value = (t: number) => evaluateCubicBezier(0, first, second, 1, t);
    // Safeguarded Newton steps converge quickly while the bracket retains full
    // floating-point precision near endpoints during deep zoom.
    while (true) {
        const x = value(parameter);
        if (x === fraction) {
            return parameter;
        }
        if (x < fraction) {
            low = parameter;
        } else {
            high = parameter;
        }
        const derivative =
            3 *
            ((1 - parameter) ** 2 * first +
                2 * (1 - parameter) * parameter * (second - first) +
                parameter ** 2 * (1 - second));
        const next = parameter - (x - fraction) / derivative;
        parameter = next > low && next < high ? next : low + (high - low) / 2;
        if (parameter === low || parameter === high) {
            return Math.abs(value(low) - fraction) < Math.abs(value(high) - fraction) ? low : high;
        }
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
    if (!scale) {
        return [];
    }
    const start = section.from.y / scale;
    const first = section.first.y / scale;
    const second = section.second.y / scale;
    const end = section.to.y / scale;
    const a = -start + 3 * first - 3 * second + end;
    const b = 2 * (start - 2 * first + second);
    const c = first - start;
    const critical: number[] = [];
    if (a === 0) {
        if (b !== 0) {
            critical.push(-c / b);
        }
    } else {
        const discriminant = b * b - 4 * a * c;
        if (discriminant >= 0) {
            const q = -0.5 * (b + (b >= 0 ? 1 : -1) * Math.sqrt(discriminant));
            if (q === 0) {
                critical.push(-b / (2 * a));
            } else {
                critical.push(q / a, c / q);
            }
        }
    }
    return [...new Set(critical.filter((t) => t > 0 && t < 1))].sort((x, y) => x - y);
}

/** Endpoints and analytic Y extrema of the parts inside an X window. */
export function getSectionYValues(section: CurveSection, range?: readonly [number, number]) {
    const critical = getCriticalParameters(section);
    const parameters = new Set<number>();
    const cuts = new Set([0, 1]);
    const inside = (x: number) => !range || (x >= range[0] && x <= range[1]);
    if (inside(section.from.x)) {
        parameters.add(0);
    }
    if (inside(section.to.x)) {
        parameters.add(1);
    }
    if (range) {
        const xs = [section.from.x, section.first.x, section.second.x, section.to.x];
        if (Math.max(...xs) < range[0] || Math.min(...xs) > range[1]) {
            return [];
        }
        for (const boundary of range) {
            for (const t of getZeroParameters({
                from: {x: 0, y: section.from.x - boundary},
                first: {x: 0, y: section.first.x - boundary},
                second: {x: 0, y: section.second.x - boundary},
                to: {x: 0, y: section.to.x - boundary},
            })) {
                cuts.add(t);
                parameters.add(t);
            }
        }
    }
    const ordered = [...cuts].sort((a, b) => a - b);
    for (let i = 1; i < ordered.length; i++) {
        const start = ordered[i - 1];
        const end = ordered[i];
        if (!inside(evaluateSection(section, (start + end) / 2).x)) {
            continue;
        }
        parameters.add(start);
        parameters.add(end);
        for (const t of critical) {
            if (t > start && t < end) {
                parameters.add(t);
            }
        }
    }
    return [...parameters].map((t) => evaluateSection(section, t).y);
}

/** Parameters where the scalar curve crosses zero, including stationary crossings. */
export function getZeroParameters(section: CurveSection) {
    const cuts = [0, ...getCriticalParameters(section), 1];
    const roots = new Set<number>();
    const value = (t: number) =>
        evaluateCubicBezier(section.from.y, section.first.y, section.second.y, section.to.y, t);
    for (const t of cuts) {
        if (t > 0 && t < 1 && value(t) === 0) {
            roots.add(t);
        }
    }
    for (let i = 1; i < cuts.length; i++) {
        let low = cuts[i - 1];
        let high = cuts[i];
        const sign = Math.sign(value(low));
        if (sign === 0 || Math.sign(value(high)) === sign || value(high) === 0) {
            continue;
        }
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
            if (Math.sign(at) === sign) {
                low = middle;
            } else {
                high = middle;
            }
        }
    }
    return [...roots].sort((a, b) => a - b);
}

export function getZeroFractions(section: CurveSection) {
    return getZeroParameters(section).map((t) => normalizedX(section, t));
}
