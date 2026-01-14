import React from 'react';

import {Divider} from '@gravity-ui/uikit';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import {usePrevious} from '../../../hooks';
import type {PreparedFunnelSeries, PreparedPieSeries, PreparedRadarSeries} from '../../../hooks';
import {i18n} from '../../../i18n';
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
import {block, hasVerticalScrollbar} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';

import {Row} from './Row';
import {RowWithAggregation} from './RowWithAggregation';
import {
    getDefaultValueFormat,
    getHoveredValues,
    getMeasureValue,
    getPreparedAggregation,
    getTooltipRowColorSymbol,
    getXRowData,
} from './utils';

const b = block('tooltip');

type Props = {
    hovered: TooltipDataChunk[];
    pinned?: boolean;
    rowRenderer?: ChartTooltip['rowRenderer'];
    totals?: ChartTooltip['totals'];
    valueFormat?: ValueFormat;
    headerFormat?: ChartTooltip['headerFormat'];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
    qa?: string;
};

export const DefaultTooltipContent = ({
    hovered,
    pinned,
    rowRenderer,
    totals,
    valueFormat,
    headerFormat,
    xAxis,
    yAxis,
    qa,
}: Props) => {
    const [visibleRows, setVisibleRows] = React.useState<number | undefined>();
    const [maxContentRowsHeight, setMaxContentRowsHeight] = React.useState<number | undefined>();
    const [scrollBarWidth, setScrollBarWidth] = React.useState<number>(0);
    const contentRowsRef = React.useRef<HTMLDivElement>(null);
    const measureValue = getMeasureValue({data: hovered, xAxis, yAxis, headerFormat});
    const hoveredValues = getHoveredValues({hovered, xAxis, yAxis});
    const prevHoveredValues = usePrevious(hoveredValues);
    const visibleHovered = pinned || !visibleRows ? hovered : hovered.slice(0, visibleRows);
    const restHoveredValues = pinned || !visibleRows ? [] : hoveredValues.slice(visibleRows);

    const renderRow = ({
        id,
        name,
        color,
        active,
        striped,
        value,
        formattedValue,
        series,
    }: ChartTooltipRowRendererArgs & {series?: TooltipDataChunk['series']}) => {
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

        const colorSymbol = getTooltipRowColorSymbol({series, color});

        return (
            <Row
                key={id}
                active={active}
                color={color}
                colorSymbol={
                    colorSymbol ? (
                        <div dangerouslySetInnerHTML={{__html: colorSymbol.outerHTML}} />
                    ) : undefined
                }
                label={<span dangerouslySetInnerHTML={{__html: name}} />}
                striped={striped}
                value={formattedValue}
            />
        );
    };

    const formattedHeadValue = headerFormat
        ? getFormattedValue({
              value: measureValue?.value,
              format: headerFormat,
          })
        : measureValue?.formattedValue;

    React.useEffect(() => {
        if (!contentRowsRef.current) {
            return;
        }

        if (!hasVerticalScrollbar(contentRowsRef.current)) {
            return;
        }

        if (!isEqual(hoveredValues, prevHoveredValues)) {
            const {clientHeight} = contentRowsRef.current;
            const {top: containerTop} = contentRowsRef.current.getBoundingClientRect();
            const rows = contentRowsRef.current.querySelectorAll(`.${b('content-row')}`);
            let nextVisibleRows = 0;
            let nextMaxContentRowsHeight = 0;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const {top, height} = row.getBoundingClientRect();

                if (top - containerTop + height <= clientHeight) {
                    nextVisibleRows += 1;
                    nextMaxContentRowsHeight += height;
                } else {
                    break;
                }
            }

            setVisibleRows(nextVisibleRows - 1);
            setMaxContentRowsHeight(nextMaxContentRowsHeight);
        }
    }, [hoveredValues, prevHoveredValues]);

    React.useEffect(() => {
        if (!contentRowsRef.current) {
            return;
        }

        if (pinned) {
            const {offsetWidth, clientWidth} = contentRowsRef.current;
            setScrollBarWidth(offsetWidth - clientWidth);
        } else {
            setScrollBarWidth(0);
        }
    }, [pinned]);

    return (
        <div className={b('content')} data-qa={qa}>
            {formattedHeadValue && (
                <div
                    className={b('series-name')}
                    dangerouslySetInnerHTML={{__html: formattedHeadValue}}
                />
            )}
            <div
                className={b('content-rows', {pinned})}
                ref={contentRowsRef}
                style={{maxHeight: maxContentRowsHeight}}
            >
                {/* eslint-disable-next-line complexity */}
                {visibleHovered.map((seriesItem, i) => {
                    const {data, series, closest} = seriesItem;
                    const id = `${get(series, 'id')}_${i}`;
                    const color = get(data, 'color') || get(series, 'color');
                    // TODO: improve action item display https://github.com/gravity-ui/charts/issues/208
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
                                series,
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
                        case 'heatmap':
                        case 'treemap':
                        case 'funnel': {
                            const seriesData = data as
                                | PreparedPieSeries
                                | TreemapSeriesData
                                | PreparedFunnelSeries;
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
                })}
                {Boolean(restHoveredValues.length) && (
                    <Row
                        label={i18n('tooltip', 'label_more', {count: restHoveredValues.length})}
                        striped={(visibleHovered.length + 1) % 2 === 0}
                    />
                )}
            </div>
            {totals?.enabled && hovered.length > 1 && (
                <React.Fragment>
                    <Divider className={b('content-row-totals-divider')} />
                    <RowWithAggregation
                        aggregation={getPreparedAggregation({hovered, totals, xAxis, yAxis})}
                        label={totals.label}
                        style={{marginRight: scrollBarWidth}}
                        values={hoveredValues}
                        valueFormat={totals.valueFormat ?? valueFormat}
                    />
                </React.Fragment>
            )}
        </div>
    );
};
