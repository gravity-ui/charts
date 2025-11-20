import type {ScaleOrdinal} from 'd3';
import get from 'lodash/get';
import merge from 'lodash/merge';

import {seriesRangeSliderOptionsDefaults} from '../../constants';
import type {ChartSeriesOptions, ScatterSeries, ScatterSeriesData} from '../../types';
import type {PointMarkerOptions} from '../../types/chart/marker';
import {getSymbolType, getUniqId} from '../../utils';

import {DEFAULT_HALO_OPTIONS, DEFAULT_POINT_MARKER_OPTIONS} from './constants';
import type {PreparedLegend, PreparedScatterSeries} from './types';
import {prepareLegendSymbol} from './utils';

function prepareMarker(
    series: ScatterSeries,
    seriesOptions: ChartSeriesOptions | undefined,
    index: number,
) {
    const seriesHoverState = get(seriesOptions, 'scatter.states.hover');
    const markerNormalState: Required<PointMarkerOptions> = {
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

interface PrepareScatterSeriesArgs {
    colorScale: ScaleOrdinal<string, string>;
    series: ScatterSeries[];
    legend: PreparedLegend;
    seriesOptions?: ChartSeriesOptions;
}

export function prepareScatterSeries(args: PrepareScatterSeriesArgs): PreparedScatterSeries[] {
    const {colorScale, series, seriesOptions, legend} = args;

    return series.map<PreparedScatterSeries>((s, index) => {
        const id = getUniqId();
        const name = 'name' in s && s.name ? s.name : '';
        const symbolType = (s as ScatterSeries).symbolType || getSymbolType(index);

        const prepared: PreparedScatterSeries = {
            id,
            type: s.type,
            name,
            color: get(s, 'color', colorScale(name)),
            visible: get(s, 'visible', true),
            legend: {
                enabled: get(s, 'legend.enabled', legend.enabled),
                symbol: prepareLegendSymbol(s, symbolType),
            },
            data: prepareSeriesData(s),
            marker: prepareMarker(s, seriesOptions, index),
            cursor: get(s, 'cursor', null),
            yAxis: get(s, 'yAxis', 0),
            tooltip: s.tooltip,
            rangeSlider: Object.assign({}, seriesRangeSliderOptionsDefaults, s.rangeSlider),
        };

        return prepared;
    }, []);
}
