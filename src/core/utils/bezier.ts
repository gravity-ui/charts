function interpolateCoordinate(a: number, b: number, t: number) {
    const difference = b - a;
    if (!Number.isFinite(difference)) {
        return (1 - t) * a + t * b;
    }
    return t <= 0.5 ? a + difference * t : b - difference * (1 - t);
}

/**
 * Evaluate a cubic Bézier using de Casteljau interpolation. Equal control values
 * stay exactly equal, preserving constant contours such as a 100% stack boundary.
 */
export function evaluateCubicBezier(
    start: number,
    control1: number,
    control2: number,
    end: number,
    t: number,
) {
    if (t === 0) {
        return start;
    }
    if (t === 1) {
        return end;
    }
    const first = interpolateCoordinate(start, control1, t);
    const second = interpolateCoordinate(control1, control2, t);
    const third = interpolateCoordinate(control2, end, t);
    const left = interpolateCoordinate(first, second, t);
    const right = interpolateCoordinate(second, third, t);
    return interpolateCoordinate(left, right, t);
}
