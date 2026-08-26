import {scaleOrdinal} from 'd3-scale';

import {DEFAULT_PALETTE} from '~core/constants';
import type {PreparedLegend} from '~core/series/types';

import type {LineSeries, LinearGradient} from '../../../types';
import {prepareLineSeries} from '../prepare-line-series';

const gradient: LinearGradient = {
    type: 'linear-gradient',
    stops: [
        {offset: 0, color: '#fff'},
        {offset: 1, color: '#000'},
    ],
};

describe('prepareLineSeries color', () => {
    test('prepares a gradient passed through color', () => {
        const series: LineSeries = {
            type: 'line',
            name: 'Series 1',
            color: gradient,
            data: [{x: 0, y: 1}],
        };
        const [prepared] = prepareLineSeries({
            colorScale: scaleOrdinal([] as string[], DEFAULT_PALETTE),
            legend: {} as PreparedLegend,
            colors: [],
            series: [series],
        });

        expect(prepared.gradient).toBe(gradient);
        expect(prepared.color).toBe('rgb(128, 128, 128)');
    });

    test('does not consume a palette color for an explicit gradient', () => {
        const prepared = prepareLineSeries({
            colorScale: scaleOrdinal([] as string[], DEFAULT_PALETTE),
            legend: {} as PreparedLegend,
            colors: [],
            series: [
                {
                    type: 'line',
                    name: 'Gradient',
                    color: gradient,
                    data: [{x: 0, y: 1}],
                },
                {
                    type: 'line',
                    name: 'Default',
                    data: [{x: 0, y: 2}],
                },
            ],
        });

        expect(prepared[1].color).toBe(DEFAULT_PALETTE[0]);
    });
});
