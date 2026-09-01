import intersection from 'lodash/intersection';
import merge from 'lodash/merge';

import {brushDefaults} from '~core/constants';
import type {ZoomType} from '~core/constants';
import {getSeriesPlugin} from '~core/series/seriesRegistry';

import type {PreparedZoom} from '../../../hooks/types';
import type {ChartBrush, ChartSeries, ChartZoom} from '../../../types';

export function getZoomType(args: {
    seriesData: ChartSeries[];
    zoomType?: ZoomType;
}): ZoomType | undefined {
    const {seriesData, zoomType} = args;
    const possibleZoomTypes: ZoomType[][] = seriesData.map((s) => {
        return getSeriesPlugin(s.type).zoom?.types ?? [];
    });
    const availableZoomTypes = intersection(...possibleZoomTypes) as ZoomType[];

    if (zoomType && availableZoomTypes.includes(zoomType)) {
        return zoomType;
    }

    const possibleDefaultZoomTypes: ZoomType[] = seriesData
        .map((s) => {
            return getSeriesPlugin(s.type).zoom?.defaultType;
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
