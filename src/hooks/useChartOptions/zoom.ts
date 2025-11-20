import intersection from 'lodash/intersection';
import merge from 'lodash/merge';

import {SERIES_TYPE, ZOOM_TYPE, brushDefaults} from '../../constants';
import type {ZoomType} from '../../constants';
import type {ChartBrush, ChartSeries, ChartZoom} from '../../types';

import type {PreparedZoom} from './types';

function mapSeriesTypeToZoomType(seriesType: ChartSeries['type']): ZoomType[] {
    switch (seriesType) {
        case SERIES_TYPE.Area: {
            return [ZOOM_TYPE.X, ZOOM_TYPE.XY, ZOOM_TYPE.Y];
        }
        case SERIES_TYPE.BarX: {
            return [ZOOM_TYPE.X];
        }
        case SERIES_TYPE.BarY: {
            return [ZOOM_TYPE.Y];
        }
        case SERIES_TYPE.Line: {
            return [ZOOM_TYPE.X, ZOOM_TYPE.XY, ZOOM_TYPE.Y];
        }
        case SERIES_TYPE.Scatter: {
            return [ZOOM_TYPE.X, ZOOM_TYPE.XY, ZOOM_TYPE.Y];
        }
        case SERIES_TYPE.Waterfall: {
            return [ZOOM_TYPE.X, ZOOM_TYPE.XY, ZOOM_TYPE.Y];
        }
        default: {
            return [];
        }
    }
}

function getDefaultZoomType(seriesType: ChartSeries['type']): ZoomType | undefined {
    switch (seriesType) {
        case SERIES_TYPE.BarY: {
            return ZOOM_TYPE.Y;
        }
        case SERIES_TYPE.Scatter: {
            return ZOOM_TYPE.XY;
        }
        case SERIES_TYPE.Area:
        case SERIES_TYPE.BarX:
        case SERIES_TYPE.Line:
        case SERIES_TYPE.Waterfall: {
            return ZOOM_TYPE.X;
        }
        default: {
            return undefined;
        }
    }
}

export function getZoomType(args: {
    seriesData: ChartSeries[];
    zoomType?: ZoomType;
}): ZoomType | undefined {
    const {seriesData, zoomType} = args;
    const possibleZoomTypes: ZoomType[][] = seriesData.map((s) => {
        return mapSeriesTypeToZoomType(s.type);
    });
    const availableZoomTypes = intersection(...possibleZoomTypes) as ZoomType[];

    if (zoomType && availableZoomTypes.includes(zoomType)) {
        return zoomType;
    }

    const possibleDefaultZoomTypes: ZoomType[] = seriesData
        .map((s) => {
            return getDefaultZoomType(s.type);
        })
        .filter(Boolean) as ZoomType[];
    const availableDefaultZoomTypes = intersection(
        possibleDefaultZoomTypes,
        ...possibleZoomTypes,
    ) as ZoomType[];

    if (availableDefaultZoomTypes.length) {
        return availableDefaultZoomTypes[0];
    }

    return undefined;
}

export function getPreparedZoom(args: {
    zoom?: ChartZoom;
    seriesData: ChartSeries[];
}): PreparedZoom | null {
    const {zoom, seriesData} = args;

    if (!zoom?.enabled) {
        return null;
    }

    const type = getZoomType({seriesData, zoomType: zoom.type});

    if (!type) {
        return null;
    }

    const brush = merge({}, brushDefaults, zoom?.brush, {
        borderWidth: 0,
        handles: {enabled: false},
    } satisfies Partial<ChartBrush>);

    return {
        brush,
        resetButton: {
            align: zoom?.resetButton?.align || 'top-right',
            offset: Object.assign({x: 0, y: 0}, zoom?.resetButton?.offset),
            relativeTo: zoom?.resetButton?.relativeTo || 'chart-box',
        },
        type,
    };
}
