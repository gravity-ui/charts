import {validateData} from '~core/validation';

import {CHART_ERROR_CODE} from '../../libs';
import type {AreaSeries, BarXSeries, BarYSeries, ChartData, StackLabelsOptions} from '../../types';

describe.each(['bar-x', 'bar-y', 'area'] as const)('%s stack label validation', (type) => {
    function config(options: StackLabelsOptions = {}) {
        const series: (BarXSeries | BarYSeries | AreaSeries)[] = [10, 20].map((value) => ({
            type,
            name: String(value),
            stacking: 'normal',
            data: [{x: value, y: value}],
        }));
        const data: ChartData = {
            series: {data: series, options: {[type]: {stackLabels: {enabled: true, ...options}}}},
        };
        return {series, data};
    }

    test.each<StackLabelsOptions>([
        {style: {fontSize: '18px'}},
        {format: {type: 'number', precision: 2}},
        {padding: 10},
        {allowOverlap: true},
    ])('rejects conflicting effective options: %j', (override) => {
        const {series, data} = config();
        series[1].stackLabels = override;
        expect(() => validateData(data)).toThrow(
            expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
        );
    });

    test('compares inherited styles and explicit defaults by value', () => {
        const {series, data} = config({style: {fontSize: '18px', fontColor: 'red'}});
        series[1].stackLabels = {
            enabled: true,
            style: {fontColor: 'red', fontSize: '18px'},
            padding: 5,
            allowOverlap: false,
        };
        const original = JSON.stringify(data);
        expect(() => validateData(data)).not.toThrow();
        expect(JSON.stringify(data)).toBe(original);
    });

    test('validates series-only settings, including initially hidden series', () => {
        const {series, data} = config({enabled: false});
        series[0].stackLabels = {enabled: true, style: {fontColor: 'red'}};
        series[1].stackLabels = {enabled: true, style: {fontColor: 'blue'}};
        series[1].visible = false;
        expect(() => validateData(data)).toThrow(
            expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
        );
    });

    test('ignores non-participating and unstacked series', () => {
        const {series, data} = config();
        series[1].stackLabels = {enabled: false, style: {fontColor: 'red'}};
        expect(() => validateData(data)).not.toThrow();
        series[1].stackLabels.enabled = true;
        series[1].stacking = undefined;
        expect(() => validateData(data)).not.toThrow();
    });

    test('allows distinct settings in separate stacks', () => {
        const {series, data} = config();
        series[1].stackId = 'other';
        series[1].stackLabels = {style: {fontColor: 'red'}};
        expect(() => validateData(data)).not.toThrow();
    });

    test('compares custom formatters by identity', () => {
        const format: StackLabelsOptions['format'] = {
            type: 'custom',
            formatter: ({value}) => String(value),
        };
        const {series, data} = config({format});
        series[1].stackLabels = {format: {...format}};
        expect(() => validateData(data)).not.toThrow();
        series[1].stackLabels.format = {type: 'custom', formatter: () => 'other'};
        expect(() => validateData(data)).toThrow(
            expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
        );
    });
});

test.each(['bar-x', 'area'] as const)(
    '%s allows different total styles on different value axes',
    (type) => {
        const data: ChartData = {
            yAxis: [{position: 'left'}, {position: 'right'}],
            series: {
                data: [0, 1].map((yAxis) => ({
                    type,
                    name: String(yAxis),
                    yAxis,
                    stacking: 'normal',
                    stackLabels: {enabled: true, style: {fontSize: `${12 + yAxis}px`}},
                    data: [{x: 0, y: 10}],
                })),
            },
        };
        expect(() => validateData(data)).not.toThrow();
    },
);
