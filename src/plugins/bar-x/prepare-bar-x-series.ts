import get from 'es-toolkit/compat/get';

import {DEFAULT_DATALABELS_STYLE, seriesRangeSliderOptionsDefaults} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import type {PrepareSeriesArgs} from '~core/series/plugin';
import {prepareSeriesMetadata} from '~core/series/prepare-series-metadata';
import {getSeriesStackId, prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import type {ChartSeriesOptions} from '~core/types';
import {getUniqId} from '~core/utils';
import {withSourcePoint} from '~core/utils/source-point';

import type {BarXSeries, BarXSeriesData} from '../../types';
import {resolveBarLabelPlacement} from '../bar-label-placement';
import {resolveStackBarSizing} from '../bar-sizing';

import {barXDefaults} from './defaults';
import type {PreparedBarXSeries} from './prepared-series';
import {getBarXStackKey} from './utils';

function prepareSeriesData(series: BarXSeries): BarXSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = series.data;
    switch (nullMode) {
        case 'zero':
            return data.map((p) => withSourcePoint(p, {...p, y: p.y ?? 0}));
        case 'skip':
        default:
            return data;
    }
}

export function prepareBarXSeries(
    args: PrepareSeriesArgs<BarXSeries, ChartSeriesOptions>,
): PreparedBarXSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend, yAxis} = args;

    const preparedSeries = seriesList.map<
        Omit<PreparedBarXSeries, 'stackBarPadding' | 'stackBarMaxWidth'>
    >((series) => {
        const name = series.name || '';
        const color = series.color || colorScale(name);
        const opacity = series.opacity ?? seriesOptions?.['bar-x']?.opacity ?? 1;
        const dataLabelsInside = series.stacking === 'percent';
        const yAxisIndex = get(series, 'yAxis', 0);

        const metadata = prepareSeriesMetadata({
            series: {...series, id: getUniqId(), name},
            color,
            legend,
            symbol: {...prepareLegendSymbol(series), opacity},
        });
        return {
            ...metadata,
            type: series.type,
            opacity,
            data: prepareSeriesData(series),
            stacking: series.stacking,
            grouping: series.grouping ?? true,
            barPadding:
                series.barPadding ??
                get(seriesOptions, 'bar-x.barPadding', barXDefaults.barPadding),
            barMaxWidth:
                series.barMaxWidth ??
                get(seriesOptions, 'bar-x.barMaxWidth', barXDefaults.barMaxWidth),
            stackLabels: series.stackLabels,
            // Non-stacked overlays need independent domains even with a stackId.
            stackId: getSeriesStackId(series),
            resolvedStackId:
                series.grouping === false && !series.stacking ? getUniqId() : undefined,
            valueAxis: 'y',
            dataLabels: {
                enabled: series.dataLabels?.enabled || false,
                inside: dataLabelsInside,
                placement: resolveBarLabelPlacement(series.dataLabels?.placement),
                placementFallback: series.dataLabels?.placementFallback ?? 'show',
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                allowOverlap: series.dataLabels?.allowOverlap || false,
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                html: get(series, 'dataLabels.html', false),
                format: series.dataLabels?.format,
            },
            yAxis: yAxisIndex,
            borderRadius: get(series, 'borderRadius', get(seriesOptions, 'bar-x.borderRadius', 0)),
            borderWidth: series.borderWidth ?? seriesOptions?.['bar-x']?.borderWidth ?? 0,
            borderColor:
                series.borderColor ??
                seriesOptions?.['bar-x']?.borderColor ??
                'var(--gcharts-shape-border-color)',
            tooltip: {
                ...series.tooltip,
                valueFormat:
                    series.tooltip?.valueFormat ??
                    getDefaultValueFormat({axis: yAxis?.[yAxisIndex]}),
            },
            rangeSlider: Object.assign({}, seriesRangeSliderOptionsDefaults, series.rangeSlider),
        };
    }, []);

    return resolveStackBarSizing(preparedSeries, getBarXStackKey);
}
