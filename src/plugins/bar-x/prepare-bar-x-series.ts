import get from 'lodash/get';

import {
    DEFAULT_DATALABELS_STYLE,
    seriesOptionsDefaults,
    seriesRangeSliderOptionsDefaults,
} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import type {PrepareSeriesArgs} from '~core/series/plugin';
import type {PreparedBarXSeries, PreparedSeries} from '~core/series/types';
import {getSeriesStackId, prepareLegendSymbol} from '~core/series/utils';
import {getBarXStackKey} from '~core/shapes/bar-x/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import {getUniqId} from '~core/utils';
import {withSourcePoint} from '~core/utils/source-point';

import type {BarXSeries, BarXSeriesData} from '../../types';
import {resolveBarLabelPlacement} from '../bar-label-placement';
import {resolveStackBarSizing} from '../bar-sizing';

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

export function prepareBarXSeries(args: PrepareSeriesArgs<BarXSeries>): PreparedSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend, yAxis} = args;

    const preparedSeries = seriesList.map<
        Omit<PreparedBarXSeries, 'stackBarPadding' | 'stackBarMaxWidth'>
    >((series) => {
        const name = series.name || '';
        const color = series.color || colorScale(name);
        const opacity = series.opacity ?? seriesOptions?.['bar-x']?.opacity ?? 1;
        const dataLabelsInside = series.stacking === 'percent';
        const yAxisIndex = get(series, 'yAxis', 0);

        return {
            type: series.type,
            color,
            opacity,
            name,
            id: getUniqId(),
            visible: get(series, 'visible', true),
            legend: {
                enabled: get(series, 'legend.enabled', legend.enabled),
                symbol: {...prepareLegendSymbol(series), opacity},
                groupId: series.legend?.groupId ?? getUniqId(),
                source: series.legend,
                itemText: series.legend?.itemText ?? name,
            },
            data: prepareSeriesData(series),
            stacking: series.stacking,
            grouping: series.grouping ?? true,
            barPadding:
                series.barPadding ??
                get(seriesOptions, 'bar-x.barPadding', seriesOptionsDefaults['bar-x'].barPadding),
            barMaxWidth:
                series.barMaxWidth ??
                get(seriesOptions, 'bar-x.barMaxWidth', seriesOptionsDefaults['bar-x'].barMaxWidth),
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
            cursor: get(series, 'cursor', null),
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
            custom: series.custom,
        };
    }, []);

    return resolveStackBarSizing(preparedSeries, getBarXStackKey);
}
