import {evaluateCubicBezier} from '../bezier';

test('cubic endpoints remain exact across very different control magnitudes', () => {
    expect(evaluateCubicBezier(0, 0, 1e16, 11, 1)).toBe(11);
    expect(evaluateCubicBezier(11, 1e16, 0, 0, 0)).toBe(11);
    expect(evaluateCubicBezier(1e308, -1e308, 1e308, 11, 0)).toBe(1e308);
    expect(evaluateCubicBezier(1e308, -1e308, 1e308, 11, 1)).toBe(11);
});

test('constant contours and finite opposite controls stay finite', () => {
    for (const t of [0, 0.1, 0.5, 0.9, 1]) {
        expect(evaluateCubicBezier(100, 100, 100, 100, t)).toBe(100);
    }
    expect(Number.isFinite(evaluateCubicBezier(1e308, -1e308, 1e308, -1e308, 0.5))).toBe(true);
});
