import {scaleOrdinal} from 'd3-scale';

import type {PreparedLegend} from '~core/series/types';

import type {ChartSeriesOptions} from '../../../types';
import {prepareLineSeries, resolveLabelPlacement} from '../prepare-line-series';

describe('resolveLabelPlacement', () => {
    it('defaults to a single top position', () => {
        expect(resolveLabelPlacement(undefined)).toEqual(['top']);
    });

    it('keeps "auto" as is', () => {
        expect(resolveLabelPlacement('auto')).toBe('auto');
    });

    it('keeps an explicit array as is', () => {
        expect(resolveLabelPlacement(['bottom', 'left'])).toEqual(['bottom', 'left']);
    });

    it('falls back to the default position for an empty array', () => {
        expect(resolveLabelPlacement([])).toEqual(['top']);
    });
});

function createPreparedLineSeries(seriesOptions?: ChartSeriesOptions) {
    return prepareLineSeries({
        series: [{type: 'line', name: 'Series 1', data: [{x: 1, y: 10}]}],
        legend: {} as PreparedLegend,
        colorScale: scaleOrdinal([] as string[], ['blue']),
        colors: ['blue'],
        seriesOptions,
    });
}

describe('prepareLineSeries marker halo', () => {
    it('defaults halo.enabled to false for line series', () => {
        const prepared = createPreparedLineSeries();

        expect(prepared[0].marker.states.hover.halo).toEqual({
            enabled: false,
            opacity: 0.25,
            size: 6,
        });
    });

    it('preserves halo options when explicitly enabled', () => {
        const prepared = createPreparedLineSeries({
            line: {
                states: {
                    hover: {
                        marker: {
                            halo: {
                                enabled: true,
                            },
                        },
                    },
                },
            },
        });

        expect(prepared[0].marker.states.hover.halo).toEqual({
            enabled: true,
            opacity: 0.25,
            size: 6,
        });
    });

    it('respects explicit enabled: false', () => {
        const prepared = createPreparedLineSeries({
            line: {
                states: {
                    hover: {
                        marker: {
                            halo: {
                                enabled: false,
                                size: 10,
                            },
                        },
                    },
                },
            },
        });

        expect(prepared[0].marker.states.hover.halo).toEqual({
            enabled: false,
            opacity: 0.25,
            size: 10,
        });
    });

    it('preserves custom size and opacity, including zero opacity', () => {
        const prepared = createPreparedLineSeries({
            line: {
                states: {
                    hover: {
                        marker: {
                            halo: {
                                enabled: true,
                                size: 12,
                                opacity: 0,
                            },
                        },
                    },
                },
            },
        });

        expect(prepared[0].marker.states.hover.halo).toEqual({
            enabled: true,
            opacity: 0,
            size: 12,
        });
    });
});
