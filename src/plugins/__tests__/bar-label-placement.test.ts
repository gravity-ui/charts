import {validateData} from '~core/validation';

import {CHART_ERROR_CODE} from '../../libs';
import type {BarSeriesDataLabelPlacementOptions, ChartData} from '../../types';
import {placeBarLabel, validateBarLabelPlacement} from '../bar-label-placement';

describe('bar label placement', () => {
    const defaults = {
        bar: {x: 0, y: 20, width: 180, height: 40},
        plot: {x: 0, y: 0, width: 200, height: 100},
        label: {width: 40, height: 10},
        padding: 5,
        placement: 'auto' as const,
    };

    test('switches at the outside fit boundary and keeps short bars outside', () => {
        const args = {...defaults, valueAxis: 'x' as const, endAtMax: true};
        expect(placeBarLabel({...args, bar: {...defaults.bar, width: 155}})).toEqual({
            x: 160,
            y: 35,
        });
        expect(placeBarLabel({...args, bar: {...defaults.bar, width: 156}})).toEqual({
            x: 111,
            y: 35,
        });
        expect(placeBarLabel({...args, bar: {...defaults.bar, width: 10}})).toEqual({x: 15, y: 35});
    });

    test('uses the current visible bar in either orientation', () => {
        expect(
            placeBarLabel({
                ...defaults,
                valueAxis: 'x',
                endAtMax: true,
                bar: {...defaults.bar, width: 230},
            }),
        ).toEqual({x: 155, y: 35});
        expect(
            placeBarLabel({
                ...defaults,
                valueAxis: 'y',
                endAtMax: false,
                bar: {x: 20, y: 30, width: 40, height: 180},
                plot: {x: 10, y: 50, width: 100, height: 100},
                label: {width: 10, height: 40},
            }),
        ).toEqual({x: 35, y: 55});
    });

    test('hides or clamps the first candidate when neither position fits', () => {
        const args = {...defaults, valueAxis: 'x' as const, endAtMax: true};
        for (const width of [0, 30]) {
            const plot = {...defaults.plot, width};
            expect(placeBarLabel({...args, plot, placementFallback: 'hide'})).toBeUndefined();
            expect(placeBarLabel({...args, plot})).toEqual({x: 0, y: 35});
        }
        expect(
            placeBarLabel({...args, bar: {...defaults.bar, width: -10}, placementFallback: 'hide'}),
        ).toBeUndefined();
    });

    test('respects order, centers the visible bar, and applies both end paddings', () => {
        const args = {...defaults, valueAxis: 'x' as const, endAtMax: true};
        expect(
            placeBarLabel({
                ...args,
                placement: ['inside-end', 'outside'],
                bar: {...defaults.bar, width: 100},
            }),
        ).toEqual({x: 55, y: 35});
        expect(
            placeBarLabel({
                ...args,
                placement: ['inside-center'],
                bar: {...defaults.bar, x: -100, width: 280},
            }),
        ).toEqual({x: 70, y: 35});
        expect(
            placeBarLabel({
                ...args,
                placement: ['inside-end', 'outside'],
                bar: {...defaults.bar, width: 49},
            }),
        ).toEqual({x: 54, y: 35});
        expect(
            placeBarLabel({...args, placement: ['inside-end'], bar: {...defaults.bar, width: 50}}),
        ).toEqual({x: 5, y: 35});
        expect(
            placeBarLabel({
                ...args,
                placement: ['inside-center'],
                label: {width: 40, height: 50},
                placementFallback: 'hide',
            }),
        ).toBeUndefined();
        expect(
            placeBarLabel({...args, placement: ['outside'], placementFallback: 'hide'}),
        ).toBeUndefined();
        expect(placeBarLabel({...args, placement: ['outside']})).toEqual({x: 160, y: 35});
    });
});

describe('bar placement validation', () => {
    test.each([
        undefined,
        {placement: 'auto'},
        {placement: ['outside', 'inside-end', 'inside-center'], placementFallback: 'hide'},
    ])('accepts %j', (options) => {
        expect(() =>
            validateBarLabelPlacement(options as BarSeriesDataLabelPlacementOptions),
        ).not.toThrow();
    });
    test.each([
        {placement: null},
        {placement: []},
        {placement: 'outside'},
        {placement: ['center']},
        {placement: ['outside', null]},
        {placement: Array(1)},
        {placementFallback: null},
        {placementFallback: 'auto'},
    ])('rejects %j', (options) => {
        expect(() =>
            validateBarLabelPlacement(options as BarSeriesDataLabelPlacementOptions),
        ).toThrow(expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}));
    });
    test.each(['bar-x', 'bar-y'] as const)('%s plugin validates placement', (type) => {
        const config: ChartData = {
            series: {
                data: [{type, name: 'Orders', data: [{x: 1, y: 2}], dataLabels: {placement: []}}],
            },
        };
        expect(() => validateData(config)).toThrow(
            expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
        );
    });
});
