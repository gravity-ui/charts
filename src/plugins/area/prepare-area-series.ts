import {sort} from 'd3-array';
import get from 'es-toolkit/compat/get';

import {DEFAULT_DATALABELS_STYLE, seriesRangeSliderOptionsDefaults} from '~core/constants';
import {
    DEFAULT_DATALABELS_PADDING,
    DEFAULT_HALO_OPTIONS,
    DEFAULT_POINT_MARKER_OPTIONS,
} from '~core/series/constants';
import type {PrepareSeriesArgs} from '~core/series/plugin';
import {prepareSeriesMetadata} from '~core/series/prepare-series-metadata';
import {getSeriesStackId, prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import type {PointMarkerOptions} from '~core/types/chart/marker';
import {getGradientMidColor, getUniqId, isLinearGradient} from '~core/utils';
import {merge} from '~core/utils/merge';
import {withSourcePoint} from '~core/utils/source-point';

import type {AreaSeries, AreaSeriesData, ChartSeriesOptions} from '../../types';

import type {PreparedAreaSeries} from './prepared-series';

export const DEFAULT_LINE_WIDTH = 1;

export const DEFAULT_MARKER = {
    ...DEFAULT_POINT_MARKER_OPTIONS,
    enabled: false,
};

function prepareMarker(series: AreaSeries, seriesOptions?: ChartSeriesOptions) {
    const seriesHoverState = get(seriesOptions, 'area.states.hover');
    const markerNormalState: Required<Omit<PointMarkerOptions, 'color'>> = Object.assign(
        {},
        DEFAULT_MARKER,
        seriesOptions?.area?.marker,
        series.marker,
    );
    const hoveredMarkerDefaultOptions = {
        enabled: true,
        enabledForNormal: seriesHoverState?.enabled !== false,
        radius: markerNormalState.radius,
        borderWidth: 1,
        borderColor: '#ffffff',
        halo: {...DEFAULT_HALO_OPTIONS},
    };
    const hoverMarker = merge(hoveredMarkerDefaultOptions, seriesHoverState?.marker);

    return {
        states: {
            normal: markerNormalState,
            hover: hoverMarker,
        },
    };
}

function prepareSeriesData(series: AreaSeries): AreaSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = sort(series.data, (point) => point.x);
    switch (nullMode) {
        case 'zero':
            return data.map((p) => withSourcePoint(p, {...p, y: p.y ?? 0}));
        case 'connect':
        case 'skip':
        default:
            return data;
    }
}

export function prepareAreaSeries(args: PrepareSeriesArgs<AreaSeries, ChartSeriesOptions>) {
    const {colorScale, series: seriesList, seriesOptions, legend, yAxis} = args;
    const defaultAreaWidth = get(seriesOptions, 'area.lineWidth', DEFAULT_LINE_WIDTH);
    const defaultOpacity = get(seriesOptions, 'area.opacity', 0.75);

    return seriesList.map<PreparedAreaSeries>((series) => {
        const id = getUniqId();
        const name = series.name || '';
        const lineColor = series.color || colorScale(name);
        const areaFillColor = series.fillColor || lineColor;
        const gradient = isLinearGradient(lineColor) ? lineColor : undefined;
        const fillGradient = isLinearGradient(areaFillColor) ? areaFillColor : undefined;
        const color = typeof lineColor === 'string' ? lineColor : getGradientMidColor(lineColor);
        const fillColor =
            typeof areaFillColor === 'string' ? areaFillColor : getGradientMidColor(areaFillColor);
        const yAxisIndex = get(series, 'yAxis', 0);

        const metadata = prepareSeriesMetadata({
            series: {...series, id, name},
            color,
            legend,
            symbol: prepareLegendSymbol(series),
        });
        const prepared: PreparedAreaSeries = {
            ...metadata,
            type: series.type,
            opacity: get(series, 'opacity', defaultOpacity),
            lineWidth: get(series, 'lineWidth', defaultAreaWidth),
            data: prepareSeriesData(series),
            stacking: series.stacking,
            stackLabels: series.stackLabels,
            stackId: getSeriesStackId(series),
            valueAxis: 'y',
            dataLabels: {
                enabled: series.dataLabels?.enabled || false,
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(series, 'dataLabels.allowOverlap', false),
                html: get(series, 'dataLabels.html', false),
                format: series.dataLabels?.format,
            },
            marker: prepareMarker(series, seriesOptions),
            yAxis: yAxisIndex,
            tooltip: {
                ...series.tooltip,
                valueFormat:
                    series.tooltip?.valueFormat ??
                    getDefaultValueFormat({axis: yAxis?.[yAxisIndex]}),
            },
            rangeSlider: Object.assign({}, seriesRangeSliderOptionsDefaults, series.rangeSlider),
            nullMode: series.nullMode,
            gradient,
            fillColor,
            fillGradient,
            legend: {...metadata.legend, color: fillColor},
        };

        prepared.fullData = prepared.data;
        return prepared;
    }, []);
}
