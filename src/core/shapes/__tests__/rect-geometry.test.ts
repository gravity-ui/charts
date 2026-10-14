import {getBarXRect} from '../bar-x/utils';
import {getBarYOuterRect} from '../bar-y/utils';
import {getDistanceToRoundedRect} from '../rect-geometry';

test('bar-x rounded corners leave visible background outside the fill', () => {
    const rect = getBarXRect({
        x: 125,
        y: 150,
        width: 50,
        height: 150,
        valueEndPadding: 0,
        extendsUp: true,
        isStackEnd: true,
        series: {borderRadius: 20},
    });
    expect(getDistanceToRoundedRect({...rect, point: [126, 151]})).toBeGreaterThan(6);
    expect(getDistanceToRoundedRect({...rect, point: [150, 151]})).toBe(0);
});

test.each([true, false])(
    'bar-x value-end padding belongs to the contour (extendsUp=%s)',
    (extendsUp) => {
        const rect = getBarXRect({
            x: 125,
            y: 155,
            width: 50,
            height: 100,
            valueEndPadding: 0.5,
            extendsUp,
            isStackEnd: true,
            series: {borderRadius: 0},
        });
        const point: [number, number] = [150, extendsUp ? 154.75 : 255.25];
        expect(getDistanceToRoundedRect({...rect, point})).toBe(0);
    },
);

test('bar-y measures its rounded border outer contour', () => {
    const rect = getBarYOuterRect({
        x: 0,
        y: 125,
        width: 150,
        height: 50,
        isLastStackItem: true,
        borderWidth: 4,
        series: {borderRadius: 20},
    });
    expect(getDistanceToRoundedRect({...rect, point: [149, 126]})).toBeGreaterThan(4);
    expect(getDistanceToRoundedRect({...rect, point: [151, 150]})).toBe(0);
    expect(getDistanceToRoundedRect({...rect, point: [153, 150]})).toBe(1);
});

test('thin bar-y follows the rendered nonzero fill when rounded ends overlap', () => {
    const rect = getBarYOuterRect({
        x: 0,
        y: 0,
        width: 100,
        height: 10,
        isLastStackItem: true,
        borderWidth: 0,
        series: {borderRadius: 20},
    });
    expect(getDistanceToRoundedRect({...rect, point: [99, 5]})).toBe(0);
    expect(getDistanceToRoundedRect({...rect, point: [99, 1]})).toBeCloseTo(10 - Math.hypot(9, 1));
});

test.each([
    {width: 0, height: 50},
    {width: 50, height: 0},
    {width: 0, height: 0},
])('an unpainted $width by $height rectangle has no hit distance', ({width, height}) => {
    expect(
        getDistanceToRoundedRect({
            x: 100,
            y: 100,
            width,
            height,
            borderRadius: [0, 0, 0, 0],
            point: [100, 100],
        }),
    ).toBe(Infinity);
});

test('a bar-y border remains painted when its source width is zero', () => {
    const rect = getBarYOuterRect({
        x: 100,
        y: 100,
        width: 0,
        height: 50,
        isLastStackItem: true,
        borderWidth: 4,
        series: {borderRadius: 20},
    });
    expect(getDistanceToRoundedRect({...rect, point: [100, 125]})).toBe(0);
});
