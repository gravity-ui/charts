import React from 'react';

import {Divider} from '@gravity-ui/uikit';
import parse from 'html-react-parser';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import {i18n} from '~core/i18n';
import {getSeriesPlugin} from '~core/series/seriesRegistry';
import {getFormattedValue} from '~core/utils/format';

import {usePrevious} from '../../../hooks';
import type {
    ChartTooltip,
    ChartXAxis,
    ChartYAxis,
    TooltipDataChunk,
    TooltipRowCellItem,
    ValueFormat,
} from '../../../types';
import {block} from '../../../utils';

import {Row} from './Row';
import {RowWithAggregation} from './RowWithAggregation';
import {getHoveredValues, getMeasureValue, getPreparedAggregation} from './utils';

const b = block('tooltip');

type Props = {
    hovered: TooltipDataChunk[];
    pinned?: boolean;
    rows?: ChartTooltip['rows'];
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
    rows,
    rowRenderer: tooltipRowRenderer,
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

    const getTooltipRowCellValue = ({
        cell,
        tooltipDataChunk,
    }: {
        cell: TooltipRowCellItem | undefined;
        tooltipDataChunk: TooltipDataChunk;
    }) => {
        if (!cell || !tooltipDataChunk) {
            return null;
        }

        if (typeof cell.source === 'function') {
            return cell.source({item: tooltipDataChunk});
        }

        return (
            get(tooltipDataChunk, cell.source) ??
            get(tooltipDataChunk, 'data.' + cell.source) ??
            get(tooltipDataChunk, 'series.' + cell.source)
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
            {visibleHovered.flatMap((seriesItem, chunkIndex) => {
                const {series, closest} = seriesItem;
                const seriesId = get(series, 'id');
                // TODO: improve active item display https://github.com/gravity-ui/charts/issues/208
                const active = closest && hovered.length > 1;
                // All rows from the same chunk share the same stripe state for visual grouping.
                const striped = (chunkIndex + 1) % 2 === 0;
                const rowValueFormat =
                    (get(seriesItem, 'data.tooltip.valueFormat') as ValueFormat | undefined) ??
                    (get(series, 'tooltip.valueFormat') as ValueFormat | undefined) ??
                    valueFormat;

                const plugin = series?.type ? getSeriesPlugin(series.type) : undefined;

                let tooltipRows = rows ?? plugin?.tooltip.rows ?? [];
                if (typeof tooltipRows === 'function') {
                    tooltipRows = tooltipRows(seriesItem);
                }

                return tooltipRows.map((row, rowIndex) => {
                    const rowCells: ReadonlyArray<TooltipRowCellItem> = row.cells ?? [];
                    const rowId = 'id' in row ? row.id : String(rowIndex);
                    const key = `${seriesId}_${chunkIndex}_${rowId}`;

                    const rowRenderer =
                        (rows ? rows[rowIndex]?.renderer : undefined) ?? tooltipRowRenderer;

                    if (typeof rowRenderer === 'function') {
                        const name = getTooltipRowCellValue({
                            cell: rowCells.find((c) => c.id === 'name'),
                            tooltipDataChunk: seriesItem,
                        });
                        const value = getTooltipRowCellValue({
                            cell: rowCells.find((c) => c.id === 'value'),
                            tooltipDataChunk: seriesItem,
                        });
                        const color = getTooltipRowCellValue({
                            cell: rowCells.find((c) => c.id === 'color'),
                            tooltipDataChunk: seriesItem,
                        });
                        const result = rowRenderer({
                            id: key,
                            name,
                            color,
                            value,
                            formattedValue: getFormattedValue({
                                value,
                                format: rowValueFormat,
                            }),
                            striped,
                            active,
                            className: b('content-row', {active, striped}),
                            hovered,
                        });

                        if (typeof result === 'string') {
                            return <React.Fragment key={key}>{parse(result)}</React.Fragment>;
                        }

                        return result as React.ReactElement | null;
                    }

                    const rowCellViewItems = rowCells.map((cell) => {
                        const cellValue = getTooltipRowCellValue({
                            cell,
                            tooltipDataChunk: seriesItem,
                        });
                        if (cellValue === undefined) {
                            return null;
                        }

                        const cellFormattedValue = getFormattedValue({
                            value: cellValue,
                            format:
                                cell.id === 'value' ? (cell.format ?? rowValueFormat) : cell.format,
                        });
                        return {
                            formattedValue: cellFormattedValue,
                            align: cell.align,
                            width: cell.width,
                        };
                    });

                    return (
                        <Row key={key} active={active} striped={striped} cells={rowCellViewItems} />
                    );
                });
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
