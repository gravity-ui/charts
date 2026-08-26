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
