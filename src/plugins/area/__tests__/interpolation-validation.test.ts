import {CHART_ERROR_CODE} from '../../../libs';
import type {AreaSeries, SeriesInterpolation} from '../../../types';
import {validateAreaInterpolation} from '../validation';

function area(interpolation?: SeriesInterpolation): AreaSeries {
    return {type: 'area', name: 'Area', data: [], stacking: 'normal', interpolation};
}

test.each([
    [undefined, {type: 'linear'}],
    [{type: 'cardinal'}, {type: 'cardinal', tension: 0}],
    [{type: 'step'}, {type: 'step', position: 'after'}],
] as [SeriesInterpolation | undefined, SeriesInterpolation][])(
    'accepts equivalent resolved settings: %p and %p',
    (first, second) => {
        const series = [area(first), area(second)];
        expect(() => validateAreaInterpolation(series[0], series)).not.toThrow();
    },
);

test.each([
    [{type: 'linear'}, {type: 'monotone'}],
    [{type: 'cardinal'}, {type: 'cardinal', tension: 0.5}],
    [{type: 'step'}, {type: 'step', position: 'middle'}],
] as [SeriesInterpolation, SeriesInterpolation][])(
    'rejects conflicting stack settings, including hidden series: %p and %p',
    (first, second) => {
        const series = [area(first), {...area(second), visible: false}];
        expect(() => validateAreaInterpolation(series[0], series)).toThrow(
            expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
        );
    },
);

test('allows different interpolation in separate stacks, axes and unstacked areas', () => {
    const series = [
        {...area({type: 'step'}), stackId: 'first'},
        {...area({type: 'monotone'}), stackId: 'second'},
        {...area({type: 'cardinal'}), stackId: 'first', yAxis: 1},
        {...area({type: 'linear'}), stacking: undefined},
    ];
    for (const item of series) {
        expect(() => validateAreaInterpolation(item, series)).not.toThrow();
    }
});

test('area options are checked by the shared interpolation validator', () => {
    const series = area({type: 'cardinal', tension: NaN});
    expect(() => validateAreaInterpolation(series, [series])).toThrow(
        expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
    );
});
