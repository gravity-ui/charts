import React from 'react';

import type {AxisDomain, AxisScale} from 'd3-axis';
import {scaleLinear} from 'd3-scale';
import type {BaseType, Selection} from 'd3-selection';
import {select} from 'd3-selection';
import {symbol} from 'd3-shape';

import {CONTINUOUS_LEGEND_SIZE} from '~core/constants';
import {
    createGradientRect,
    createLineSymbol,
    getContinuesColorFn,
    getSymbol,
    getTextSizeFn,
    getUniqId,
} from '~core/utils';
import {axisBottom} from '~core/utils/axis-generators';

import type {
    LegendItem,
    OnLegendItemClick,
    PreparedLegend,
    PreparedLegendRow,
    PreparedSeries,
    SymbolLegendSymbol,
} from '../../hooks';
import {formatNumber} from '../../libs';
import type {LegendConfig} from '../../types';
import {block} from '../../utils';

import './styles.scss';

const b = block('legend');

type Props = {
    chartSeries: PreparedSeries[];
    legend: PreparedLegend;
    items: LegendItem[][] | undefined;
    config: LegendConfig;
    htmlLayout: HTMLElement | null;
    onItemClick: OnLegendItemClick;
    onUpdate?: () => void;
};

const getLegendPosition = (args: {
    contentWidth: number;
    width: number;
    offsetLeft: number;
    offsetTop: number;
}) => {
    const {offsetLeft, offsetTop, contentWidth, width} = args;

    return {top: offsetTop, left: offsetLeft + width / 2 - contentWidth / 2};
};

async function appendPaginator(args: {
    container: Selection<SVGGElement, unknown, null, undefined>;
    pageIndex: number;
    legend: PreparedLegend;
    transform: string;
    pages: NonNullable<LegendConfig['pagination']>['pages'];
    onArrowClick: (nextPageIndex: number) => void;
}) {
    const {container, pageIndex, legend, transform, pages, onArrowClick} = args;
    const paginationLine = container.append('g').attr('class', b('pagination'));
    const maxPage = pages.length;
    const paginationCounterText = `${pageIndex + 1}/${maxPage}`;

    const getTextSize = getTextSizeFn({style: legend.itemStyle});
    const [arrowIcon, counter] = await Promise.all([
        getTextSize('▲'),
        getTextSize(paginationCounterText),
    ]);

    const appendArrow = (text: string, x: number, nextPageIndex: number) => {
        const inactive = nextPageIndex < 0 || nextPageIndex >= maxPage;
        const arrow = paginationLine
            .append('g')
            .attr('class', b('pagination-arrow', {inactive}))
            .attr('transform', `translate(${x}, 0)`)
            .on('click', () => {
                if (!inactive) {
                    onArrowClick(nextPageIndex);
                }
            });
        arrow
            .append('rect')
            .attr('y', -legend.lineHeight / 2)
            .attr('width', arrowIcon.width)
            .attr('height', legend.lineHeight)
            .attr('fill', 'transparent');
        arrow
            .append('text')
            .text(text)
            .style('font-size', legend.itemStyle.fontSize)
            .style('dominant-baseline', 'middle');
    };
    appendArrow('▲', 0, pageIndex - 1);
    paginationLine
        .append('text')
        .text(paginationCounterText)
        .attr('class', b('pagination-counter'))
        .attr('x', arrowIcon.width)
        .style('font-size', legend.itemStyle.fontSize);
    appendArrow('▼', arrowIcon.width + counter.width, pageIndex + 1);
    paginationLine.attr('transform', transform);
    return paginationLine;
}

function renderLegendSymbol(args: {
    selection: Selection<SVGGElement, LegendItem, BaseType, unknown>;
    row: PreparedLegendRow;
}) {
    const {selection, row} = args;
    const legendLineHeight = row.height;
    selection.each(function (d, i) {
        const element = select(this);
        const x = row.items[i].symbolLeft;
        const className = b('item-symbol', {shape: d.symbol.shape, unselected: !d.visible});
        const color = d.visible ? d.color : '';
        const symbolType = (d.symbol as SymbolLegendSymbol).symbolType;
        const scatterSymbol = getSymbol(symbolType);

        switch (d.symbol.shape) {
            case 'path': {
                createLineSymbol({
                    container: element.node(),
                    x,
                    height: legendLineHeight,
                    width: d.symbol.bboxWidth,
                    color,
                    className,
                    dashStyle: d.dashStyle,
                    lineWidth: d.symbol.strokeWidth,
                });

                break;
            }
            case 'rect': {
                const y = (legendLineHeight - d.symbol.height) / 2;
                element
                    .append('rect')
                    .attr('x', x)
                    .attr('y', y)
                    .attr('width', d.symbol.bboxWidth)
                    .attr('height', d.symbol.height)
                    .attr('rx', d.symbol.radius)
                    .attr('class', className)
                    .style('fill', color);

                break;
            }
            case 'symbol': {
                const symbolAreaSize = Math.pow(d.symbol.width, 2);
                const bboxWidth = d.symbol.bboxWidth;
                const translateX = x + bboxWidth / 2;
                const translateY = legendLineHeight / 2;

                element
                    .append('svg:path')
                    .attr('d', () => symbol(scatterSymbol, symbolAreaSize)())
                    .attr('transform', 'translate(' + translateX + ',' + translateY + ')')
                    .attr('class', className)
                    .style('fill', color);

                break;
            }
        }
    });
}

export const Legend = (props: Props) => {
    const {chartSeries, legend, items = [], config, htmlLayout, onItemClick, onUpdate} = props;
    const ref = React.useRef<SVGGElement>(null);
    const pageCount = config.pagination?.pages.length ?? 1;
    const [paginationState, setPaginationState] = React.useState({
        pageIndex: 0,
        maxWidth: config.maxWidth,
        pageCount,
    });
    const currentPageIndex =
        paginationState.maxWidth === config.maxWidth
            ? Math.min(paginationState.pageIndex, Math.max(0, pageCount - 1))
            : 0;

    // Adjust before rendering a changed page set so a removed page cannot return on resize.
    if (paginationState.maxWidth !== config.maxWidth || paginationState.pageCount !== pageCount) {
        setPaginationState({pageIndex: currentPageIndex, maxWidth: config.maxWidth, pageCount});
    }

    React.useEffect(() => {
        async function prepareLegend() {
            if (!ref.current || !htmlLayout) {
                return;
            }

            const svgElement = select(ref.current);
            svgElement.selectAll('*').remove();
            svgElement.style('opacity', 0);

            const isMac = navigator.platform.toUpperCase().includes('MAC');

            const htmlElement = select(htmlLayout);
            htmlElement.selectAll('[data-legend]').remove();
            const htmlContainer = legend.html
                ? htmlElement.append('div').attr('data-legend', 1).style('position', 'absolute')
                : null;

            let legendWidth = 0;
            let legendLeft = 0;
            let legendTop = 0;
            if (legend.type === 'discrete') {
                const page = config.pagination?.pages[currentPageIndex];
                const start = page?.start ?? 0;
                const pageItems = page ? items.slice(start, page.end) : items;
                const pageRows = page ? legend.rows.slice(start, page.end) : legend.rows;
                const pageTop = page ? legend.rows[start].top : 0;
                const titleHeight = legend.title.height + legend.title.margin;
                const pagination =
                    legend.height - titleHeight >= legend.lineHeight
                        ? config.pagination
                        : undefined;
                let contentHeight = legend.height;
                const svgItems = svgElement.append('g');
                pageItems.forEach((line, lineIndex) => {
                    const row = legend.rows[start + lineIndex];
                    const legendLine = svgItems.append('g').attr('class', b('line'));
                    const htmlLegendLine = htmlContainer
                        ?.append('div')
                        .style('position', 'absolute');
                    const legendItemTemplate = legendLine
                        .selectAll('legend-history')
                        .data(line)
                        .enter()
                        .append('g')
                        .attr('class', b('item'))
                        .on('click', function (e, d) {
                            onItemClick({
                                id: d.id,
                                name: d.name,
                                metaKey: isMac ? e.metaKey : e.ctrlKey,
                            });
                            onUpdate?.();
                        });

                    const legendLineHeight = row.height;
                    renderLegendSymbol({selection: legendItemTemplate, row});
                    if (legend.itemMaxRowCount > 1) {
                        legendItemTemplate
                            .append('rect')
                            .attr('x', (_, i) => row.items[i].symbolLeft)
                            .attr(
                                'width',
                                (d, i) =>
                                    row.items[i].textLeft + d.textWidth - row.items[i].symbolLeft,
                            )
                            .attr('height', legendLineHeight)
                            .attr('fill', 'transparent');
                    }

                    if (htmlLegendLine) {
                        htmlLegendLine
                            .selectAll('legend-item')
                            .data(line)
                            .enter()
                            .append('div')
                            .attr('class', function (d) {
                                const mods = {
                                    selected: d.visible,
                                    unselected: !d.visible,
                                    multiline: legend.itemMaxRowCount > 1,
                                };
                                return b('item-text-html', mods);
                            })
                            .style('font-size', legend.itemStyle.fontSize)
                            .style('position', 'absolute')
                            .style('font-weight', () =>
                                legend.itemMaxRowCount > 1
                                    ? (legend.itemStyle.fontWeight ?? null)
                                    : null,
                            )
                            .style('line-height', () =>
                                legend.itemMaxRowCount > 1 ? `${legend.lineHeight}px` : null,
                            )
                            .style('-webkit-line-clamp', (d) =>
                                d.textRowCount ? String(d.textRowCount) : null,
                            )
                            .style('max-height', (d) => (d.textRowCount ? `${d.height}px` : null))
                            .style('max-width', function (d) {
                                return `${d.textWidth}px`;
                            })
                            .style('width', (d) => (d.textRowCount ? `${d.textWidth}px` : null))
                            .style('left', function (_d, i) {
                                return `${row.items[i].textLeft}px`;
                            })
                            .style('top', function (d) {
                                if (d.height < legendLineHeight) {
                                    return `${(legendLineHeight - d.height) / 2}px`;
                                }
                                return '0px';
                            })
                            .on('click', function (e, d) {
                                onItemClick({
                                    id: d.id,
                                    name: d.name,
                                    metaKey: isMac ? e.metaKey : e.ctrlKey,
                                });
                                onUpdate?.();
                            })
                            .html((d) => d.text);
                    } else {
                        const textSelection = legendItemTemplate
                            .append('text')
                            .attr('x', (_d, i) => row.items[i].textLeft)
                            .attr(
                                'y',
                                (d) => legend.hangingOffset + (legendLineHeight - d.height) / 2,
                            )
                            .attr('height', legend.height)
                            .attr('class', function (d) {
                                const mods = {selected: d.visible, unselected: !d.visible};
                                return b('item-text', mods);
                            })
                            .html((d) => (d.textRows ? '' : d.text))
                            .style('font-size', legend.itemStyle.fontSize);
                        textSelection
                            .filter((d) => Boolean(d.textRows))
                            // Match the measured font weight while preserving legacy single-line styling.
                            .style('font-weight', () => legend.itemStyle.fontWeight ?? null)
                            .each(function (d) {
                                const label = select(this);
                                label
                                    .selectAll('tspan')
                                    .data(d.textRows ?? [])
                                    .enter()
                                    .append('tspan')
                                    // WebKit otherwise clips the first row instead of inheriting the text baseline.
                                    .style('dominant-baseline', 'hanging')
                                    .attr('x', label.attr('x'))
                                    .attr(
                                        'y',
                                        (_, i) =>
                                            legend.hangingOffset +
                                            (legendLineHeight - d.height) / 2 +
                                            i * legend.lineHeight,
                                    )
                                    .text((textRow) => textRow);
                            });
                    }

                    legendWidth =
                        legend.layout === 'vertical' || legend.justifyContent === 'center'
                            ? config.maxWidth
                            : Math.max(legendWidth, row.width);
                    const left = row.left;
                    const top = titleHeight + row.top - pageTop;
                    legendLine.attr('transform', `translate(${[left, top].join(',')})`);
                    htmlLegendLine?.style('transform', `translate(${left}px, ${top}px)`);
                });

                if (pagination) {
                    const transform = `translate(${[0, legend.height - legend.lineHeight / 2].join(
                        ',',
                    )})`;
                    const paginator = await appendPaginator({
                        container: svgElement,
                        pageIndex: currentPageIndex,
                        legend,
                        transform,
                        pages: pagination.pages,
                        onArrowClick: (pageIndex) =>
                            setPaginationState((state) => ({...state, pageIndex})),
                    });
                    // SVG's middle baseline is not the bounding-box center. Use the actual
                    // text bounds so a clipped row cannot touch the counter or arrows.
                    contentHeight = Math.max(
                        0,
                        legend.height -
                            legend.lineHeight / 2 +
                            (paginator.node()?.getBBox().y ?? 0),
                    );
                }
                if (pageRows.some((row) => row.height > contentHeight - titleHeight)) {
                    // An indivisible row may exceed a page. Clip it before the paginator,
                    // keeping navigation usable without changing the configured symbol size.
                    const clipId = getUniqId();
                    const contentWidth = Math.max(
                        config.maxWidth,
                        ...pageRows.map((row) => row.width),
                    );
                    svgElement
                        .append('defs')
                        .append('clipPath')
                        .attr('id', clipId)
                        .append('rect')
                        .attr('width', contentWidth)
                        .attr('height', contentHeight);
                    svgItems.attr('clip-path', `url(#${clipId})`);
                    htmlContainer
                        ?.style('width', `${contentWidth}px`)
                        .style('height', `${contentHeight}px`)
                        .style('overflow', 'hidden');
                }
                const {left, top} = getLegendPosition({
                    width: config.maxWidth,
                    contentWidth: legendWidth,
                    offsetLeft: config.offset.left,
                    offsetTop: config.offset.top,
                });

                legendLeft = left;
                legendTop = top;
            } else {
                let left = 0;
                switch (legend.align) {
                    case 'right': {
                        left = config.offset.left + config.maxWidth - legend.resolvedWidth;
                        break;
                    }
                    case 'left': {
                        left = config.offset.left;
                        break;
                    }
                    case 'center': {
                        left = config.offset.left + config.maxWidth / 2 - legend.resolvedWidth / 2;
                        break;
                    }
                }
                const {top} = getLegendPosition({
                    width: config.maxWidth,
                    contentWidth: legendWidth,
                    offsetLeft: config.offset.left,
                    offsetTop: config.offset.top,
                });
                legendLeft = left;
                legendTop = top;
                // gradient rect
                const domain = legend.colorScale.domain ?? [];
                const rectHeight = CONTINUOUS_LEGEND_SIZE.height;
                svgElement.call(createGradientRect, {
                    y: legend.title.height + legend.title.margin,
                    height: rectHeight,
                    width: legend.resolvedWidth,
                    interpolator: getContinuesColorFn({
                        values: [0, 1],
                        colors: legend.colorScale.colors,
                        stops: legend.colorScale.stops,
                    }),
                });

                // ticks
                const scale = scaleLinear(domain, [
                    0,
                    legend.resolvedWidth,
                ]) as AxisScale<AxisDomain>;
                const xAxisGenerator = await axisBottom({
                    domain: {
                        size: legend.resolvedWidth,
                        color: 'transparent',
                    },
                    htmlLayout,
                    scale,
                    ticks: {
                        items: [[0, -rectHeight]],
                        labelsMargin: legend.ticks.labelsMargin,
                        labelsLineHeight: legend.ticks.labelsLineHeight,
                        maxTickCount: 4,
                        tickColor: '#fff',
                        labelFormat: (value: number) => formatNumber(value, {unit: 'auto'}),
                        labelsStyle: legend.ticks.style,
                    },
                });
                const tickTop = legend.title.height + legend.title.margin + rectHeight;

                const legendAxisClassname = b('axis');
                svgElement.selectAll(`.${legendAxisClassname}`).remove();
                svgElement
                    .append('g')
                    .attr('class', legendAxisClassname)
                    .attr('transform', `translate(0, ${tickTop})`)
                    .call(xAxisGenerator);
                legendWidth = legend.resolvedWidth;
            }

            const legendTitleClassname = b('title');

            if (legend.title.enable) {
                const {width: titleWidth} = await getTextSizeFn({style: legend.title.style})(
                    legend.title.text,
                );
                let dx = 0;
                switch (legend.title.align) {
                    case 'center': {
                        dx = legend.resolvedWidth / 2 - titleWidth / 2;
                        break;
                    }
                    case 'right': {
                        dx = legend.resolvedWidth - titleWidth;
                        break;
                    }
                    case 'left':
                    default: {
                        dx = 0;
                        break;
                    }
                }

                svgElement.selectAll(`.${legendTitleClassname}`).remove();
                svgElement
                    .append('g')
                    .attr('class', legendTitleClassname)
                    .append('text')
                    .attr('dx', dx)
                    .attr('y', legend.title.hangingOffset)
                    .attr('font-weight', legend.title.style.fontWeight ?? null)
                    .attr('font-size', legend.title.style.fontSize ?? null)
                    .attr('fill', legend.title.style.fontColor ?? null)
                    .style('dominant-baseline', 'hanging')
                    .html(legend.title.text);
            } else {
                svgElement.selectAll(`.${legendTitleClassname}`).remove();
            }

            svgElement
                .attr('transform', `translate(${[legendLeft, legendTop].join(',')})`)
                .style('opacity', 1);
            htmlContainer?.style('transform', `translate(${legendLeft}px, ${legendTop}px)`);
        }

        prepareLegend();
    }, [chartSeries, onItemClick, onUpdate, legend, items, config, currentPageIndex, htmlLayout]);

    // due to asynchronous processing, we only need to work with the actual element
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const key = React.useMemo(() => getUniqId(), [legend, config]);

    return <g key={key} className={b()} ref={ref} width={config.maxWidth} height={legend.height} />;
};
