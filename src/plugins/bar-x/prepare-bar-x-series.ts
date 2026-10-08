import get from 'lodash/get';

import {DEFAULT_DATALABELS_STYLE, seriesRangeSliderOptionsDefaults} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import type {PrepareSeriesArgs, RefreshSourceReferencesArgs} from '~core/series/plugin';
import type {PreparedBarXSeries, PreparedSeries} from '~core/series/types';
import {getSeriesStackId, prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import {getUniqId} from '~core/utils';
import {getOriginalSeries, getOriginalSeriesData} from '~core/utils/series/sorting';

import type {BarXSeries, BarXSeriesData, BarXSeriesEvents} from '../../types';

interface PointClickSourceReferences {
    series: BarXSeries;
    data: BarXSeriesData[];
    pointClick: BarXSeriesEvents['pointClick'];
}

const pointClickSources = new WeakMap<
    NonNullable<PreparedBarXSeries['pointClick']>,
    PointClickSourceReferences
>();

function prepareSeriesData(
    series: BarXSeries,
    sourceData?: WeakMap<BarXSeriesData, BarXSeriesData>,
): BarXSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = series.data;
    switch (nullMode) {
        case 'zero':
            return data.map((p) => {
                const resolvedPoint = {...p, y: p.y ?? 0};
                sourceData?.set(resolvedPoint, p);
                return resolvedPoint;
            });
        case 'skip':
        default:
            return data;
    }
}

function prepareDataAndEvents(series: BarXSeries): Pick<PreparedBarXSeries, 'data' | 'pointClick'> {
    const originalSeries = getOriginalSeries(series);
    const configuredPointClick = originalSeries.events?.pointClick;
    const sourceData = configuredPointClick
        ? new WeakMap<BarXSeriesData, BarXSeriesData>()
        : undefined;
    const pointClick: PreparedBarXSeries['pointClick'] = configuredPointClick
        ? (point, event) => {
              configuredPointClick(
                  {
                      point: getOriginalSeriesData(sourceData?.get(point) ?? point),
                      series: originalSeries,
                  },
                  event,
              );
          }
        : undefined;

    if (pointClick) {
        pointClickSources.set(pointClick, {
            series: originalSeries,
            data: [...originalSeries.data],
            pointClick: configuredPointClick,
        });
    }

    return {data: prepareSeriesData(series, sourceData), pointClick};
}

export function refreshBarXSourceReferences({
    series,
    preparedSeries,
}: RefreshSourceReferencesArgs<BarXSeries>): PreparedSeries[] {
    return preparedSeries.map((prepared, index) => {
        const cached = prepared as PreparedBarXSeries;
        const currentSeries = series[index];
        if (!cached.pointClick || !currentSeries) {
            return prepared;
        }

        const sourceReferences = pointClickSources.get(cached.pointClick);
        const originalSeries = getOriginalSeries(currentSeries);
        if (
            sourceReferences?.series === originalSeries &&
            sourceReferences.pointClick === originalSeries.events?.pointClick &&
            sourceReferences.data.length === originalSeries.data.length &&
            sourceReferences.data.every(
                (point, dataIndex) => point === originalSeries.data[dataIndex],
            )
        ) {
            return prepared;
        }

        return {...cached, ...prepareDataAndEvents(currentSeries)};
    });
}

export function prepareBarXSeries(args: PrepareSeriesArgs<BarXSeries>): PreparedSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend, yAxis} = args;

    return seriesList.map<PreparedBarXSeries>((series) => {
        const name = series.name || '';
        const color = series.color || colorScale(name);
        const dataLabelsInside =
            series.stacking === 'percent' ? true : get(series, 'dataLabels.inside', false);
        const yAxisIndex = get(series, 'yAxis', 0);

        return {
            type: series.type,
            color,
            name,
            id: getUniqId(),
            visible: get(series, 'visible', true),
            legend: {
                enabled: get(series, 'legend.enabled', legend.enabled),
                symbol: prepareLegendSymbol(series),
                groupId: series.legend?.groupId ?? getUniqId(),
                itemText: series.legend?.itemText ?? name,
            },
            ...prepareDataAndEvents(series),
            stacking: series.stacking,
            stackLabels: series.stackLabels,
            stackId: getSeriesStackId(series),
            valueAxis: 'y',
            dataLabels: {
                enabled: series.dataLabels?.enabled || false,
                inside: dataLabelsInside,
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
}
