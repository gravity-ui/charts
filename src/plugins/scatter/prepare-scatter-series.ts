import get from 'lodash/get';
import merge from 'lodash/merge';

import {DEFAULT_DATALABELS_STYLE, seriesRangeSliderOptionsDefaults} from '~core/constants';
import {
    DEFAULT_DATALABELS_PADDING,
    DEFAULT_HALO_OPTIONS,
    DEFAULT_POINT_MARKER_OPTIONS,
} from '~core/series/constants';
import type {PrepareSeriesArgs} from '~core/series/plugin';
import type {PreparedScatterSeries} from '~core/series/types';
import {prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import type {PointMarkerOptions} from '~core/types/chart/marker';
import {getSymbolType, getUniqId} from '~core/utils';

import type {ChartSeriesOptions, ScatterSeries, ScatterSeriesData} from '../../types';

function prepareMarker(
    series: ScatterSeries,
    seriesOptions: ChartSeriesOptions | undefined,
    index: number,
) {
    const seriesHoverState = get(seriesOptions, 'scatter.states.hover');
    const markerNormalState: Required<Omit<PointMarkerOptions, 'color'>> = {
        ...DEFAULT_POINT_MARKER_OPTIONS,
        enabled: true,
        symbol: (series as ScatterSeries).symbolType || getSymbolType(index),
    };

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

function prepareSeriesData(series: ScatterSeries): ScatterSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = series.data;

    switch (nullMode) {
        case 'zero':
            return data.map((p) => ({
                ...p,
                x: p.x ?? 0,
                y: p.y ?? 0,
            }));
        case 'skip':
        default:
            return data.filter((p) => p.y !== null && p.x !== null);
    }
}

export function prepareScatterSeries(
    args: PrepareSeriesArgs<ScatterSeries>,
): PreparedScatterSeries[] {
    const {colorScale, series, seriesOptions, legend, yAxis} = args;

    return series.map<PreparedScatterSeries>((s, index) => {
        const id = getUniqId();
        const name = 'name' in s && s.name ? s.name : '';
        const symbolType = (s as ScatterSeries).symbolType || getSymbolType(index);
        const yAxisIndex = get(s, 'yAxis', 0);

        const prepared: PreparedScatterSeries = {
            id,
            type: s.type,
            name,
            color: get(s, 'color', colorScale(name)),
            visible: get(s, 'visible', true),
            legend: {
                enabled: s.legend?.enabled ?? legend.enabled,
                symbol: prepareLegendSymbol(s, symbolType),
                groupId: s.legend?.groupId ?? getUniqId(),
                itemText: s.legend?.itemText ?? name,
            },
            data: prepareSeriesData(s),
            dataLabels: {
                enabled: s.dataLabels?.enabled || false,
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, s.dataLabels?.style),
                padding: get(s, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(s, 'dataLabels.allowOverlap', false),
                html: get(s, 'dataLabels.html', false),
                format: s.dataLabels?.format,
            },
            marker: prepareMarker(s, seriesOptions, index),
            cursor: get(s, 'cursor', null),
            yAxis: yAxisIndex,
            tooltip: {
                ...s.tooltip,
                valueFormat:
                    s.tooltip?.valueFormat ?? getDefaultValueFormat({axis: yAxis?.[yAxisIndex]}),
            },
            rangeSlider: Object.assign({}, seriesRangeSliderOptionsDefaults, s.rangeSlider),
            custom: s.custom,
        };

        return prepared;
    }, []);
}
