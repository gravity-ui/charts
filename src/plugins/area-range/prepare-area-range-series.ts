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
import {prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import type {ChartSeriesOptions} from '~core/types';
import type {PointMarkerOptions} from '~core/types/chart/marker';
import {getGradientMidColor, getUniqId, isLinearGradient} from '~core/utils';
import {merge} from '~core/utils/merge';

import type {AreaRangeSeries, AreaRangeSeriesData} from '../../types';

import type {PreparedAreaRangeSeries} from './prepared-series';

const DEFAULT_LINE_WIDTH = 1;

function prepareSeriesData(
    series: AreaRangeSeries,
    xAxis: PrepareSeriesArgs['xAxis'],
): AreaRangeSeriesData[] {
    if (xAxis?.type === 'category') {
        return series.data;
    }

    return sort(series.data, (d) => Number(d.x));
}

export function prepareAreaRangeSeries(
    args: PrepareSeriesArgs<AreaRangeSeries, ChartSeriesOptions>,
): PreparedAreaRangeSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend, xAxis, yAxis} = args;
    const defaultLineWidth = get(seriesOptions, 'area-range.lineWidth', DEFAULT_LINE_WIDTH);

    return seriesList.map<PreparedAreaRangeSeries>((series) => {
        const name = series.name || '';
        const lineColor = series.color || colorScale(name);
        const areaFillColor = series.fillColor || lineColor;
        const gradient = isLinearGradient(lineColor) ? lineColor : undefined;
        const fillGradient = isLinearGradient(areaFillColor) ? areaFillColor : undefined;
        const color = typeof lineColor === 'string' ? lineColor : getGradientMidColor(lineColor);
        const fillColor =
            typeof areaFillColor === 'string' ? areaFillColor : getGradientMidColor(areaFillColor);
        const yAxisIndex = get(series, 'yAxis', 0);
        const marker: Required<Omit<PointMarkerOptions, 'color'>> = Object.assign(
            {},
            {...DEFAULT_POINT_MARKER_OPTIONS, enabled: false},
            seriesOptions?.['area-range']?.marker,
            series.marker,
        );
        const hoverMarker = merge(
            {
                enabled: true,
                enabledForNormal: seriesOptions?.['area-range']?.states?.hover?.enabled !== false,
                radius: marker.radius,
                borderWidth: 1,
                borderColor: '#ffffff',
                halo: {...DEFAULT_HALO_OPTIONS},
            },
            seriesOptions?.['area-range']?.states?.hover?.marker,
        );

        const metadata = prepareSeriesMetadata({
            series: {...series, id: getUniqId(), name},
            color,
            legend,
            symbol: prepareLegendSymbol(series),
        });
        return {
            ...metadata,
            type: series.type,
            data: prepareSeriesData(series, xAxis),
            opacity: get(series, 'opacity', 0.75),
            lineWidth: get(series, 'lineWidth', defaultLineWidth),
            marker: {states: {normal: marker, hover: hoverMarker}},
            tooltip: {
                ...series.tooltip,
                valueFormat:
                    series.tooltip?.valueFormat ??
                    getDefaultValueFormat({axis: yAxis?.[yAxisIndex]}),
            },
            dataLabels: {
                enabled: get(series, 'dataLabels.enabled', false),
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(series, 'dataLabels.allowOverlap', false),
                html: get(series, 'dataLabels.html', false),
                format: series.dataLabels?.format,
            },
            rangeSlider: Object.assign({}, seriesRangeSliderOptionsDefaults, series.rangeSlider),
            nullMode: series.nullMode ?? 'skip',
            gradient,
            fillColor,
            fillGradient,
            yAxis: yAxisIndex,
            legend: {...metadata.legend, color: fillColor},
        };
    });
}
