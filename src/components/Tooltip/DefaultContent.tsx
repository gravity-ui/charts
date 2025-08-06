import React from 'react';

import get from 'lodash/get';

import type {
    PreparedPieSeries,
    PreparedRadarSeries,
    PreparedWaterfallSeries,
    PreparedWaterfallSeriesData,
} from '../../hooks';
import type {
    ChartSeriesData,
    ChartXAxis,
    ChartYAxis,
    RadarSeriesData,
    TooltipDataChunk,
    TooltipDataChunkRadar,
    TooltipDataChunkSankey,
    TreemapSeriesData,
    ValueFormat,
} from '../../types';
import {block, getDataCategoryValue, getWaterfallPointSubtotal} from '../../utils';
import {getFormattedValue} from '../../utils/chart/format';

const b = block('tooltip');

type Props = {
    hovered: TooltipDataChunk[];
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis;
    valueFormat?: ValueFormat;
};

const DEFAULT_DATE_FORMAT = 'DD.MM.YY';

const getRowData = (
    fieldName: 'x' | 'y',
    data: ChartSeriesData,
    axis?: ChartXAxis | ChartYAxis,
) => {
    switch (axis?.type) {
        case 'category': {
            const categories = get(axis, 'categories', [] as string[]);
            return getDataCategoryValue({axisDirection: fieldName, categories, data});
        }
        default: {
            return get(data, fieldName);
        }
    }
};

const getXRowData = (data: ChartSeriesData, xAxis?: ChartXAxis) => getRowData('x', data, xAxis);

const getYRowData = (data: ChartSeriesData, yAxis?: ChartYAxis) => getRowData('y', data, yAxis);

const getMeasureValue = ({
    data,
    xAxis,
    yAxis,
    valueFormat,
}: {
    data: TooltipDataChunk[];
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis;
    valueFormat?: ValueFormat;
}) => {
    if (
        data.every((item) => ['pie', 'treemap', 'waterfall', 'sankey'].includes(item.series.type))
    ) {
        return null;
    }

    if (data.some((item) => item.series.type === 'radar')) {
        return (data[0] as TooltipDataChunkRadar).category?.key ?? null;
    }

    if (data.some((item) => item.series.type === 'bar-y')) {
        const format = valueFormat ?? getDefaultValueFormat({axis: yAxis});
        return getFormattedValue({
            value: getYRowData(data[0]?.data, yAxis),
            format,
        });
    }

    const format = valueFormat ?? getDefaultValueFormat({axis: xAxis});
    return getFormattedValue({
        value: getXRowData(data[0]?.data, xAxis),
        format,
    });
};

function getDefaultValueFormat({axis}: {axis?: ChartXAxis | ChartYAxis}): ValueFormat | undefined {
    switch (axis?.type) {
        case 'linear':
        case 'logarithmic': {
            return {
                type: 'number',
            };
        }
        case 'datetime': {
            return {
                type: 'date',
                format: DEFAULT_DATE_FORMAT,
            };
        }
        default:
            return undefined;
    }
}

export const DefaultContent = ({hovered, xAxis, yAxis, valueFormat}: Props) => {
    const measureValue = getMeasureValue({data: hovered, xAxis, yAxis});

    return (
        <div className={b('content')}>
            {measureValue && <div className={b('series-name')}>{measureValue}</div>}
            {
                // eslint-disable-next-line complexity
                hovered.map((seriesItem, i) => {
                    const {data, series, closest} = seriesItem;
                    const id = `${get(series, 'id')}_${i}`;
                    const color = get(series, 'color');

                    switch (series.type) {
                        case 'scatter':
                        case 'line':
                        case 'area':
                        case 'bar-x': {
                            const format = valueFormat ?? getDefaultValueFormat({axis: yAxis});
                            const formattedValue = getFormattedValue({
                                value: getYRowData(data, yAxis),
                                format,
                            });
                            const value = (
                                <React.Fragment>
                                    {series.name}: {formattedValue}
                                </React.Fragment>
                            );
                            const active = closest && hovered.length > 1;
                            return (
                                <div key={id} className={b('content-row', {active})}>
                                    <div className={b('color')} style={{backgroundColor: color}} />
                                    <div>{value}</div>
                                </div>
                            );
                        }
                        case 'waterfall': {
                            const isTotal = get(data, 'total', false);
                            const subTotalValue = getWaterfallPointSubtotal(
                                data as PreparedWaterfallSeriesData,
                                series as PreparedWaterfallSeries,
                            );
                            const format = valueFormat ?? getDefaultValueFormat({axis: yAxis});
                            const subTotal = getFormattedValue({
                                value: subTotalValue,
                                format,
                            });
                            const formattedValue = getFormattedValue({
                                value: getYRowData(data, yAxis),
                                format,
                            });

                            return (
                                <div key={`${id}_${get(data, 'x')}`}>
                                    {!isTotal && (
                                        <React.Fragment>
                                            <div key={id} className={b('content-row')}>
                                                <b>{getXRowData(data, xAxis)}</b>
                                            </div>
                                            <div className={b('content-row')}>
                                                <span>{series.name}&nbsp;</span>
                                                <span>{formattedValue}</span>
                                            </div>
                                        </React.Fragment>
                                    )}
                                    <div key={id} className={b('content-row')}>
                                        {isTotal ? 'Total' : 'Subtotal'}: {subTotal}
                                    </div>
                                </div>
                            );
                        }
                        case 'bar-y': {
                            const format = valueFormat ?? getDefaultValueFormat({axis: xAxis});
                            const formattedValue = getFormattedValue({
                                value: getXRowData(data, xAxis),
                                format,
                            });
                            const value = (
                                <React.Fragment>
                                    {series.name}: {formattedValue}
                                </React.Fragment>
                            );
                            const active = closest && hovered.length > 1;
                            return (
                                <div key={id} className={b('content-row', {active})}>
                                    <div className={b('color')} style={{backgroundColor: color}} />
                                    <div>{value}</div>
                                </div>
                            );
                        }
                        case 'pie':
                        case 'treemap': {
                            const seriesData = data as PreparedPieSeries | TreemapSeriesData;
                            const formattedValue = getFormattedValue({
                                value: seriesData.value,
                                format: valueFormat ?? {type: 'number'},
                            });

                            return (
                                <div key={id} className={b('content-row')}>
                                    <div className={b('color')} style={{backgroundColor: color}} />
                                    <span>{seriesData.name || seriesData.id}&nbsp;</span>
                                    <span>{formattedValue}</span>
                                </div>
                            );
                        }
                        case 'sankey': {
                            const {target, data: source} = seriesItem as TooltipDataChunkSankey;
                            const value = source.links.find((d) => d.name === target?.name)?.value;
                            const formattedValue = getFormattedValue({
                                value,
                                format: valueFormat ?? {type: 'number'},
                            });

                            return (
                                <div key={id} className={b('content-row')}>
                                    <div
                                        className={b('color')}
                                        style={{backgroundColor: source.color}}
                                    />
                                    <div style={{display: 'flex', gap: 8, verticalAlign: 'center'}}>
                                        {source.name} <span>→</span> {target?.name}:{' '}
                                        {formattedValue}
                                    </div>
                                </div>
                            );
                        }
                        case 'radar': {
                            const radarSeries = series as PreparedRadarSeries;
                            const seriesData = data as RadarSeriesData;
                            const formattedValue = getFormattedValue({
                                value: seriesData.value,
                                format: valueFormat ?? {type: 'number'},
                            });

                            const value = (
                                <React.Fragment>
                                    <span>{radarSeries.name || radarSeries.id}&nbsp;</span>
                                    <span>{formattedValue}</span>
                                </React.Fragment>
                            );
                            const active = closest && hovered.length > 1;
                            return (
                                <div key={id} className={b('content-row', {active})}>
                                    <div className={b('color')} style={{backgroundColor: color}} />
                                    <div>{value}</div>
                                </div>
                            );
                        }
                        default: {
                            return null;
                        }
                    }
                })
            }
        </div>
    );
};
