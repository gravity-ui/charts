import type {ScaleOrdinal} from 'd3';
import get from 'lodash/get';
import merge from 'lodash/merge';

import {DEFAULT_DATALABELS_STYLE, DashStyle, LineCap} from '../../constants';
import type {
    ChartSeries,
    ChartSeriesOptions,
    LineSeries,
    RectLegendSymbolOptions,
} from '../../types';
import {getUniqId} from '../../utils';

import {
    DEFAULT_DATALABELS_PADDING,
    DEFAULT_HALO_OPTIONS,
    DEFAULT_LEGEND_SYMBOL_PADDING,
    DEFAULT_POINT_MARKER_OPTIONS,
} from './constants';
import type {PreparedLegend, PreparedLegendSymbol, PreparedLineSeries} from './types';

export const DEFAULT_LEGEND_SYMBOL_SIZE = 16;
export const DEFAULT_LINE_WIDTH = 1;
export const DEFAULT_DASH_STYLE = DashStyle.Solid;

export const DEFAULT_MARKER = {
    ...DEFAULT_POINT_MARKER_OPTIONS,
    enabled: false,
};

type PrepareLineSeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    series: LineSeries[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
};

function prepareLinecap(
    dashStyle: DashStyle,
    series: LineSeries,
    seriesOptions?: ChartSeriesOptions,
) {
    const defaultLineCap = dashStyle === DashStyle.Solid ? LineCap.Round : LineCap.None;
    const lineCapFromSeriesOptions = get(seriesOptions, 'line.linecap', defaultLineCap);

    return get(series, 'linecap', lineCapFromSeriesOptions);
}

function prepareLineLegendSymbol(
    series: ChartSeries,
    seriesOptions?: ChartSeriesOptions,
): PreparedLegendSymbol {
    const symbolOptions: RectLegendSymbolOptions = series.legend?.symbol || {};
    const defaultLineWidth = get(seriesOptions, 'line.lineWidth', DEFAULT_LINE_WIDTH);

    return {
        shape: 'path',
        width: symbolOptions?.width || DEFAULT_LEGEND_SYMBOL_SIZE,
        padding: symbolOptions?.padding || DEFAULT_LEGEND_SYMBOL_PADDING,
        strokeWidth: get(series, 'lineWidth', defaultLineWidth),
    };
}

function prepareMarker(series: LineSeries, seriesOptions?: ChartSeriesOptions) {
    const seriesHoverState = get(seriesOptions, 'line.states.hover');
    const markerNormalState = Object.assign(
        {},
        DEFAULT_MARKER,
        seriesOptions?.line?.marker,
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

export function prepareLineSeries(args: PrepareLineSeriesArgs) {
    const {colorScale, series: seriesList, seriesOptions, legend} = args;

    const defaultLineWidth = get(seriesOptions, 'line.lineWidth', DEFAULT_LINE_WIDTH);
    const defaultDashStyle = get(seriesOptions, 'line.dashStyle', DEFAULT_DASH_STYLE);

    return seriesList.map<PreparedLineSeries>((series) => {
        const id = getUniqId();
        const name = series.name || '';
        const color = series.color || colorScale(name);
        const dashStyle = get(series, 'dashStyle', defaultDashStyle);

        const prepared: PreparedLineSeries = {
            type: series.type,
            color,
            lineWidth: get(series, 'lineWidth', defaultLineWidth),
            name,
            id,
            visible: get(series, 'visible', true),
            legend: {
                enabled: get(series, 'legend.enabled', legend.enabled),
                symbol: prepareLineLegendSymbol(series, seriesOptions),
            },
            data: series.data,
            dataLabels: {
                enabled: series.dataLabels?.enabled || false,
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(series, 'dataLabels.allowOverlap', false),
                html: get(series, 'dataLabels.html', false),
                format: series.dataLabels?.format,
            },
            marker: prepareMarker(series, seriesOptions),
            dashStyle: dashStyle as DashStyle,
            linecap: prepareLinecap(dashStyle as DashStyle, series, seriesOptions) as LineCap,
            opacity: get(series, 'opacity', null),
            cursor: get(series, 'cursor', null),
            yAxis: get(series, 'yAxis', 0),
        };

        return prepared;
    }, []);
}
