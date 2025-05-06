import React from 'react';

import {dateTime} from '@gravity-ui/date-utils';
import get from 'lodash/get';

import type {PreparedPieSeries, PreparedRadarSeries, PreparedWaterfallSeries} from '../../hooks';
import {formatNumber} from '../../libs';
import type {
    ChartSeriesData,
    ChartXAxis,
    ChartYAxis,
    TooltipDataChunk,
    TooltipDataChunkSankey,
    TreemapSeriesData,
    WaterfallSeriesData,
} from '../../types';
import {block, getDataCategoryValue, getWaterfallPointSubtotal} from '../../utils';

const b = block('tooltip');

type Props = {
    hovered: TooltipDataChunk[];
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis;
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
        data.every((item) =>
            ['pie', 'treemap', 'waterfall', 'sankey', 'radar'].includes(item.series.type),
        )
    ) {
        return null;
    }

    if (data.some((item) => item.series.type === 'bar-y')) {
        return getYRowData(data[0]?.data, yAxis);
    }

    return getXRowData(data[0]?.data, xAxis);
};

export const DefaultContent = ({hovered, xAxis, yAxis}: Props) => {
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
                        const value = (
                            <React.Fragment>
                                {series.name}: {getYRowData(data, yAxis)}
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
                                            <b>{getXRowData(data, xAxis)}</b>
                                        </div>
                                        <div className={b('content-row')}>
                                            <span>{series.name}&nbsp;</span>
                                            <span>{getYRowData(data, yAxis)}</span>
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
                                {series.name}: {getXRowData(data, xAxis)}
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
                    case 'sankey': {
                        const {target, data: source} = seriesItem as TooltipDataChunkSankey;
                        const value = source.links.find((d) => d.name === target?.name)?.value;

                        return (
                            <div key={id} className={b('content-row')}>
                                <div
                                    className={b('color')}
                                    style={{backgroundColor: source.color}}
                                />
                                <div style={{display: 'flex', gap: 8, verticalAlign: 'center'}}>
                                    {source.name} <span>→</span> {target?.name}: {value}
                                </div>
                            </div>
                        );
                    }
                    case 'radar': {
                        const seriesData = data as PreparedRadarSeries;

                        return (
                            <React.Fragment>
                                <div key={id} className={b('content-row')}>
                                    <div className={b('color')} style={{backgroundColor: color}} />
                                    <b>{seriesData.name || seriesData.id}&nbsp;</b>
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, auto)',
                                        gridColumnGap: '8px',
                                        marginTop: '4px',
                                    }}
                                >
                                    {seriesData.data.map((d, index) => (
                                        <React.Fragment key={`${id}-data-${index}`}>
                                            <div>{seriesData.categories[index].key}</div>
                                            <div style={{textAlign: 'right'}}>{d.value}</div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </React.Fragment>
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
