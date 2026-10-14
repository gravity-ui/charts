import {scaleOrdinal} from 'd3-scale';

import {DEFAULT_HALO_OPTIONS} from '../constants';
import {getSeriesPlugin} from '../seriesRegistry';
import type {PreparedLegendOptions} from '../types';

describe('marker halo defaults', () => {
    test.each(['line', 'area'] as const)(
        '%s overrides do not leak into another chart',
        async (type) => {
            const defaults = {...DEFAULT_HALO_OPTIONS};
            const args = {
                colorScale: scaleOrdinal<string, string>().range(['red']),
                colors: ['red'],
                legend: {enabled: false} as PreparedLegendOptions,
            };
            await getSeriesPlugin(type).prepareSeries({
                ...args,
                series: [{type, name: 'Customized', data: []}],
                seriesOptions: {
                    [type]: {states: {hover: {marker: {halo: {size: 20, opacity: 0.9}}}}},
                },
            });
            const [scatter] = await getSeriesPlugin('scatter').prepareSeries({
                ...args,
                series: [{type: 'scatter', name: 'Default', data: []}],
            });

            expect(DEFAULT_HALO_OPTIONS).toEqual(defaults);
            expect(scatter).toMatchObject({marker: {states: {hover: {halo: defaults}}}});
        },
    );
});
