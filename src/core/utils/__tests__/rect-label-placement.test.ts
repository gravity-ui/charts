import {placeRectLabel} from '../rect-label-placement';
import type {RectLabelPosition} from '../rect-label-placement';

describe('rectangle label placement', () => {
    const defaults = {
        anchor: {x: 0, y: 20, width: 180, height: 40},
        bounds: {x: 0, y: 0, width: 200, height: 100},
        size: {width: 40, height: 10},
        padding: 5,
        positions: ['outside', 'inside-end'] as RectLabelPosition[],
    };

    test('switches at the outside fit boundary and keeps labels outside short rectangles', () => {
        const args = {...defaults, axis: 'x' as const, endAtMax: true};
        expect(placeRectLabel({...args, anchor: {...defaults.anchor, width: 155}})).toEqual({
            x: 160,
            y: 35,
        });
        expect(placeRectLabel({...args, anchor: {...defaults.anchor, width: 156}})).toEqual({
            x: 111,
            y: 35,
        });
        expect(placeRectLabel({...args, anchor: {...defaults.anchor, width: 10}})).toEqual({
            x: 15,
            y: 35,
        });
    });

    test('uses the visible rectangle in either orientation', () => {
        expect(
            placeRectLabel({
                ...defaults,
                axis: 'x',
                endAtMax: true,
                anchor: {...defaults.anchor, width: 230},
            }),
        ).toEqual({x: 155, y: 35});
        expect(
            placeRectLabel({
                ...defaults,
                axis: 'y',
                endAtMax: false,
                anchor: {x: 20, y: 30, width: 40, height: 180},
                bounds: {x: 10, y: 50, width: 100, height: 100},
                size: {width: 10, height: 40},
            }),
        ).toEqual({x: 35, y: 55});
    });

    test('hides or clamps the first candidate when neither position fits', () => {
        const args = {...defaults, axis: 'x' as const, endAtMax: true};
        for (const width of [0, 30]) {
            const bounds = {...defaults.bounds, width};
            expect(placeRectLabel({...args, bounds, fallback: 'hide'})).toBeUndefined();
            expect(placeRectLabel({...args, bounds})).toEqual({x: 0, y: 35});
        }
        expect(
            placeRectLabel({...args, anchor: {...defaults.anchor, width: -10}, fallback: 'hide'}),
        ).toBeUndefined();
    });

    test('respects candidate order, center alignment, and both end paddings', () => {
        const args = {...defaults, axis: 'x' as const, endAtMax: true};
        expect(
            placeRectLabel({
                ...args,
                positions: ['inside-end', 'outside'],
                anchor: {...defaults.anchor, width: 100},
            }),
        ).toEqual({x: 55, y: 35});
        expect(
            placeRectLabel({
                ...args,
                positions: ['inside-center'],
                anchor: {...defaults.anchor, x: -100, width: 280},
            }),
        ).toEqual({x: 70, y: 35});
        expect(
            placeRectLabel({
                ...args,
                positions: ['inside-end', 'outside'],
                anchor: {...defaults.anchor, width: 49},
            }),
        ).toEqual({x: 54, y: 35});
        expect(
            placeRectLabel({
                ...args,
                positions: ['inside-end'],
                anchor: {...defaults.anchor, width: 50},
            }),
        ).toEqual({x: 5, y: 35});
        expect(
            placeRectLabel({
                ...args,
                positions: ['inside-center'],
                size: {width: 40, height: 50},
                fallback: 'hide',
            }),
        ).toBeUndefined();
        expect(placeRectLabel({...args, positions: ['outside'], fallback: 'hide'})).toBeUndefined();
        expect(placeRectLabel({...args, positions: ['outside']})).toEqual({x: 160, y: 35});
    });
});
