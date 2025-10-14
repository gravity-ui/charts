import React from 'react';

import {Divider} from '@gravity-ui/uikit';
import get from 'lodash/get';

import type {PreparedPieSeries, PreparedRadarSeries} from '../../../hooks';
import type {
    ChartTooltip,
    ChartTooltipRowRendererArgs,
    ChartXAxis,
    ChartYAxis,
    TooltipDataChunk,
    TooltipDataChunkSankey,
    TooltipDataChunkWaterfall,
    TreemapSeriesData,
    ValueFormat,
} from '../../../types';
import {block} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';

import {Row} from './Row';
import {RowTotals} from './RowTotals';
import {
    getDefaultValueFormat,
    getHoveredValues,
    getMeasureValue,
    getPreparedAggregation,
    getXRowData,
} from './utils';

const b = block('tooltip');

type Props = {
    hovered: TooltipDataChunk[];
    totals?: ChartTooltip['totals'];
    valueFormat?: ValueFormat;
    headFormat?: ChartTooltip['headFormat'];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
    rowRenderer?: ChartTooltip['rowRenderer'];
};

export const DefaultTooltipContent = ({
    hovered,
    xAxis,
    yAxis,
    valueFormat,
    headFormat,
    totals,
    rowRenderer,
}: Props) => {
    const measureValue = getMeasureValue({data: hovered, xAxis, yAxis});
    const hoveredValues = getHoveredValues({hovered, xAxis, yAxis});

    const renderRow = ({
        id,
        name,
        color,
        active,
        striped,
        value,
        formattedValue,
    }: ChartTooltipRowRendererArgs) => {
        if (typeof rowRenderer === 'function') {
            return rowRenderer({
                id,
                name,
                color,
                value,
                formattedValue,
                striped,
                active,
                className: b('content-row', {active, striped}),
                hovered,
            });
        }

        return (
            <Row
                key={id}
                active={active}
                color={color}
                label={<span dangerouslySetInnerHTML={{__html: name}} />}
                striped={striped}
                value={formattedValue}
            />
        );
    };

    const formattedHeadValue = headFormat
        ? getFormattedValue({value: measureValue, format: headFormat})
        : measureValue;

    return (
        <div className={b('content')}>
            {formattedHeadValue && (
                <div
                    className={b('series-name')}
                    dangerouslySetInnerHTML={{__html: formattedHeadValue}}
                />
            )}
            {
                // eslint-disable-next-line complexity
                hovered.map((seriesItem, i) => {
                    const {data, series, closest} = seriesItem;
                    const id = `${get(series, 'id')}_${i}`;
                    const color = get(data, 'color') || get(series, 'color');
                    const active = closest && hovered.length > 1;
                    const striped = (i + 1) % 2 === 0;
                    const rowValueFormat = get(series, 'tooltip.valueFormat', valueFormat);

                    switch (series.type) {
                        case 'scatter':
                        case 'line':
                        case 'area':
                        case 'bar-x': {
                            const format = rowValueFormat || getDefaultValueFormat({axis: yAxis});
                            const formattedValue = getFormattedValue({
                                value: hoveredValues[i],
                                format,
                            });

                            return renderRow({
                                id,
                                active,
                                color,
                                name: series.name,
                                striped,
                                value: hoveredValues[i],
                                formattedValue,
                            });
                        }
                        case 'waterfall': {
                            const isTotal = get(data, 'total', false);
                            const subTotalValue =
                                (seriesItem as TooltipDataChunkWaterfall).subTotal ?? 0;
                            const format = rowValueFormat || getDefaultValueFormat({axis: yAxis});
                            const subTotal = getFormattedValue({
                                value: subTotalValue,
                                format,
                            });
                            const formattedValue = getFormattedValue({
                                value: hoveredValues[i],
                                format,
                            });

                            return (
                                <React.Fragment key={id}>
                                    {!isTotal && (
                                        <React.Fragment>
                                            <div className={b('series-name')}>
                                                {getXRowData(data, xAxis)}
                                            </div>
                                            <Row label={series.name} value={formattedValue} />
                                        </React.Fragment>
                                    )}
                                    <Row label={isTotal ? 'Total' : 'Subtotal'} value={subTotal} />
                                </React.Fragment>
                            );
                        }
                        case 'bar-y': {
                            const format = rowValueFormat || getDefaultValueFormat({axis: xAxis});
                            const formattedValue = getFormattedValue({
                                value: hoveredValues[i],
                                format,
                            });

                            return renderRow({
                                id,
                                active,
                                color,
                                name: series.name,
                                striped,
                                value: hoveredValues[i],
                                formattedValue,
                            });
                        }
                        case 'pie':
                        case 'treemap': {
                            const seriesData = data as PreparedPieSeries | TreemapSeriesData;
                            const formattedValue = getFormattedValue({
                                value: hoveredValues[i],
                                format: rowValueFormat || {type: 'number'},
                            });

                            return renderRow({
                                id,
                                color,
                                name: [seriesData.name || seriesData.id].flat().join('\n'),
                                value: hoveredValues[i],
                                formattedValue,
                            });
                        }
                        case 'sankey': {
                            const {target, data: source} = seriesItem as TooltipDataChunkSankey;
                            const formattedValue = getFormattedValue({
                                value: hoveredValues[i],
                                format: rowValueFormat || {type: 'number'},
                            });

                            return renderRow({
                                id,
                                color,
                                name: `${source.name} → ${target?.name}`,
                                value: hoveredValues[i],
                                formattedValue,
                            });
                        }
                        case 'radar': {
                            const radarSeries = series as PreparedRadarSeries;
                            const formattedValue = getFormattedValue({
                                value: hoveredValues[i],
                                format: rowValueFormat || {type: 'number'},
                            });

                            return renderRow({
                                id,
                                color,
                                active,
                                name: radarSeries.name || radarSeries.id,
                                value: hoveredValues[i],
                                formattedValue,
                            });
                        }
                        default: {
                            return null;
                        }
                    }
                })
            }
            {totals?.enabled && hovered.length > 1 && (
                <React.Fragment>
                    <Divider className={b('content-row-totals-divider')} />
                    <RowTotals
                        aggregation={getPreparedAggregation({hovered, totals, xAxis, yAxis})}
                        label={totals.label}
                        values={hoveredValues}
                        valueFormat={totals.valueFormat ?? valueFormat}
                    />
                </React.Fragment>
            )}
        </div>
    );
};
