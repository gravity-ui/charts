import type {LinearGradient} from '../../types';
import {
    getBrighterGradient,
    getGradientColorAtPoint,
    getGradientMidColor,
    gradientAngleToCoords,
    isLinearGradient,
} from '../gradient';

const BBOX = {xMin: 0, xMax: 100, yMin: 0, yMax: 50};

describe('gradientAngleToCoords', () => {
    test.each([
        [0, {x1: 50, y1: 50, x2: 50, y2: 0}],
        [270, {x1: 100, y1: 25, x2: 0, y2: 25}],
    ])('converts the CSS angle %d to SVG coordinates', (angle, expected) => {
        const actual = gradientAngleToCoords(angle, BBOX);

        expect(actual.x1).toBeCloseTo(expected.x1);
        expect(actual.y1).toBeCloseTo(expected.y1);
        expect(actual.x2).toBeCloseTo(expected.x2);
        expect(actual.y2).toBeCloseTo(expected.y2);
    });
});

describe('gradient color helpers', () => {
    const gradient: LinearGradient = {
        type: 'linear-gradient',
        angle: 90,
        stops: [
            {offset: 0, color: '#ff0000'},
            {offset: 1, color: '#0000ff'},
        ],
    };

    test('clamps colors outside the gradient line', () => {
        expect(getGradientColorAtPoint(-10, 25, gradient, BBOX)).toBe('#ff0000');
        expect(getGradientColorAtPoint(110, 25, gradient, BBOX)).toBe('#0000ff');
    });

    test.each([0, 360])(
        'uses the last stop for a horizontal bbox with the equivalent angle %d',
        (angle) => {
            expect(
                getGradientColorAtPoint(
                    50,
                    25,
                    {...gradient, angle},
                    {xMin: 0, xMax: 100, yMin: 25, yMax: 25},
                ),
            ).toBe('#0000ff');
        },
    );

    test('uses the last stop at a repeated offset', () => {
        expect(
            getGradientMidColor({
                type: 'linear-gradient',
                stops: [
                    {offset: 0, color: 'white'},
                    {offset: 0.5, color: 'red'},
                    {offset: 0.5, color: 'blue'},
                    {offset: 1, color: 'black'},
                ],
            }),
        ).toBe('blue');
    });

    test('uses stop offsets when calculating the representative middle color', () => {
        expect(
            getGradientMidColor({
                type: 'linear-gradient',
                stops: [
                    {offset: 0, color: '#ff0000'},
                    {offset: 0.25, color: '#0000ff'},
                    {offset: 1, color: '#ffffff'},
                ],
            }),
        ).toBe('rgb(85, 85, 255)');
    });

    test('brightens every valid stop without mutating the source gradient', () => {
        const source: LinearGradient = {
            type: 'linear-gradient',
            stops: [
                {offset: 0, color: '#400000'},
                {offset: 1, color: 'invalid-color'},
            ],
        };

        expect(getBrighterGradient(source, 1).stops).toEqual([
            {offset: 0, color: 'rgb(91, 0, 0)'},
            {offset: 1, color: 'invalid-color'},
        ]);
        expect(source.stops[0].color).toBe('#400000');
    });

    test.each([null, [], {}, {type: 'radial-gradient'}])(
        'does not identify malformed value %j as a linear gradient',
        (value) => {
            expect(isLinearGradient(value)).toBe(false);
        },
    );
});
