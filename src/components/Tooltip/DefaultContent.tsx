import React from 'react';

import {dateTime} from '@gravity-ui/date-utils';
import get from 'lodash/get';

import type {PreparedAxis, PreparedPieSeries, PreparedWaterfallSeries} from '../../hooks';
import {formatNumber} from '../../libs';
import type {
    ChartSeriesData,
    TooltipDataChunk,
    TreemapSeriesData,
    WaterfallSeriesData,
} from '../../types';
import {block, getDataCategoryValue, getWaterfallPointSubtotal} from '../../utils';

const b = block('d3-tooltip');

type Props = {
    hovered: TooltipDataChunk[];
    xAxis: PreparedAxis;
    yAxis: PreparedAxis;
};

const DEFAULT_DATE_FORMAT = 'DD.MM.YY';

const getRowData = (fieldName: 'x' | 'y', axis: PreparedAxis, data: ChartSeriesData) => {
    switch (axis.type) {
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

const getXRowData = (xAxis: PreparedAxis, data: ChartSeriesData) => getRowData('x', xAxis, data);

const getYRowData = (yAxis: PreparedAxis, data: ChartSeriesData) => getRowData('y', yAxis, data);

const getMeasureValue = (data: TooltipDataChunk[], xAxis: PreparedAxis, yAxis: PreparedAxis) => {
    if (data.every((item) => ['pie', 'treemap', 'waterfall'].includes(item.series.type))) {
        return null;
    }

    if (data.some((item) => item.series.type === 'bar-y')) {
        return getYRowData(yAxis, data[0]?.data);
    }

    return getXRowData(xAxis, data[0]?.data);
};

export const DefaultContent = ({hovered, xAxis, yAxis}: Props) => {
    const measureValue = getMeasureValue(hovered, xAxis, yAxis);

    return (
        <React.Fragment>
            {measureValue && <div>{measureValue}</div>}
            {hovered.map(({data, series, closest}, i) => {
                const id = `${get(series, 'id')}_${i}`;
                const color = get(series, 'color');

                switch (series.type) {
                    case 'scatter':
                    case 'line':
                    case 'area':
                    case 'bar-x': {
                        const value = (
                            <React.Fragment>
                                {series.name}: {getYRowData(yAxis, data)}
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
                        const subTotal = getWaterfallPointSubtotal(
                            data as WaterfallSeriesData,
                            series as PreparedWaterfallSeries,
                        );

                        return (
                            <div key={`${id}_${get(data, 'x')}`}>
                                {!isTotal && (
                                    <React.Fragment>
                                        <div key={id} className={b('content-row')}>
                                            <b>{getXRowData(xAxis, data)}</b>
                                        </div>
                                        <div className={b('content-row')}>
                                            <span>{series.name}&nbsp;</span>
                                            <span>{getYRowData(yAxis, data)}</span>
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
                        const value = (
                            <React.Fragment>
                                {series.name}: {getXRowData(xAxis, data)}
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

                        return (
                            <div key={id} className={b('content-row')}>
                                <div className={b('color')} style={{backgroundColor: color}} />
                                <span>{seriesData.name || seriesData.id}&nbsp;</span>
                                <span>{seriesData.value}</span>
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
