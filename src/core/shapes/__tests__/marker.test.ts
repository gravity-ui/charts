/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names
import {select} from 'd3-selection';

import {SymbolType} from '../../constants';
import {buildHoverMarkerGetter, matchHoverPoints, renderHoverMarkers} from '../marker';
import type {MarkerItem} from '../types';

describe('buildHoverMarkerGetter', () => {
    test('prefers the resolved fill without overwriting the configured color', () => {
        const data = {x: 1, y: 20};
        const point = {data, x: 10, y: 20, color: 'red', fill: 'purple'};
        const series = {
            id: 'line-1',
            color: 'black',
            marker: {
                states: {
                    normal: {enabled: false, symbol: SymbolType.Circle},
                    hover: {
                        enabled: true,
                        radius: 4,
                        borderColor: 'white',
                        borderWidth: 1,
                    },
                },
            },
        };
        const getHoverMarkers = buildHoverMarkerGetter([point], series);

        expect(getHoverMarkers([{data, series: {id: series.id}}])).toEqual([
            expect.objectContaining({fill: 'purple'}),
        ]);
        expect(point.color).toBe('red');
    });

    test('uses the geometry selected for a duplicated raw data point', () => {
        const data = {x: 1, y: 20};
        const series = {
            id: 'area-1',
            color: 'black',
            marker: {
                states: {
                    normal: {enabled: false, symbol: SymbolType.Circle},
                    hover: {
                        enabled: true,
                        radius: 4,
                        borderColor: 'white',
                        borderWidth: 1,
                    },
                },
            },
        };
        const getHoverMarkers = buildHoverMarkerGetter(
            [
                {data, x: 10, y: 20, color: 'red'},
                {data, x: 10, y: 30, color: 'blue'},
            ],
            series,
        );

        expect(getHoverMarkers([{data, series: {id: series.id}, x: 10, y1: 20}])).toEqual([
            expect.objectContaining({cx: 10, cy: 20, fill: 'red'}),
        ]);
    });

    test('preserves point clipping in returned hover marker', () => {
        const data = {x: 1, y: 20};
        const point = {data, x: 10, y: 20, clipped: true};
        const series = {
            id: 'line-1',
            color: 'black',
            marker: {
                states: {
                    normal: {enabled: false, symbol: SymbolType.Circle},
                    hover: {
                        enabled: true,
                        radius: 4,
                        borderColor: 'white',
                        borderWidth: 1,
                    },
                },
            },
        };
        const getHoverMarkers = buildHoverMarkerGetter([point], series);

        expect(getHoverMarkers([{data, series: {id: series.id}}])).toEqual([
            expect.objectContaining({clipped: true}),
        ]);
    });
});

describe('matchHoverPoints', () => {
    test('ignores hovered data from other series', () => {
        const point = {data: {x: 1}, x: 10, y: 20};
        const matcher = matchHoverPoints([point], 'series-1');

        expect(matcher([{data: {x: 1}, series: {id: 'other-series'}}])).toEqual([]);
    });

    test('matches by coordinates when provided', () => {
        const data = {x: 1};
        const point1 = {data, x: 10, y: 20};
        const point2 = {data, x: 30, y: 40};
        const matcher = matchHoverPoints([point1, point2], 'series-1');

        const result = matcher([{data, series: {id: 'series-1'}, x: 30, y1: 40}]);
        expect(result).toEqual([
            {point: point2, hovered: expect.objectContaining({x: 30, y1: 40})},
        ]);
    });
});

function createMarkerItem(overrides: Partial<MarkerItem> = {}): MarkerItem {
    return {
        cx: 0,
        cy: 0,
        radius: 4,
        symbolType: SymbolType.Circle,
        fill: 'red',
        stroke: 'white',
        strokeWidth: 1,
        opacity: 1,
        active: true,
        clipped: false,
        series: {id: 's1'},
        data: {},
        ...overrides,
    };
}

describe('renderHoverMarkers', () => {
    let container: SVGGElement;

    beforeEach(() => {
        container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    });

    test('renders halo path behind symbol path when halo is enabled', () => {
        const marker = createMarkerItem({
            cx: 15,
            cy: 25,
            halo: {enabled: true, size: 6, opacity: 0.25},
        });

        renderHoverMarkers(select(container), [marker]);

        const wrapper = container.querySelector('.gcharts-marker__wrapper');
        expect(wrapper).not.toBeNull();
        expect(wrapper?.getAttribute('transform')).toBe('translate(15,25)');

        const paths = wrapper?.querySelectorAll('path');
        expect(paths?.length).toBe(2);

        // First path is the halo (rendered behind)
        const halo = paths?.[0];
        expect(halo?.getAttribute('class')).toBe('gcharts-marker__halo');
        expect(halo?.getAttribute('d')).toBeTruthy();
        expect(halo?.getAttribute('fill')).toBe('red');
        expect(halo?.getAttribute('opacity')).toBe('0.25');

        // Second path is the marker symbol (rendered in front)
        const symbol = paths?.[1];
        expect(symbol?.getAttribute('class')).toBe('gcharts-marker__symbol');
        expect(symbol?.getAttribute('d')).toBeTruthy();
        expect(symbol?.getAttribute('fill')).toBe('red');
        expect(symbol?.getAttribute('stroke')).toBe('white');
        expect(symbol?.getAttribute('stroke-width')).toBe('1');
    });

    test('preserves opacity: 0 and custom size on halo', () => {
        const marker = createMarkerItem({
            radius: 5,
            symbolType: SymbolType.Square,
            fill: 'green',
            stroke: '#111',
            strokeWidth: 2,
            halo: {enabled: true, size: 10, opacity: 0},
        });

        renderHoverMarkers(select(container), [marker]);

        const halo = container.querySelector('.gcharts-marker__halo');
        expect(halo).not.toBeNull();
        expect(halo?.getAttribute('d')).toBeTruthy();
        expect(halo?.getAttribute('opacity')).toBe('0');
        expect(halo?.getAttribute('fill')).toBe('green');
    });

    test('does not render halo path when halo is disabled or omitted', () => {
        const markerWithoutHalo = createMarkerItem();
        renderHoverMarkers(select(container), [markerWithoutHalo]);

        expect(container.querySelector('.gcharts-marker__halo')).toBeNull();
        expect(container.querySelector('.gcharts-marker__symbol')).not.toBeNull();

        const markerWithDisabledHalo = createMarkerItem({
            halo: {enabled: false, size: 6, opacity: 0.25},
        });

        renderHoverMarkers(select(container), [markerWithDisabledHalo]);
        expect(container.querySelector('.gcharts-marker__halo')).toBeNull();
        expect(container.querySelector('.gcharts-marker__symbol')).not.toBeNull();
    });

    test('cleans up container when empty hover markers are provided', () => {
        const marker = createMarkerItem({
            halo: {enabled: true, size: 6, opacity: 0.25},
        });

        renderHoverMarkers(select(container), [marker]);
        expect(container.children.length).toBe(1);

        renderHoverMarkers(select(container), []);
        expect(container.children.length).toBe(0);
    });

    test('does not render symbol when renderSymbol is false', () => {
        const markerWithoutSymbol = createMarkerItem({
            renderSymbol: false,
            halo: {enabled: true, size: 8, opacity: 0.3},
        });

        renderHoverMarkers(select(container), [markerWithoutSymbol]);

        expect(container.querySelector('.gcharts-marker__halo')).not.toBeNull();
        expect(container.querySelector('.gcharts-marker__symbol')).toBeNull();
    });

    test('omits path d when clipped is true', () => {
        const marker = createMarkerItem({
            halo: {enabled: true, size: 6, opacity: 0.25},
            clipped: true,
        });

        renderHoverMarkers(select(container), [marker]);

        const halo = container.querySelector('.gcharts-marker__halo');
        const symbol = container.querySelector('.gcharts-marker__symbol');
        expect(halo?.hasAttribute('d')).toBe(false);
        expect(symbol?.hasAttribute('d')).toBe(false);
    });
});
