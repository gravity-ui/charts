import {scaleOrdinal} from 'd3-scale';
import get from 'es-toolkit/compat/get';

import {DEFAULT_DATALABELS_STYLE} from '~core/constants';
import {
    DEFAULT_DATALABELS_PADDING,
    DEFAULT_HALO_OPTIONS,
    DEFAULT_POINT_MARKER_OPTIONS,
} from '~core/series/constants';
import {prepareSeriesMetadata} from '~core/series/prepare-series-metadata';
import type {PreparedLegendOptions} from '~core/series/types';
import {prepareLegendSymbol} from '~core/series/utils';
import type {PointMarkerOptions} from '~core/types/chart/marker';
import {getUniqId} from '~core/utils';
import {merge} from '~core/utils/merge';

import type {ChartSeriesOptions, RadarSeries} from '../../types';

import type {PreparedRadarSeries} from './prepared-series';

type PrepareRadarSeriesArgs = {
    series: RadarSeries[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegendOptions;
    colors: string[];
};

export const DEFAULT_MARKER = {
    ...DEFAULT_POINT_MARKER_OPTIONS,
    enabled: true,
    radius: 2,
};

function prepareMarker(series: RadarSeries, seriesOptions?: ChartSeriesOptions) {
    const seriesHoverState = get(seriesOptions, 'radar.states.hover');
    const markerNormalState: Required<Omit<PointMarkerOptions, 'color'>> = Object.assign(
        {},
        DEFAULT_MARKER,
        seriesOptions?.radar?.marker,
        series.marker,
    );
    const hoveredMarkerDefaultOptions = {
        enabled: true,
        radius: markerNormalState.radius + 1,
        borderWidth: 1,
        borderColor: '#ffffff',
        halo: DEFAULT_HALO_OPTIONS,
    };

    return {
        states: {
            normal: markerNormalState,
            hover: merge(hoveredMarkerDefaultOptions, seriesHoverState?.marker),
        },
    };
}

export function prepareRadarSeries(args: PrepareRadarSeriesArgs) {
    const {series: radarSeries, seriesOptions, legend, colors} = args;
    const colorScale = scaleOrdinal(
        radarSeries.map((s, index) => s.name ?? `Series ${index + 1}`),
        colors,
    );
    const categories = radarSeries.find((s) => s.categories?.length)?.categories ?? [];

    return radarSeries.map((series, index) => {
        const name = series.name ?? `Series ${index + 1}`;
        const color = series.color ?? colorScale(name);
        const metadata = prepareSeriesMetadata({
            series: {...series, id: getUniqId(), name},
            color,
            legend,
            symbol: prepareLegendSymbol(series),
        });
        const preparedSeries: PreparedRadarSeries = {
            ...metadata,
            type: 'radar',
            data: series.data,
            categories,
            borderColor: series.borderColor || color,
            borderWidth: series.borderWidth ?? 1,
            fillOpacity: series.fillOpacity ?? 0.25,
            dataLabels: {
                enabled: get(series, 'dataLabels.enabled', true),
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(series, 'dataLabels.allowOverlap', false),
                html: get(series, 'dataLabels.html', false),
                format: series.dataLabels?.format,
            },
            marker: prepareMarker(series, seriesOptions),
        };

        return preparedSeries;
    });
}
