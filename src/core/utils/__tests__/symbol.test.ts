import {getDistanceToSymbol, getSymbolBounds, getSymbolSize} from '../symbol';

const radius = 10;
const center: [number, number] = [100, 100];
const diameter = (symbolType: 'circle' | 'square' | 'diamond' | 'triangle' | 'triangle-down') =>
    getSymbolSize({symbolType, symbolSize: Math.PI * radius ** 2});

describe('getDistanceToSymbol', () => {
    test('circle', () => {
        const args = {center, symbolType: 'circle' as const, radius, strokeWidth: 4};
        expect(getDistanceToSymbol({...args, point: [112, 100]})).toBe(0);
        expect(getDistanceToSymbol({...args, point: [115, 100]})).toBeCloseTo(3);
    });

    test('square', () => {
        const half = diameter('square').width / 2;
        const args = {center, symbolType: 'square' as const, radius, strokeWidth: 0};
        expect(getDistanceToSymbol({...args, point: [100 + half - 0.1, 100 + half - 0.1]})).toBe(0);
        expect(getDistanceToSymbol({...args, point: [100 + half + 2, 100]})).toBeCloseTo(2);
    });

    test('diamond', () => {
        const half = diameter('diamond').width / 2;
        const args = {center, symbolType: 'diamond' as const, radius, strokeWidth: 0};
        expect(getDistanceToSymbol({...args, point: [100, 100 - half + 0.1]})).toBe(0);
        // The corner of the bounding box lies outside the diamond.
        expect(getDistanceToSymbol({...args, point: [100 + half, 100 - half]})).toBeCloseTo(
            half / Math.SQRT2,
        );
    });

    test.each([
        ['triangle', -1],
        ['triangle-down', 1],
    ] as const)('%s', (symbolType, direction) => {
        const {height} = diameter(symbolType);
        const apex = height / 2;
        const args = {center, symbolType, radius, strokeWidth: 0};
        expect(getDistanceToSymbol({...args, point: [100, 100 + direction * (apex - 0.1)]})).toBe(
            0,
        );
        expect(getDistanceToSymbol({...args, point: [100, 100 - direction * apex]})).toBeCloseTo(
            apex / 2,
        );
    });

    test('offsets the contour by half of the stroke width with mitered corners', () => {
        const half = diameter('square').width / 2;
        const args = {center, symbolType: 'square' as const, radius, strokeWidth: 2};
        expect(getDistanceToSymbol({...args, point: [100 + half + 0.9, 100 + half + 0.9]})).toBe(0);
        expect(getDistanceToSymbol({...args, point: [100 + half + 3, 100]})).toBeCloseTo(2);
    });
});

describe('getSymbolBounds', () => {
    test.each(['circle', 'square', 'diamond', 'triangle', 'triangle-down'] as const)(
        '%s with zero radius and no border has zero extents',
        (symbolType) => {
            const bounds = getSymbolBounds({symbolType, radius: 0, strokeWidth: 0});
            for (const extent of Object.values(bounds)) expect(extent).toBeCloseTo(0);
        },
    );
});
