import get from 'lodash/get';
import intersection from 'lodash/intersection';

import {SeriesType} from '../../constants';
import type {ChartData, ChartSeries, ChartZoom} from '../../types';

import type {PreparedChart, PreparedTitle, PreparedZoom} from './types';

const getMarginTop = (args: {chart: ChartData['chart']; preparedTitle?: PreparedTitle}) => {
    const {chart, preparedTitle} = args;
    let marginTop = get(chart, 'margin.top', 0);

    if (preparedTitle?.height) {
        marginTop += preparedTitle.height;
    }

    return marginTop;
};

const getMarginRight = (args: {chart: ChartData['chart']}) => {
    const {chart} = args;

    return get(chart, 'margin.right', 0);
};

function mapSeriesTypeToZoomType(seriesType: ChartSeries['type']): ChartZoom['type'][] {
    switch (seriesType) {
        case SeriesType.Area: {
            return ['x', 'y', 'xy'];
        }
        case SeriesType.BarX: {
            return ['x'];
        }
        case SeriesType.BarY: {
            return ['y'];
        }
        case SeriesType.Line: {
            return ['x', 'y', 'xy'];
        }
        case SeriesType.Scatter: {
            return ['x', 'y', 'xy'];
        }
        case SeriesType.Waterfall: {
            return ['x', 'y', 'xy'];
        }
        default: {
            return [];
        }
    }
}

function getDefaultZoomType(seriesType: ChartSeries['type']): ChartZoom['type'] {
    switch (seriesType) {
        case SeriesType.BarY: {
            return 'y';
        }
        case SeriesType.Scatter: {
            return 'xy';
        }
        default: {
            return 'x';
        }
    }
}

function getZoomType(args: {
    seriesData: ChartSeries[];
    zoomType?: ChartZoom['type'];
}): ChartZoom['type'] | undefined {
    const {seriesData, zoomType} = args;
    const possibleDefaultZoomTypes: ChartZoom['type'][] = seriesData.map((s) => {
        return getDefaultZoomType(s.type);
    });
    const availableDefaultZoomTypes = intersection(possibleDefaultZoomTypes);

    if (zoomType) {
        const possibleZoomTypes: ChartZoom['type'][][] = seriesData.map((s) => {
            return mapSeriesTypeToZoomType(s.type);
        });
        const availableZoomTypes = intersection(...possibleZoomTypes) as ChartZoom['type'][];

        if (availableZoomTypes.includes(zoomType)) {
            return zoomType;
        }
    }

    if (availableDefaultZoomTypes.length) {
        return availableDefaultZoomTypes[0];
    }

    return undefined;
}

function getPreparedZoom(args: {zoom?: ChartZoom; seriesData: ChartSeries[]}): PreparedZoom | null {
    const {zoom, seriesData} = args;

    if (!zoom?.enabled) {
        return null;
    }

    const type = getZoomType({seriesData, zoomType: zoom.type});

    if (!type) {
        return null;
    }

    return {
        type,
        brush: {
            style: {
                fillOpacity: 1,
                ...zoom?.brush?.style,
            },
        },
    };
}

export const getPreparedChart = (args: {
    chart: ChartData['chart'];
    seriesData: ChartSeries[];
    preparedTitle?: PreparedTitle;
}): PreparedChart => {
    const {chart, preparedTitle, seriesData} = args;
    const marginTop = getMarginTop({chart, preparedTitle});
    const marginBottom = get(chart, 'margin.bottom', 0);
    const marginLeft = get(chart, 'margin.left', 0);
    const marginRight = getMarginRight({chart});
    const zoom = getPreparedZoom({zoom: chart?.zoom, seriesData});

    return {
        margin: {
            top: marginTop,
            right: marginRight,
            bottom: marginBottom,
            left: marginLeft,
        },
        zoom,
    };
};
