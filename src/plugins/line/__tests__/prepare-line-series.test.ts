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

describe('prepareLineSeries marker halo', () => {
    it('defaults halo.enabled to false for line series', () => {
        const prepared = prepareLineSeries({
            series: [{type: 'line', data: [{x: 1, y: 10}]}],
            legend: {enabled: true},
            colorScale: (() => 'blue') as any,
        } as any);

        expect(prepared[0].marker.states.hover.halo).toEqual({
            enabled: false,
            opacity: 0.25,
            size: 6,
        });
    });

    it('preserves halo options when explicitly enabled', () => {
        const prepared = prepareLineSeries({
            series: [{type: 'line', data: [{x: 1, y: 10}]}],
            legend: {enabled: true},
            seriesOptions: {
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
            },
            colorScale: (() => 'blue') as any,
        } as any);

        expect(prepared[0].marker.states.hover.halo).toEqual({
            enabled: true,
            opacity: 0.25,
            size: 6,
        });
    });

    it('respects explicit enabled: false', () => {
        const prepared = prepareLineSeries({
            series: [{type: 'line', data: [{x: 1, y: 10}]}],
            legend: {enabled: true},
            seriesOptions: {
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
            },
            colorScale: (() => 'blue') as any,
        } as any);

        expect(prepared[0].marker.states.hover.halo).toEqual({
            enabled: false,
            opacity: 0.25,
            size: 10,
        });
    });

    it('preserves custom size and opacity, including zero opacity', () => {
        const prepared = prepareLineSeries({
            series: [{type: 'line', data: [{x: 1, y: 10}]}],
            legend: {enabled: true},
            seriesOptions: {
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
            },
            colorScale: (() => 'blue') as any,
        } as any);

        expect(prepared[0].marker.states.hover.halo).toEqual({
            enabled: true,
            opacity: 0,
            size: 12,
        });
    });
});
