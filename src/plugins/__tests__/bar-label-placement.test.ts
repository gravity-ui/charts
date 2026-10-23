import {scaleOrdinal} from 'd3-scale';

import type {PreparedLegend} from '~core/series/types';
import {validateData} from '~core/validation';

import {CHART_ERROR_CODE} from '../../libs';
import type {
    BarSeriesDataLabelPlacementOptions,
    BarSeriesDataLabelPlacementPosition,
    ChartData,
} from '../../types';
import {resolveBarLabelPlacement, validateBarLabelPlacement} from '../bar-label-placement';
import {barYPlugin} from '../bar-y';
import {prepareBarYSeries} from '../bar-y/prepare-bar-y-series';

describe('bar placement options', () => {
    test('percent bar-y series request no axis reserve with outside-only placement', async () => {
        const [series] = await prepareBarYSeries({
            series: [
                {
                    type: 'bar-y',
                    name: 'Orders',
                    stacking: 'percent',
                    data: [{x: 20, y: 'A'}],
                    dataLabels: {enabled: true, placement: ['outside'], padding: 7},
                },
            ],
            colorScale: scaleOrdinal<string, string>().range(['#000']),
            colors: [],
            legend: {enabled: false} as PreparedLegend,
        });

        expect(barYPlugin.getXAxisPadding?.(series)).toBe(0);
    });

    test('expands auto while preserving explicit candidate order and omitted placement', () => {
        const positions: BarSeriesDataLabelPlacementPosition[] = ['inside-end', 'outside'];
        expect(resolveBarLabelPlacement('auto')).toEqual(['outside', 'inside-end']);
        expect(resolveBarLabelPlacement(positions)).toEqual(['inside-end', 'outside']);
        expect(resolveBarLabelPlacement(undefined)).toBeUndefined();
    });

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
