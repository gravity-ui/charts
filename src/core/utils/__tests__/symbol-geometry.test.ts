import {getDistanceToSymbol} from '../symbol-geometry';

const center: [number, number] = [100, 100];

test('measures the marker path radius and centered stroke together', () => {
    expect(
        getDistanceToSymbol({
            point: [115, 100],
            center,
            symbolType: 'circle',
            radius: 14,
            strokeWidth: 4,
        }),
    ).toBe(0);
    expect(
        getDistanceToSymbol({
            point: [117, 100],
            center,
            symbolType: 'circle',
            radius: 14,
            strokeWidth: 4,
        }),
    ).toBe(1);
});

test('does not treat a square bounding circle as painted geometry', () => {
    const distance = getDistanceToSymbol({
        point: [111, 100],
        center,
        symbolType: 'square',
        radius: 10,
        strokeWidth: 0,
    });
    expect(distance).toBeCloseTo(11 - Math.sqrt(Math.PI) * 5);
});

test.each(['triangle', 'triangle-down'] as const)(
    'keeps %s stroke at its pointed vertex',
    (symbolType) => {
        const direction = symbolType === 'triangle' ? -1 : 1;
        const tip = Math.sqrt(Math.PI * 100) * 0.6824;
        expect(
            getDistanceToSymbol({
                point: [100, 100 + direction * (tip + 1.5)],
                center,
                symbolType,
                radius: 10,
                strokeWidth: 2,
            }),
        ).toBe(0);
        expect(
            getDistanceToSymbol({
                point: [100, 100 + direction * (tip + 3)],
                center,
                symbolType,
                radius: 10,
                strokeWidth: 2,
            }),
        ).toBeCloseTo(1);
    },
);

test('keeps diamond corner cutouts outside its contour', () => {
    expect(
        getDistanceToSymbol({
            point: [108, 108],
            center,
            symbolType: 'diamond',
            radius: 10,
            strokeWidth: 0,
        }),
    ).toBeGreaterThan(3);
});
