import {scaleOrdinal} from 'd3';

import {DEFAULT_PALETTE} from '../../../constants';
import type {LineSeries} from '../../../types';
import {DEFAULT_MARKER, prepareLineSeries} from '../prepare-line';
import type {PreparedLegend} from '../types';

// TODO: fix tests
describe('prepareLineSeries', () => {
    describe('marker', () => {
        const commonArgs = {
            colorScale: scaleOrdinal([] as string[], DEFAULT_PALETTE),
            legend: {} as PreparedLegend,
        };

        it('If the marker parameters are not specified, the default values should be applied', () => {
            const preparedSeries = prepareLineSeries({
                ...commonArgs,
                series: [{}] as LineSeries[],
            });

            const actual = preparedSeries.map((s) => s.marker.states.normal);
            const expected = [DEFAULT_MARKER];

            expect(actual).toEqual(expected);
        });

        it('Normal state. The settings of a specific series should be prioritized over the seriesOptions', () => {
            const preparedSeries = prepareLineSeries({
                ...commonArgs,
                seriesOptions: {
                    line: {
                        marker: {
                            enabled: true,
                            radius: 100,
                            symbol: 'square',
                        },
                    },
                },
                series: [
                    {},
                    {
                        marker: {
                            radius: 200,
                            symbol: 'circle',
                        },
                    },
                    {marker: {enabled: false}},
                ] as LineSeries[],
            });

            const actual = preparedSeries.map((s) => s.marker.states.normal);
            const expected = [
                {enabled: true, radius: 100, symbol: 'square', borderColor: '', borderWidth: 0},
                {enabled: true, radius: 200, symbol: 'circle', borderColor: '', borderWidth: 0},
                {enabled: false, radius: 100, symbol: 'square', borderColor: '', borderWidth: 0},
            ];

            expect(actual).toEqual(expected);
        });
    });
});
