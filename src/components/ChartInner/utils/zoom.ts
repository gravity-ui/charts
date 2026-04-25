import intersection from 'lodash/intersection';
import merge from 'lodash/merge';

import {SERIES_TYPE, ZOOM_TYPE, brushDefaults} from '~core/constants';
import type {SeriesType, ZoomType} from '~core/constants';

import type {PreparedZoom} from '../../../hooks/types';
import type {ChartBrush, ChartSeries, ChartZoom} from '../../../types';

type SeriesZoomSupport = {
    types: ZoomType[];
    default: ZoomType;
};

const SERIES_ZOOM_SUPPORT: Partial<Record<SeriesType, SeriesZoomSupport>> = {
    [SERIES_TYPE.Area]: {
        types: [ZOOM_TYPE.X, ZOOM_TYPE.XY, ZOOM_TYPE.Y],
        default: ZOOM_TYPE.X,
    },
    [SERIES_TYPE.BarX]: {
        types: [ZOOM_TYPE.X, ZOOM_TYPE.XY],
        default: ZOOM_TYPE.X,
    },
    [SERIES_TYPE.BarY]: {
        types: [ZOOM_TYPE.Y],
        default: ZOOM_TYPE.Y,
    },
    [SERIES_TYPE.Line]: {
        types: [ZOOM_TYPE.X, ZOOM_TYPE.XY, ZOOM_TYPE.Y],
        default: ZOOM_TYPE.X,
    },
    [SERIES_TYPE.Scatter]: {
        types: [ZOOM_TYPE.X, ZOOM_TYPE.XY, ZOOM_TYPE.Y],
        default: ZOOM_TYPE.XY,
    },
    [SERIES_TYPE.Waterfall]: {
        types: [ZOOM_TYPE.X, ZOOM_TYPE.XY, ZOOM_TYPE.Y],
        default: ZOOM_TYPE.X,
    },
    [SERIES_TYPE.XRange]: {
        types: [ZOOM_TYPE.X],
        default: ZOOM_TYPE.X,
    },
};

export function getZoomType(args: {
    seriesData: ChartSeries[];
    zoomType?: ZoomType;
}): ZoomType | undefined {
    const {seriesData, zoomType} = args;

    if (seriesData.length === 0) {
        return undefined;
    }

    const perSeries = seriesData.map((s) => SERIES_ZOOM_SUPPORT[s.type]);

    if (perSeries.some((s) => !s)) {
        return undefined;
    }

    const supportedTypes = intersection(
        ...perSeries.map((s) => (s as SeriesZoomSupport).types),
    ) as ZoomType[];

    if (zoomType && supportedTypes.includes(zoomType)) {
        return zoomType;
    }

    const defaults = perSeries.map((s) => (s as SeriesZoomSupport).default);
    const compatibleDefault = intersection(defaults, supportedTypes) as ZoomType[];

    return compatibleDefault[0];
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
