import React from 'react';

import {Divider} from '@gravity-ui/uikit';
import parse from 'html-react-parser';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import {i18n} from '~core/i18n';
import {getFormattedValue} from '~core/utils/format';

import {usePrevious} from '../../../hooks';
import type {PreparedFunnelSeries, PreparedPieSeries, PreparedRadarSeries} from '../../../hooks';
import type {
    ChartTooltip,
    ChartTooltipRowRendererArgs,
    ChartXAxis,
    ChartYAxis,
    TooltipDataChunk,
    TooltipDataChunkGauge,
    TooltipDataChunkSankey,
    TooltipDataChunkWaterfall,
    TreemapSeriesData,
    ValueFormat,
    XRangeSeriesData,
} from '../../../types';
import {block} from '../../../utils';

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
            const result = rowRenderer({
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

            if (typeof result === 'string') {
                return <React.Fragment key={id}>{parse(result)}</React.Fragment>;
            }

            return result;
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

    let formattedHeadValue: string | undefined;
    if (measureValue) {
        formattedHeadValue = headerFormat
            ? getFormattedValue({
                  value: measureValue.value,
                  format: headerFormat,
              })
            : measureValue.formattedValue;
    }

    React.useEffect(() => {
        if (!contentRowsRef.current) {
            return;
        }

        if (isEqual(hoveredValues, prevHoveredValues)) {
            return;
        }

        const {scrollHeight, clientHeight} = contentRowsRef.current;

        if (scrollHeight <= clientHeight) {
            return;
        }

        const nextVisibleRows = Math.floor(hovered.length * (clientHeight / scrollHeight));
        setVisibleRows(Math.max(nextVisibleRows - 1, 1));
        setMaxContentRowsHeight((scrollHeight / hovered.length) * nextVisibleRows);
    }, [hovered.length, hoveredValues, prevHoveredValues]);

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

    const rowsContent = (
        <React.Fragment>
            {visibleHovered.map((seriesItem, i) => {
                const {data, series, closest} = seriesItem;
                const id = `${get(series, 'id')}_${i}`;
                const color = get(data, 'color') || get(series, 'color');
                // TODO: improve active item display https://github.com/gravity-ui/charts/issues/208
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
                    case 'x-range': {
                        const xRangeData = data as XRangeSeriesData;
                        const format = rowValueFormat || getDefaultValueFormat({axis: xAxis});
                        const x0Formatted = getFormattedValue({
                            value: xRangeData.x0,
                            format,
                        });
                        const x1Formatted = getFormattedValue({
                            value: xRangeData.x1,
                            format,
                        });

                        return renderRow({
                            id,
                            active,
                            color,
                            name: series.name,
                            striped,
                            value: hoveredValues[i],
                            formattedValue: `${x0Formatted} — ${x1Formatted}`,
                            series,
                        });
                    }
                    case 'gauge': {
                        const gaugeData = (seriesItem as TooltipDataChunkGauge).data;
                        const zoneColor = gaugeData.zoneColor ?? get(series, 'color');
                        const valueWithUnit = gaugeData.unit
                            ? `${gaugeData.value} ${gaugeData.unit}`
                            : String(gaugeData.value);
                        // Empty spacer keeps the color column consistent across all gauge rows
                        const emptyColorCell = (
                            <span style={{display: 'inline-block', width: 8, height: 8}} />
                        );

                        return (
                            <React.Fragment key={id}>
                                {renderRow({
                                    id,
                                    color: zoneColor,
                                    name: series.name,
                                    value: gaugeData.value,
                                    formattedValue: valueWithUnit,
                                    series,
                                })}
                                {gaugeData.zoneLabel && (
                                    <Row
                                        colorSymbol={emptyColorCell}
                                        label={gaugeData.zoneLabel}
                                        value={
                                            gaugeData.zoneMin !== undefined &&
                                            gaugeData.zoneMax !== undefined
                                                ? `${gaugeData.zoneMin} – ${gaugeData.zoneMax}`
                                                : undefined
                                        }
                                    />
                                )}
                                {gaugeData.distanceToTarget !== undefined && (
                                    <Row
                                        colorSymbol={emptyColorCell}
                                        label="vs target"
                                        value={
                                            gaugeData.distanceToTarget > 0
                                                ? `+${gaugeData.distanceToTarget}`
                                                : String(gaugeData.distanceToTarget)
                                        }
                                    />
                                )}
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

    return (
        <div className={b('content')} data-qa={qa}>
            {formattedHeadValue && (
                <div className={b('series-name')}>
                    {/* Wrapper isolates ellipsis styles so they don't break flex layout and row count calculation */}
                    <div
                        className={b('series-name-text')}
                        dangerouslySetInnerHTML={{__html: formattedHeadValue}}
                    />
                </div>
            )}
            <div
                className={b('content-rows', {pinned})}
                ref={contentRowsRef}
                style={pinned ? {maxHeight: maxContentRowsHeight} : undefined}
            >
                <table className={b('content-rows-table')}>
                    <tbody>{rowsContent}</tbody>
                </table>
            </div>
            {Boolean(restHoveredValues.length) && (
                <div
                    className={b('content-row', {
                        striped: (visibleHovered.length + 1) % 2 === 0,
                    })}
                >
                    {i18n('tooltip', 'label_more', {count: restHoveredValues.length})}
                </div>
            )}
            {totals?.enabled && hovered.length > 1 && (
                <React.Fragment>
                    <Divider className={b('content-row-totals-divider')} />
                    <RowWithAggregation
                        aggregation={getPreparedAggregation({
                            hovered,
                            totals,
                            xAxis,
                            yAxis,
                        })}
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
