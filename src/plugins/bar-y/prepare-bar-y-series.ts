import get from 'lodash/get';

import {DEFAULT_DATALABELS_STYLE} from '~core/constants';
import type {PrepareSeriesArgs, RefreshSourceReferencesArgs} from '~core/series/plugin';
import type {PreparedBarYSeries, PreparedSeries} from '~core/series/types';
import {getSeriesStackId, prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import {getLabelsSize, getUniqId} from '~core/utils';
import {getFormattedValue} from '~core/utils/format';
import {getOriginalSeries, getOriginalSeriesData} from '~core/utils/series/sorting';

import type {BarYSeries, BarYSeriesData, BarYSeriesEvents} from '../../types';

const DEFAULT_LABEL_PADDING = 7;

interface PointClickSourceReferences {
    series: BarYSeries;
    data: BarYSeriesData[];
    pointClick: BarYSeriesEvents['pointClick'];
}

const pointClickSources = new WeakMap<
    NonNullable<PreparedBarYSeries['pointClick']>,
    PointClickSourceReferences
>();

function prepareSeriesData(
    series: BarYSeries,
    sourceData?: WeakMap<BarYSeriesData, BarYSeriesData>,
): BarYSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = series.data;
    switch (nullMode) {
        case 'zero':
            return data.map((p) => {
                const resolvedPoint = {...p, x: p.x ?? 0};
                sourceData?.set(resolvedPoint, p);
                return resolvedPoint;
            });
        case 'skip':
        default:
            return data;
    }
}

function prepareDataAndEvents(series: BarYSeries): Pick<PreparedBarYSeries, 'data' | 'pointClick'> {
    const originalSeries = getOriginalSeries(series);
    const configuredPointClick = originalSeries.events?.pointClick;
    const sourceData = configuredPointClick
        ? new WeakMap<BarYSeriesData, BarYSeriesData>()
        : undefined;
    const pointClick: PreparedBarYSeries['pointClick'] = configuredPointClick
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

export function refreshBarYSourceReferences({
    series,
    preparedSeries,
}: RefreshSourceReferencesArgs<BarYSeries>): PreparedSeries[] {
    return preparedSeries.map((prepared, index) => {
        const cached = prepared as PreparedBarYSeries;
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

async function prepareDataLabels(series: BarYSeries) {
    const enabled = get(series, 'dataLabels.enabled', false);
    const style = Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style);
    const html = get(series, 'dataLabels.html', false);
    // Percent labels are always inside the bars, so they do not affect axis padding.
    // Measure them during shape preparation, when the stack percentage is available.
    const labels =
        enabled && series.stacking !== 'percent'
            ? series.data.map((d) =>
                  getFormattedValue({
                      value: d.label ?? d.x,
                      format: series.dataLabels?.format,
                      context: {data: d},
                  }),
              )
            : [];
    const {maxHeight = 0, maxWidth = 0} = await getLabelsSize({
        labels,
        style,
        html,
    });
    const inside = series.stacking === 'percent' ? true : get(series, 'dataLabels.inside', false);
    const padding = enabled ? (series.dataLabels?.padding ?? DEFAULT_LABEL_PADDING) : 0;

    return {
        enabled,
        inside,
        style,
        maxHeight,
        maxWidth,
        html,
        format: series.dataLabels?.format,
        allowOverlap: series.dataLabels?.allowOverlap ?? false,
        padding,
    };
}

export function prepareBarYSeries(args: PrepareSeriesArgs<BarYSeries>) {
    const {colorScale, series: seriesList, seriesOptions, legend, xAxis} = args;

    return Promise.all(
        seriesList.map<Promise<PreparedBarYSeries>>(async (series) => {
            const name = series.name || '';
            const color = series.color || colorScale(name);

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
                valueAxis: 'x',
                dataLabels: await prepareDataLabels(series),
                cursor: get(series, 'cursor', null),
                borderRadius: series.borderRadius ?? seriesOptions?.['bar-y']?.borderRadius ?? 0,
                borderWidth: series.borderWidth ?? seriesOptions?.['bar-y']?.borderWidth ?? 0,
                borderColor:
                    series.borderColor ??
                    seriesOptions?.['bar-y']?.borderColor ??
                    'var(--gcharts-shape-border-color)',
                tooltip: {
                    ...series.tooltip,
                    valueFormat:
                        series.tooltip?.valueFormat ??
                        getDefaultValueFormat({axis: xAxis ?? undefined}),
                },
                custom: series.custom,
            };
        }),
    );
}
