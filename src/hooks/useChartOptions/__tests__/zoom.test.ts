import {SeriesType, ZOOM_TYPE} from '../../../constants';
import type {ChartSeries} from '../../../types';
import {getZoomType} from '../zoom';

const AREA_SERIES: ChartSeries = {
    data: [],
    name: 'Area',
    type: SeriesType.Area,
};

const BAR_X_SERIES: ChartSeries = {
    data: [],
    name: 'BarX',
    type: SeriesType.BarX,
};

const BAR_Y_SERIES: ChartSeries = {
    data: [],
    name: 'BarY',
    type: SeriesType.BarY,
};

const LINE_SERIES: ChartSeries = {
    data: [],
    name: 'Line',
    type: SeriesType.Line,
};

const PIE_SERIES: ChartSeries = {
    data: [],
    type: SeriesType.Pie,
};

const RADAR_SERIES: ChartSeries = {
    data: [],
    name: 'Radar',
    type: SeriesType.Radar,
};

const SANKEY_SERIES: ChartSeries = {
    data: [],
    name: 'Sankey',
    type: SeriesType.Sankey,
};

const SCATTER_SERIES: ChartSeries = {
    data: [],
    name: 'Scatter',
    type: SeriesType.Scatter,
};

const TREEMAP_SERIES: ChartSeries = {
    data: [],
    name: 'Treemap',
    type: SeriesType.Treemap,
};

const WATERFALL_SERIES: ChartSeries = {
    data: [],
    name: 'Waterfall',
    type: SeriesType.Waterfall,
};

describe('useChartOptions/zoom/getZoomType', () => {
    test.each([
        {seriesData: [AREA_SERIES], expected: ZOOM_TYPE.X},
        {seriesData: [LINE_SERIES], expected: ZOOM_TYPE.X},
        {seriesData: [BAR_X_SERIES], expected: ZOOM_TYPE.X},
        {seriesData: [BAR_Y_SERIES], expected: ZOOM_TYPE.Y},
        {seriesData: [PIE_SERIES], expected: undefined},
        {seriesData: [RADAR_SERIES], expected: undefined},
        {seriesData: [SANKEY_SERIES], expected: undefined},
        {seriesData: [SCATTER_SERIES], expected: ZOOM_TYPE.XY},
        {seriesData: [TREEMAP_SERIES], expected: undefined},
        {seriesData: [WATERFALL_SERIES], expected: ZOOM_TYPE.X},
    ])('should return default zoom type for single series type: %j', ({seriesData, expected}) => {
        const result = getZoomType({seriesData});
        expect(result).toBe(expected);
    });

    test.each([
        {seriesData: [AREA_SERIES], zoomType: ZOOM_TYPE.XY, expected: ZOOM_TYPE.XY},
        {seriesData: [LINE_SERIES], zoomType: ZOOM_TYPE.XY, expected: ZOOM_TYPE.XY},
        {seriesData: [BAR_X_SERIES], zoomType: ZOOM_TYPE.Y, expected: ZOOM_TYPE.X},
        {seriesData: [BAR_Y_SERIES], zoomType: ZOOM_TYPE.X, expected: ZOOM_TYPE.Y},
        {seriesData: [PIE_SERIES], zoomType: ZOOM_TYPE.X, expected: undefined},
        {seriesData: [RADAR_SERIES], zoomType: ZOOM_TYPE.X, expected: undefined},
        {seriesData: [SANKEY_SERIES], zoomType: ZOOM_TYPE.X, expected: undefined},
        {seriesData: [SCATTER_SERIES], zoomType: ZOOM_TYPE.X, expected: ZOOM_TYPE.X},
        {seriesData: [TREEMAP_SERIES], zoomType: ZOOM_TYPE.X, expected: undefined},
        {seriesData: [WATERFALL_SERIES], zoomType: ZOOM_TYPE.Y, expected: ZOOM_TYPE.Y},
    ])('should return zoom type for single series type: %j', ({seriesData, zoomType, expected}) => {
        const result = getZoomType({seriesData, zoomType});
        expect(result).toBe(expected);
    });

    test.each([
        {seriesData: [AREA_SERIES, BAR_X_SERIES], expected: ZOOM_TYPE.X},
        {seriesData: [AREA_SERIES, BAR_Y_SERIES, SCATTER_SERIES], expected: ZOOM_TYPE.Y},
        {seriesData: [AREA_SERIES, PIE_SERIES], expected: undefined},
        {seriesData: [PIE_SERIES, TREEMAP_SERIES], expected: undefined},
    ])('should return default zoom type for multiple series type: %j', ({seriesData, expected}) => {
        const result = getZoomType({seriesData});
        expect(result).toBe(expected);
    });

    test.each([
        {seriesData: [AREA_SERIES, BAR_X_SERIES], zoomType: ZOOM_TYPE.X, expected: ZOOM_TYPE.X},
        {seriesData: [AREA_SERIES, BAR_X_SERIES], zoomType: ZOOM_TYPE.Y, expected: ZOOM_TYPE.X},
        {
            seriesData: [AREA_SERIES, BAR_Y_SERIES, SCATTER_SERIES],
            zoomType: ZOOM_TYPE.Y,
            expected: ZOOM_TYPE.Y,
        },
        {
            seriesData: [AREA_SERIES, BAR_Y_SERIES, SCATTER_SERIES],
            zoomType: ZOOM_TYPE.X,
            expected: ZOOM_TYPE.Y,
        },
        {seriesData: [AREA_SERIES, PIE_SERIES], zoomType: ZOOM_TYPE.X, expected: undefined},
        {seriesData: [PIE_SERIES, TREEMAP_SERIES], zoomType: ZOOM_TYPE.X, expected: undefined},
    ])(
        'should return zoom type for multiple series type: %j',
        ({seriesData, zoomType, expected}) => {
            const result = getZoomType({seriesData, zoomType});
            expect(result).toBe(expected);
        },
    );
});
