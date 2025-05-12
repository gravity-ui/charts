import React from 'react';

import {dateTime} from '@gravity-ui/date-utils';
import get from 'lodash/get';

import type {PreparedPieSeries, PreparedRadarSeries, PreparedWaterfallSeries} from '../../hooks';
import {formatNumber} from '../../libs';
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
    WaterfallSeriesData,
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
        case 'datetime': {
            const value = get(data, fieldName);
            if (!value) {
                return undefined;
            }
            return dateTime({input: value}).format(DEFAULT_DATE_FORMAT);
        }
        case 'linear':
        default: {
            const value = get(data, fieldName) as unknown as number;
            return formatNumber(value);
        }
    }
};

const getXRowData = (data: ChartSeriesData, xAxis?: ChartXAxis) => getRowData('x', data, xAxis);

const getYRowData = (data: ChartSeriesData, yAxis?: ChartYAxis) => getRowData('y', data, yAxis);

const getMeasureValue = (data: TooltipDataChunk[], xAxis?: ChartXAxis, yAxis?: ChartYAxis) => {
    if (
        data.every((item) => ['pie', 'treemap', 'waterfall', 'sankey'].includes(item.series.type))
    ) {
        return null;
    }

    if (data.some((item) => item.series.type === 'radar')) {
        return (data[0] as TooltipDataChunkRadar).category?.key ?? null;
    }

    if (data.some((item) => item.series.type === 'bar-y')) {
        return getYRowData(data[0]?.data, yAxis);
    }

    return getXRowData(data[0]?.data, xAxis);
};

export const DefaultContent = ({hovered, xAxis, yAxis, valueFormat}: Props) => {
    const measureValue = getMeasureValue(hovered, xAxis, yAxis);

    return (
        <React.Fragment>
            {measureValue && <div>{measureValue}</div>}
            {hovered.map((seriesItem, i) => {
                const {data, series, closest} = seriesItem;
                const id = `${get(series, 'id')}_${i}`;
                const color = get(series, 'color');

                switch (series.type) {
                    case 'scatter':
                    case 'line':
                    case 'area':
                    case 'bar-x': {
                        const formattedValue = getFormattedValue({
                            value: getYRowData(data, yAxis),
                            format: valueFormat,
                        });
                        const value = (
                            <React.Fragment>
                                {series.name}: {formattedValue}
                            </React.Fragment>
                        );
                        return (
                            <div key={id} className={b('content-row')}>
                                <div className={b('color')} style={{backgroundColor: color}} />
                                <div>{closest ? <b>{value}</b> : <span>{value}</span>}</div>
                            </div>
                        );
                    }
                    case 'waterfall': {
                        const isTotal = get(data, 'total', false);
                        const subTotalValue = getWaterfallPointSubtotal(
                            data as WaterfallSeriesData,
                            series as PreparedWaterfallSeries,
                        );
                        const subTotal = getFormattedValue({
                            value: subTotalValue,
                            format: valueFormat,
                        });
                        const formattedValue = getFormattedValue({
                            value: getYRowData(data, yAxis),
                            format: valueFormat,
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
                        const formattedValue = getFormattedValue({
                            value: getXRowData(data, xAxis),
                            format: valueFormat,
                        });
                        const value = (
                            <React.Fragment>
                                {series.name}: {formattedValue}
                            </React.Fragment>
                        );
                        return (
                            <div key={id} className={b('content-row')}>
                                <div className={b('color')} style={{backgroundColor: color}} />
                                <div>{closest ? <b>{value}</b> : <span>{value}</span>}</div>
                            </div>
                        );
                    }
                    case 'pie':
                    case 'treemap': {
                        const seriesData = data as PreparedPieSeries | TreemapSeriesData;
                        const formattedValue = getFormattedValue({
                            value: seriesData.value,
                            format: valueFormat,
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
                            format: valueFormat,
                        });

                        return (
                            <div key={id} className={b('content-row')}>
                                <div
                                    className={b('color')}
                                    style={{backgroundColor: source.color}}
                                />
                                <div style={{display: 'flex', gap: 8, verticalAlign: 'center'}}>
                                    {source.name} <span>→</span> {target?.name}: {formattedValue}
                                </div>
                            </div>
                        );
                    }
                    case 'radar': {
                        const radarSeries = series as PreparedRadarSeries;
                        const seriesData = data as RadarSeriesData;
                        const formattedValue = getFormattedValue({
                            value: seriesData.value,
                            format: valueFormat,
                        });

                        const value = (
                            <React.Fragment>
                                <span>{radarSeries.name || radarSeries.id}&nbsp;</span>
                                <span>{formattedValue}</span>
                            </React.Fragment>
                        );

                        return (
                            <div key={id} className={b('content-row')}>
                                <div className={b('color')} style={{backgroundColor: color}} />
                                <div>{closest ? <b>{value}</b> : <span>{value}</span>}</div>
                            </div>
                        );
                    }
                    default: {
                        return null;
                    }
                }
            })}
        </React.Fragment>
    );
};
