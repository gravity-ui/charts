import React from 'react';

import type {AxisDomain, AxisScale} from 'd3-axis';
import type {Dispatch} from 'd3-dispatch';
import {scaleLinear} from 'd3-scale';
import type {Selection} from 'd3-selection';
import {select} from 'd3-selection';

import {CONTINUOUS_LEGEND_SIZE} from '~core/constants';
import {i18n} from '~core/i18n';
import {createGradientRect, getContinuesColorFn, getTextSizeFn, getUniqId} from '~core/utils';
import {axisBottom} from '~core/utils/axis-generators';

import type {LegendItem, OnLegendItemClick, PreparedLegend, PreparedSeries} from '../../hooks';
import {formatNumber} from '../../libs';
import type {LegendConfig} from '../../types';
import {block} from '../../utils';

import {bindLegendNavigation} from './keyboard-navigation';
import type {PositionedLegendItem} from './render-items';
import {renderLegendItems, renderLegendTitle} from './render-items';
import {createLegendTooltipController} from './tooltip-controller';

import './styles.scss';

const b = block('legend');

interface Props {
    dispatcher: Dispatch<object>;
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
    isCurrent: () => boolean;
}) {
    const {container, pageIndex, legend, transform, pages, onArrowClick} = args;
    const maxPage = pages.length;
    const paginationCounterText = `${pageIndex + 1}/${maxPage}`;

    const getTextSize = getTextSizeFn({style: legend.itemStyle});
    const [arrowIcon, downArrowIcon, counter] = await Promise.all([
        getTextSize('▲'),
        getTextSize('▼'),
        getTextSize(paginationCounterText),
    ]);
    if (!args.isCurrent()) return undefined;
    const paginationLine = container
        .selectAll<SVGGElement, unknown>(`.${b('pagination')}`)
        .data([null])
        .join('g')
        .attr('class', b('pagination'));
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

    const appendArrow = (
        text: string,
        x: number,
        width: number,
        nextPageIndex: number,
        direction: 'previous' | 'next',
    ) => {
        const inactive = nextPageIndex < 0 || nextPageIndex >= maxPage;
        const arrow = paginationLine
            .selectAll<SVGGElement, unknown>(`[data-direction="${direction}"]`)
            .data([null])
            .join('g')
            .attr('data-direction', direction)
            .attr('role', 'button')
            .attr(
                'aria-label',
                i18n(
                    'legend',
                    direction === 'previous' ? 'label_previous-page' : 'label_next-page',
                ),
            )
            .attr('aria-disabled', String(inactive))
            .attr('tabindex', inactive ? -1 : 0)
            .attr('class', b('pagination-arrow', {inactive}))
            .attr('transform', `translate(${x}, 0)`)
            .on('click', () => {
                if (!inactive) {
                    onArrowClick(nextPageIndex);
                }
            })
            .on('keydown', (event: KeyboardEvent) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                if (!inactive && !event.repeat && event.key === 'Enter')
                    onArrowClick(nextPageIndex);
            })
            .on('keyup', (event: KeyboardEvent) => {
                if (event.key === ' ') {
                    event.preventDefault();
                    if (!inactive) onArrowClick(nextPageIndex);
                }
            });
        arrow.selectChildren().remove();
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
    appendArrow('▲', upArrowX, arrowIcon.width, pageIndex - 1, 'previous');
    paginationLine
        .selectAll<SVGTextElement, string>(`.${b('pagination-counter')}`)
        .data(showCounter ? [paginationCounterText] : [])
        .join('text')
        .text((text) => text)
        .attr('class', b('pagination-counter'))
        .attr('x', arrowIcon.width)
        .style('font-size', legend.itemStyle.fontSize);
    appendArrow('▼', downArrowX, downArrowIcon.width, pageIndex + 1, 'next');
    paginationLine.attr('transform', transform);
    return paginationLine;
}

export const Legend = (props: Props) => {
    const {dispatcher, chartSeries, legend, items, config, htmlLayout, onItemClick, onUpdate} =
        props;
    const ref = React.useRef<SVGGElement>(null);
    const tooltipController = React.useMemo(
        () => createLegendTooltipController(dispatcher),
        [dispatcher],
    );
    const activeItemId = React.useRef<string | null>(null);
    const pendingFocus = React.useRef<'first' | 'last' | null>(null);
    React.useEffect(() => () => tooltipController.destroy(), [tooltipController]);
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
        async function prepareLegend() {
            if (!ref.current || !htmlLayout) {
                return;
            }

            const svgElement = select(ref.current);
            svgElement.selectAll('defs').remove();
            svgElement.selectAll(`.${b('axis')}`).remove();
            const content = svgElement
                .selectAll<SVGGElement, unknown>(`.${b('items')}`)
                .data([null])
                .join('g')
                .attr('class', b('items'))
                .attr('clip-path', null);
            const titleContainer = svgElement
                .selectAll<SVGGElement, unknown>(`.${b('title')}`)
                .data(legend.title.enable ? [null] : [])
                .join('g')
                .attr('class', b('title'));
            const contentNode = content.node();
            if (!contentNode) return;
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
            const activeElement = document.activeElement;
            const focusedItem =
                activeElement &&
                (contentNode.contains(activeElement) ||
                    htmlLayout.querySelector('[data-legend]')?.contains(activeElement))
                    ? activeElement.getAttribute('data-legend-item-id')
                    : null;
            const htmlSelection = htmlElement
                .selectAll<HTMLDivElement, unknown>('[data-legend]')
                .data(legend.html && legend.type === 'discrete' ? [null] : [])
                .join('div')
                .attr('data-legend', 1)
                .attr('role', 'group')
                .attr('aria-label', i18n('legend', 'label_legend'))
                .style('position', 'absolute')
                .style('width', null)
                .style('height', null)
                .style('overflow', null)
                .style('pointer-events', null);
            const htmlContainer = htmlSelection.empty() ? null : htmlSelection;

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
                const positionedItems: PositionedLegendItem[] = [];
                pageItems.forEach((line, lineIndex) => {
                    const row = legend.rows[start + lineIndex];
                    line.forEach((item, index) =>
                        positionedItems.push({
                            item,
                            position: row.items[index],
                            rowHeight: row.height,
                            left: contentLeft + row.left,
                            top: titleHeight + row.top - pageTop,
                        }),
                    );
                });
                content.selectChildren(`:not(.${b('item')})`).remove();
                renderLegendItems({
                    container: contentNode,
                    htmlContainer: htmlContainer?.node() ?? null,
                    items: positionedItems,
                    legend,
                    onClick: handleItemClick,
                    tooltipController,
                });
                const focusableItems = bindLegendNavigation({
                    container: htmlContainer?.node() ?? contentNode,
                    vertical: legend.layout === 'vertical',
                    activeId: activeItemId.current,
                    onFocus: (id) => {
                        activeItemId.current = id;
                    },
                    onPageChange: (direction) => {
                        let next = currentPageIndex + (direction === 'next' ? 1 : -1);
                        if (direction === 'first') next = 0;
                        if (direction === 'last') next = pageCount - 1;
                        if (next === currentPageIndex || next < 0 || next >= pageCount) return;
                        pendingFocus.current =
                            direction === 'previous' || direction === 'last' ? 'last' : 'first';
                        setPaginationState((state) => ({...state, pageIndex: next}));
                    },
                });
                const pageFocus = pendingFocus.current;
                if (pageFocus) {
                    const next =
                        pageFocus === 'first'
                            ? focusableItems[0]
                            : focusableItems[focusableItems.length - 1];
                    next?.focus({preventScroll: true});
                    pendingFocus.current = null;
                } else if (focusedItem) {
                    (htmlContainer?.node() ?? contentNode)
                        .querySelector<
                            HTMLElement | SVGElement
                        >(`[data-legend-item-id="${CSS.escape(focusedItem)}"]`)
                        ?.focus({preventScroll: true});
                }

                if (pagination) {
                    const transform = `translate(${[0, legend.height - legend.lineHeight / 2].join(
                        ',',
                    )})`;
                    const paginator = await appendPaginator({
                        container: svgElement,
                        isCurrent: () => !cancelled,
                        pageIndex: currentPageIndex,
                        legend,
                        transform,
                        pages: pagination.pages,
                        onArrowClick: (pageIndex) =>
                            setPaginationState((state) => ({...state, pageIndex})),
                    });
                    if (!paginator || cancelled) return;
                    if (pageFocus && !focusableItems.length) {
                        // A page of noninteractive, fitting labels has no item to receive focus.
                        const direction = pageFocus === 'first' ? 'next' : 'previous';
                        const arrow =
                            paginator
                                .select<SVGGElement>(
                                    `[data-direction="${direction}"][aria-disabled="false"]`,
                                )
                                .node() ??
                            paginator.select<SVGGElement>('[aria-disabled="false"]').node();
                        arrow?.focus({preventScroll: true});
                    }
                    // SVG's middle baseline is not the bounding-box center. Use the actual
                    // text bounds so a clipped row cannot touch the counter or arrows.
                    contentHeight = Math.max(
                        0,
                        legend.height -
                            legend.lineHeight / 2 +
                            (paginator.node()?.getBBox().y ?? 0),
                    );
                }
                if (!pagination) svgElement.selectAll(`.${b('pagination')}`).remove();
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
                    content.attr('clip-path', `url(#${clipId})`);
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
                svgElement.selectAll(`.${b('pagination')}`).remove();
                content.selectChildren().remove();
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
                select<SVGGElement, unknown>(contentNode).call(createGradientRect, {
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

            const titleNode = titleContainer.node();
            if (titleNode) renderLegendTitle(titleNode, legend, tooltipController);

            svgElement
                .attr('transform', `translate(${[legendLeft, legendTop].join(',')})`)
                .style('opacity', 1);
            htmlContainer?.style('transform', `translate(${legendLeft}px, ${legendTop}px)`);
            tooltipController.sync();
        }

        prepareLegend();
        return () => {
            cancelled = true;
        };
    }, [
        chartSeries,
        onItemClick,
        onUpdate,
        legend,
        items,
        config,
        currentPageIndex,
        htmlLayout,
        tooltipController,
        pageCount,
    ]);

    React.useEffect(
        () => () => {
            select(htmlLayout).selectAll('[data-legend]').remove();
        },
        [htmlLayout],
    );

    return (
        <g
            className={b()}
            ref={ref}
            width={config.maxWidth}
            height={legend.height}
            role="group"
            aria-label={i18n('legend', 'label_legend')}
        />
    );
};
