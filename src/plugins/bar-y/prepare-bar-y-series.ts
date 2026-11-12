import get from 'es-toolkit/compat/get';

import {DEFAULT_DATALABELS_STYLE} from '~core/constants';
import type {PrepareSeriesArgs} from '~core/series/plugin';
import {prepareSeriesMetadata} from '~core/series/prepare-series-metadata';
import {getSeriesStackId, prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import type {ChartSeriesOptions} from '~core/types';
import {getLabelsSize, getUniqId} from '~core/utils';
import {getFormattedValue} from '~core/utils/format';
import {hasOutsideOnlyPlacement} from '~core/utils/rect-label-placement';
import {withSourcePoint} from '~core/utils/source-point';

import type {BarYSeries, BarYSeriesData} from '../../types';
import {resolveBarLabelPlacement} from '../bar-label-placement';
import {resolveStackBarSizing} from '../bar-sizing';

import {barYDefaults} from './defaults';
import type {PreparedBarYSeries} from './prepared-series';

const DEFAULT_LABEL_PADDING = 7;

function prepareSeriesData(series: BarYSeries): BarYSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = series.data;
    switch (nullMode) {
        case 'zero':
            return data.map((p) => withSourcePoint(p, {...p, x: p.x ?? 0}));
        case 'skip':
        default:
            return data;
    }
}

async function prepareDataLabels(series: BarYSeries) {
    const enabled = get(series, 'dataLabels.enabled', false);
    const style = Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style);
    const html = get(series, 'dataLabels.html', false);
    const placement = resolveBarLabelPlacement(series.dataLabels?.placement);
    // Percent labels need the resolved share and never reserve axis space.
    const labels =
        enabled &&
        series.stacking !== 'percent' &&
        (placement === undefined || hasOutsideOnlyPlacement(placement))
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
    const inside = series.stacking === 'percent';
    const padding =
        enabled || placement !== undefined
            ? (series.dataLabels?.padding ?? DEFAULT_LABEL_PADDING)
            : 0;

    return {
        enabled,
        inside,
        placement,
        placementFallback: series.dataLabels?.placementFallback ?? 'show',
        style,
        maxHeight,
        maxWidth,
        html,
        format: series.dataLabels?.format,
        allowOverlap: series.dataLabels?.allowOverlap ?? false,
        padding,
    };
}

export async function prepareBarYSeries(args: PrepareSeriesArgs<BarYSeries, ChartSeriesOptions>) {
    const {colorScale, series: seriesList, seriesOptions, legend, xAxis} = args;

    const preparedSeries = await Promise.all(
        seriesList.map<Promise<Omit<PreparedBarYSeries, 'stackBarPadding' | 'stackBarMaxWidth'>>>(
            async (series) => {
                const name = series.name || '';
                const color = series.color || colorScale(name);
                const opacity = series.opacity ?? seriesOptions?.['bar-y']?.opacity ?? 1;

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
                        get(seriesOptions, 'bar-y.barPadding', barYDefaults.barPadding),
                    barMaxWidth:
                        series.barMaxWidth ??
                        get(seriesOptions, 'bar-y.barMaxWidth', barYDefaults.barMaxWidth),
                    stackLabels: series.stackLabels,
                    // Non-stacked overlays need independent domains even with a stackId.
                    stackId: getSeriesStackId(series),
                    resolvedStackId:
                        series.grouping === false && !series.stacking ? getUniqId() : undefined,
                    valueAxis: 'x',
                    dataLabels: await prepareDataLabels(series),
                    borderRadius:
                        series.borderRadius ?? seriesOptions?.['bar-y']?.borderRadius ?? 0,
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
                };
            },
        ),
    );

    return resolveStackBarSizing(preparedSeries, getSeriesStackId);
}
