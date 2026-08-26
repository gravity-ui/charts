import {scaleOrdinal} from 'd3-scale';

import {DEFAULT_PALETTE} from '~core/constants';
import type {PreparedLegend} from '~core/series/types';

import type {AreaSeries, LinearGradient} from '../../../types';
import {prepareAreaSeries} from '../prepare-area-series';

const gradient: LinearGradient = {
    type: 'linear-gradient',
    stops: [
        {offset: 0, color: '#fff'},
        {offset: 1, color: '#000'},
    ],
};

function prepareSeries(series: AreaSeries) {
    return prepareAreaSeries({
        colorScale: scaleOrdinal([] as string[], DEFAULT_PALETTE),
        legend: {} as PreparedLegend,
        colors: [],
        series: [series],
    })[0];
}

describe('prepareAreaSeries color', () => {
    test('uses a solid color for both line and fill by default', () => {
        const prepared = prepareSeries({
            type: 'area',
            name: 'Series 1',
            color: '#f00',
            data: [{x: 0, y: 1}],
        });

        expect(prepared).toEqual(
            expect.objectContaining({
                color: '#f00',
                fillColor: '#f00',
                gradient: undefined,
                fillGradient: undefined,
            }),
        );
    });

    test('uses color gradient for both line and fill by default', () => {
        const prepared = prepareSeries({
            type: 'area',
            name: 'Series 1',
            color: gradient,
            data: [{x: 0, y: 1}],
        });

        expect(prepared.gradient).toBe(gradient);
        expect(prepared.fillGradient).toBe(gradient);
        expect(prepared.color).toBe('rgb(128, 128, 128)');
        expect(prepared.fillColor).toBe('rgb(128, 128, 128)');
        expect(prepared.legend.color).toBe('rgb(128, 128, 128)');
    });

    test('allows the fill color to override the line color independently', () => {
        const prepared = prepareSeries({
            type: 'area',
            name: 'Series 1',
            color: '#f00',
            fillColor: gradient,
            data: [{x: 0, y: 1}],
        });

        expect(prepared.color).toBe('#f00');
        expect(prepared.gradient).toBeUndefined();
        expect(prepared.fillGradient).toBe(gradient);
        expect(prepared.legend.color).toBe('rgb(128, 128, 128)');
    });

    test('allows a solid fill to override a gradient line independently', () => {
        const prepared = prepareSeries({
            type: 'area',
            name: 'Series 1',
            color: gradient,
            fillColor: '#0f0',
            data: [{x: 0, y: 1}],
        });

        expect(prepared.gradient).toBe(gradient);
        expect(prepared.fillColor).toBe('#0f0');
        expect(prepared.fillGradient).toBeUndefined();
        expect(prepared.legend.color).toBe('#0f0');
    });
});
