import React from 'react';

import type {AxisDomain, AxisScale} from 'd3-axis';
import {scaleLinear} from 'd3-scale';
import type {Selection} from 'd3-selection';
import {select} from 'd3-selection';
import {createPortal} from 'react-dom';

import {CONTINUOUS_LEGEND_SIZE} from '~core/constants';
import {createGradientRect, getContinuesColorFn, getTextSizeFn, getUniqId} from '~core/utils';
import {axisBottom} from '~core/utils/axis-generators';

import type {LegendItem, OnLegendItemClick, PreparedLegend, PreparedSeries} from '../../hooks';
import {formatNumber} from '../../libs';
import type {LegendConfig} from '../../types';
import {block} from '../../utils';

import {DiscreteLegendItem} from './LegendItem';

import './styles.scss';

const b = block('legend');

interface Props {
    chartSeries: PreparedSeries[];
    legend: PreparedLegend;
    items: LegendItem[][] | undefined;
    config: LegendConfig;
    htmlLayout: HTMLElement | null;
    onItemClick: OnLegendItemClick;
    onUpdate?: () => void;
}

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
    const [arrowIcon, downArrowIcon, counter] = await Promise.all([
        getTextSize('▲'),
        getTextSize('▼'),
        getTextSize(paginationCounterText),
    ]);
    const showCounter =
        !legend.clipContent ||
        arrowIcon.width + counter.width + downArrowIcon.width <= legend.resolvedWidth;
    let upArrowX = 0;
    let downArrowX = arrowIcon.width + (showCounter ? counter.width : 0);
    const upInk = arrowIcon.inkBounds;
    const downInk = downArrowIcon.inkBounds;
    if (legend.clipContent && !showCounter && upInk && downInk) {
        // Only reclaim side bearings when the visible arrows do not fit. Keep a
        // two-pixel gap between triangles and one pixel clear at each outer edge.
        const minGap = 2;
        const edgePadding = 1;
        const right = downArrowX + downInk.x + downInk.width;
        const minWidth = upInk.width + minGap + downInk.width + 2 * edgePadding;
        if (right + edgePadding > legend.resolvedWidth && minWidth <= legend.resolvedWidth) {
            upArrowX = edgePadding - upInk.x;
            downArrowX = legend.resolvedWidth - edgePadding - downInk.width - downInk.x;
        }
    }

    const appendArrow = (text: string, x: number, width: number, nextPageIndex: number) => {
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
            .attr('width', width)
            .attr('height', legend.lineHeight)
            .attr('fill', 'transparent');
        arrow
            .append('text')
            .text(text)
            .style('font-size', legend.itemStyle.fontSize)
            .style('dominant-baseline', 'middle');
    };
    appendArrow('▲', upArrowX, arrowIcon.width, pageIndex - 1);
    if (showCounter) {
        paginationLine
            .append('text')
            .text(paginationCounterText)
            .attr('class', b('pagination-counter'))
            .attr('x', arrowIcon.width)
            .style('font-size', legend.itemStyle.fontSize);
    }
    appendArrow('▼', downArrowX, downArrowIcon.width, pageIndex + 1);
    paginationLine.attr('transform', transform);
    return paginationLine;
}

export const Legend = (props: Props) => {
    const {chartSeries, legend, items, config, htmlLayout, onItemClick, onUpdate} = props;
    const ref = React.useRef<SVGGElement>(null);
    const focusedItemRef = React.useRef<string | null>(null);
    const [renderedItems, setRenderedItems] = React.useState<React.ReactPortal[]>([]);
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
        let cancelled = false;
        const svgNode = ref.current;
        const focusedItem = focusedItemRef.current;
        const portals: React.ReactPortal[] = [];
        setRenderedItems([]);
        async function prepareLegend() {
            if (!ref.current || !htmlLayout) {
                return;
            }

            const svgElement = select(ref.current);
            // Remove only D3-owned containers; React unmounts the item portals inside them.
            svgElement.selectChildren().remove();
            svgElement.style('opacity', 0).attr('clip-path', null);

            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const handleItemClick = (event: MouseEvent, item: LegendItem) => {
                legend.events?.itemClick?.(
                    {
                        id: item.id,
                        name: item.name,
                        visible: Boolean(item.visible),
                    },
                    event,
                );

                if (legend.itemClickAction !== 'none') {
                    onItemClick({
                        id: item.id,
                        name: item.name,
                        metaKey: isMac ? event.metaKey : event.ctrlKey,
                    });
                }

                onUpdate?.();
            };

            const htmlElement = select(htmlLayout);
            htmlElement.selectAll('[data-legend]').remove();
            const htmlContainer = legend.html
                ? htmlElement.append('div').attr('data-legend', 1).style('position', 'absolute')
                : null;

            if (legend.clipContent) {
                const clipId = getUniqId();
                svgElement
                    .append('defs')
                    .append('clipPath')
                    .attr('id', clipId)
                    .append('rect')
                    .attr('width', legend.resolvedWidth)
                    .attr('height', legend.height);
                svgElement.attr('clip-path', `url(#${clipId})`);
                htmlContainer
                    ?.style('width', `${legend.resolvedWidth}px`)
                    .style('height', `${legend.height}px`)
                    .style('overflow', 'hidden')
                    .style('pointer-events', 'none');
            }

            let legendWidth = 0;
            let legendLeft = 0;
            let legendTop = 0;
            if (legend.type === 'discrete') {
                const page = config.pagination?.pages[currentPageIndex];
                const start = page?.start ?? 0;
                const allItems = items ?? [];
                const pageItems = page ? allItems.slice(start, page.end) : allItems;
                const pageRows = page ? legend.rows.slice(start, page.end) : legend.rows;
                const pageTop = page ? legend.rows[start].top : 0;
                const {titleHeight} = legend;
                legendWidth =
                    pageRows.length > 0 &&
                    (legend.layout === 'vertical' || legend.justifyContent === 'center')
                        ? config.maxWidth
                        : Math.max(0, ...pageRows.map((row) => row.width));
                // Keep the clipping viewport fixed while centering start-justified
                // rows inside it, as the unclipped legend centers its content group.
                const contentLeft = legend.clipContent
                    ? Math.max(0, (config.maxWidth - legendWidth) / 2)
                    : 0;
                const pagination =
                    legend.height - titleHeight >= legend.lineHeight
                        ? config.pagination
                        : undefined;
                let contentHeight = legend.height;
                const svgItems = svgElement.append('g');
                pageItems.forEach((line, lineIndex) => {
                    const row = legend.rows[start + lineIndex];
                    // Chromium otherwise puts SVG portal containers with React's focus listeners
                    // into the tab order, ahead of the actual legend item.
                    const legendLine = svgItems
                        .append('g')
                        .attr('class', b('line'))
                        .attr('tabindex', -1);
                    const htmlLegendLine = htmlContainer
                        ?.append('div')
                        .style('position', 'absolute');
                    const container = legendLine.node();
                    if (container) {
                        line.forEach((item, index) => {
                            portals.push(
                                createPortal(
                                    <DiscreteLegendItem
                                        item={item}
                                        legend={legend}
                                        position={row.items[index]}
                                        rowHeight={row.height}
                                        htmlContainer={htmlLegendLine?.node() ?? null}
                                        restoreFocus={focusedItem === item.id}
                                        onClick={handleItemClick}
                                    />,
                                    container,
                                    item.id,
                                ),
                            );
                        });
                    }

                    const left = contentLeft + row.left;
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
                    if (cancelled) return;
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
                    contentWidth: legend.clipContent ? config.maxWidth : legendWidth,
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
                if (cancelled) return;
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
                const titleWidth = legend.title.resolvedWidth;
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
                    .html(legend.title.resolvedText);
            } else {
                svgElement.selectAll(`.${legendTitleClassname}`).remove();
            }

            svgElement
                .attr('transform', `translate(${[legendLeft, legendTop].join(',')})`)
                .style('opacity', 1);
            htmlContainer?.style('transform', `translate(${legendLeft}px, ${legendTop}px)`);
            if (!cancelled) setRenderedItems(portals);
        }

        prepareLegend();
        return () => {
            cancelled = true;
            const active = document.activeElement;
            focusedItemRef.current =
                active &&
                active.matches(':focus-visible') &&
                (svgNode?.contains(active) ||
                    htmlLayout?.querySelector('[data-legend]')?.contains(active))
                    ? active.getAttribute('data-legend-item-id')
                    : null;
            select(htmlLayout).selectAll('[data-legend]').remove();
        };
    }, [chartSeries, onItemClick, onUpdate, legend, items, config, currentPageIndex, htmlLayout]);

    // Portal events follow the React tree even when the tooltip is outside the SVG.
    const stopTooltipEvent = (event: React.SyntheticEvent) => {
        if ((event.target as Element).closest('[role="tooltip"]')) {
            event.stopPropagation();
        }
    };

    return (
        <g
            className={b()}
            ref={ref}
            width={config.maxWidth}
            height={legend.height}
            onPointerMove={stopTooltipEvent}
            onPointerLeave={stopTooltipEvent}
            onTouchStart={stopTooltipEvent}
            onTouchMove={stopTooltipEvent}
            onClick={stopTooltipEvent}
        >
            {renderedItems}
        </g>
    );
};
