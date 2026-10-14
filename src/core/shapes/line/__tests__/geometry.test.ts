import {curveMonotoneX} from 'd3-shape';

import {createLineGeometryGetter, getDistanceToLineStroke} from '../geometry';

const horizontal = createLineGeometryGetter({
    points: [
        {x: 100, y: 0},
        {x: 200, y: 0},
    ],
    lineWidth: 20,
})();

const style = {lineWidth: 20, linecap: 'butt', linejoin: 'round', dashStyle: 'Solid'} as const;

test.each([
    ['butt', 5],
    ['round', 0],
    ['square', 0],
] as const)('stroke uses the %s cap at the endpoint', (linecap, distance) => {
    expect(getDistanceToLineStroke(horizontal, [205, 0], {...style, linecap})).toBe(distance);
});

test('dash gaps are outside the stroke', () => {
    const geometry = createLineGeometryGetter({
        points: [
            {x: 0, y: 0},
            {x: 100, y: 0},
        ],
        lineWidth: 2,
    })();
    const dashed = {...style, lineWidth: 2, dashStyle: 'ShortDash'} as const;
    expect(getDistanceToLineStroke(geometry, [5, 0], dashed)).toBe(0);
    expect(getDistanceToLineStroke(geometry, [7, 0], dashed)).toBe(1);
});

test('miter, bevel and round joins follow their painted corners', () => {
    const geometry = createLineGeometryGetter({
        points: [
            {x: 0, y: 0},
            {x: 100, y: 0},
            {x: 100, y: 100},
        ],
        lineWidth: 20,
    })();
    expect(getDistanceToLineStroke(geometry, [109, -9], {...style, linejoin: 'miter'})).toBe(0);
    expect(getDistanceToLineStroke(geometry, [109, -9], {...style, linejoin: 'round'})).toBeCloseTo(
        Math.hypot(9, 9) - 10,
    );
    expect(getDistanceToLineStroke(geometry, [109, -9], {...style, linejoin: 'bevel'})).toBeCloseTo(
        Math.hypot(4, 4),
    );
});

test('a null point breaks the stroke without an invisible connecting segment', () => {
    const geometry = createLineGeometryGetter({
        points: [
            {x: 0, y: 0},
            {x: 20, y: 0},
            {x: 30, y: null},
            {x: 40, y: 0},
            {x: 60, y: 0},
        ],
        lineWidth: 2,
    })();
    expect(getDistanceToLineStroke(geometry, [30, 0], {...style, lineWidth: 2})).toBe(10);
});

test('large monotone geometry is lazy, cached and free of argument spreading limits', () => {
    const points = Array.from({length: 30000}, (_, x) => ({x, y: x % 10}));
    const factory = jest.fn(curveMonotoneX);
    const getGeometry = createLineGeometryGetter({points, lineWidth: 1, curveFactory: factory});
    expect(factory).not.toHaveBeenCalled();
    const geometry = getGeometry();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(geometry.segments).toHaveLength((points.length - 1) * 8);
    expect(getGeometry()).toBe(geometry);
    expect(factory).toHaveBeenCalledTimes(1);
});
