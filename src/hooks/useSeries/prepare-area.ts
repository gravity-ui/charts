import type {ScaleOrdinal} from 'd3';
import get from 'lodash/get';
import merge from 'lodash/merge';

import {DEFAULT_DATALABELS_STYLE, seriesRangeSliderOptionsDefaults} from '../../constants';
import type {AreaSeries, AreaSeriesData, ChartSeriesOptions} from '../../types';
import type {PointMarkerOptions} from '../../types/chart/marker';
import {getUniqId} from '../../utils';

import {
    DEFAULT_DATALABELS_PADDING,
    DEFAULT_HALO_OPTIONS,
    DEFAULT_POINT_MARKER_OPTIONS,
} from './constants';
import type {PreparedAreaSeries, PreparedLegend} from './types';
import {getSeriesStackId, prepareLegendSymbol} from './utils';

export const DEFAULT_LINE_WIDTH = 1;

export const DEFAULT_MARKER = {
    ...DEFAULT_POINT_MARKER_OPTIONS,
    enabled: false,
};

type PrepareAreaSeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    series: AreaSeries[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
};

function prepareMarker(series: AreaSeries, seriesOptions?: ChartSeriesOptions) {
    const seriesHoverState = get(seriesOptions, 'area.states.hover');
    const markerNormalState: Required<PointMarkerOptions> = Object.assign(
        {},
        DEFAULT_MARKER,
        seriesOptions?.area?.marker,
        series.marker,
    );
    const hoveredMarkerDefaultOptions = {
        enabled: true,
        radius: markerNormalState.radius,
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

function prepareSeriesData(series: AreaSeries): AreaSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = series.data;
    switch (nullMode) {
        case 'zero':
            return data.map((p) => ({...p, y: p.y ?? 0}));
        case 'connect':
        case 'skip':
        default:
            return data;
    }
}

export function prepareArea(args: PrepareAreaSeriesArgs) {
    const {colorScale, series: seriesList, seriesOptions, legend} = args;
    const defaultAreaWidth = get(seriesOptions, 'area.lineWidth', DEFAULT_LINE_WIDTH);
    const defaultOpacity = get(seriesOptions, 'area.opacity', 0.75);

    return seriesList.map<PreparedAreaSeries>((series) => {
        const id = getUniqId();
        const name = series.name || '';
        const color = series.color || colorScale(name);

        const prepared: PreparedAreaSeries = {
            type: series.type,
            color,
            opacity: get(series, 'opacity', defaultOpacity),
            lineWidth: get(series, 'lineWidth', defaultAreaWidth),
            name,
            id,
            visible: get(series, 'visible', true),
            legend: {
                enabled: get(series, 'legend.enabled', legend.enabled),
                symbol: prepareLegendSymbol(series),
                groupId: series.legend?.groupId ?? getUniqId(),
                itemText: series.legend?.itemText ?? name,
            },
            data: prepareSeriesData(series),
            stacking: series.stacking,
            stackId: getSeriesStackId(series),
            dataLabels: {
                enabled: series.dataLabels?.enabled || false,
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(series, 'dataLabels.allowOverlap', false),
                html: get(series, 'dataLabels.html', false),
                format: series.dataLabels?.format,
            },
            marker: prepareMarker(series, seriesOptions),
            cursor: get(series, 'cursor', null),
            yAxis: get(series, 'yAxis', 0),
            tooltip: series.tooltip,
            rangeSlider: Object.assign({}, seriesRangeSliderOptionsDefaults, series.rangeSlider),
            nullMode: series.nullMode,
        };

        return prepared;
    }, []);
}
