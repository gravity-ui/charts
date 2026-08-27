import {SymbolType} from '../../constants';
import {buildHoverMarkerGetter} from '../marker';

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
});
