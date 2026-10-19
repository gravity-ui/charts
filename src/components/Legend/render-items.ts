import {select} from 'd3-selection';
import {symbol} from 'd3-shape';

import type {LegendItem, PreparedLegend, PreparedLegendRowItem} from '~core/series/types';
import {decodeHtmlEntities, getLineDashArray, getReadableText, getSymbol} from '~core/utils';

import {block} from '../../utils';

const b = block('legend');

export interface LegendTooltipTarget {
    anchor: HTMLElement | SVGElement;
    text: string;
    truncated: boolean;
    htmlLabel?: HTMLElement;
}

export interface PositionedLegendItem {
    item: LegendItem;
    position: PreparedLegendRowItem;
    rowHeight: number;
    left: number;
    top: number;
}

export function renderLegendItems({
    container,
    htmlContainer,
    items,
    legend,
    onClick,
    onTooltip,
}: {
    container: SVGGElement;
    htmlContainer: HTMLElement | null;
    items: PositionedLegendItem[];
    legend: PreparedLegend;
    onClick: (event: MouseEvent, item: LegendItem) => void;
    onTooltip: (target: LegendTooltipTarget) => void;
}) {
    const interactive = legend.itemClickAction !== 'none' || Boolean(legend.events?.itemClick);
    const bind = (
        anchor: SVGGElement | HTMLDivElement,
        item: LegendItem,
        htmlLabel?: HTMLElement,
    ) => {
        const text = htmlLabel ? getReadableText(item.text) : decodeHtmlEntities(item.name);
        const truncated = Boolean(item.textTruncated);
        const showTooltip = () => onTooltip({anchor, text, truncated, htmlLabel});
        const activate = (event: KeyboardEvent) => {
            if (!interactive || event.target !== event.currentTarget) return;
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            if (event.repeat || (event.key === ' ' && event.type !== 'keyup')) return;
            // Keep MouseEvent/currentTarget compatibility without bubbling into chart clicks.
            anchor.dispatchEvent(
                new MouseEvent('click', {
                    cancelable: true,
                    ctrlKey: event.ctrlKey,
                    metaKey: event.metaKey,
                    altKey: event.altKey,
                    shiftKey: event.shiftKey,
                    view: window,
                }),
            );
        };
        select<HTMLElement | SVGElement, unknown>(anchor)
            .attr('role', interactive ? 'button' : 'group')
            .attr('tabindex', interactive || truncated || htmlLabel ? 0 : -1)
            .attr('aria-label', text)
            .attr(
                'aria-pressed',
                legend.itemClickAction === 'none' ? null : String(Boolean(item.visible)),
            )
            .attr('data-legend-item-id', item.id)
            .on('click', (event: MouseEvent) => onClick(event, item))
            .on('keydown', activate)
            .on('keyup', (event: KeyboardEvent) => {
                if (event.key === ' ') activate(event);
            })
            .on('mouseenter focus', showTooltip);
        if (anchor === document.activeElement || anchor.matches(':hover')) showTooltip();
    };
    // A shared parent keeps focused nodes in place when wrapping moves items between rows.
    const svgItems = select(container)
        .selectAll<SVGGElement, PositionedLegendItem>(`.${b('item')}`)
        .data(items, (d) => d.item.id)
        .join('g')
        .attr('class', b('item'))
        .attr('transform', (d) => `translate(${d.left},${d.top})`);
    svgItems.each(function ({item, position, rowHeight}) {
        const group = select(this);
        group.selectChildren().remove();
        const marker = item.symbol;
        const x = position.symbolLeft;
        const color = item.visible ? item.color : '';
        const className = b('item-symbol', {shape: marker.shape, unselected: !item.visible});
        switch (marker.shape) {
            case 'path':
                group
                    .append('path')
                    .attr('d', `M${x},${rowHeight / 2}L${x + marker.bboxWidth},${rowHeight / 2}`)
                    .attr('fill', 'none')
                    .attr('stroke', color)
                    .attr('stroke-width', marker.strokeWidth)
                    .attr(
                        'stroke-dasharray',
                        item.dashStyle
                            ? getLineDashArray(item.dashStyle, marker.strokeWidth)
                            : null,
                    )
                    .attr('class', className);
                break;
            case 'rect':
                group
                    .append('rect')
                    .attr('x', x)
                    .attr('y', (rowHeight - marker.height) / 2)
                    .attr('width', marker.bboxWidth)
                    .attr('height', marker.height)
                    .attr('rx', marker.radius)
                    .style('fill', color)
                    .attr('class', className);
                break;
            case 'symbol':
                group
                    .append('path')
                    .attr('d', symbol(getSymbol(marker.symbolType), marker.width ** 2)())
                    .attr('transform', `translate(${x + marker.bboxWidth / 2},${rowHeight / 2})`)
                    .style('fill', color)
                    .attr('class', className);
                break;
        }
        group
            .selectAll(`.${b('item-symbol')}`)
            .attr('opacity', item.visible ? (marker.opacity ?? null) : null);
        if (htmlContainer) {
            group
                .attr('aria-hidden', 'true')
                .attr('tabindex', null)
                .attr('role', null)
                .attr('aria-label', null)
                .attr('aria-pressed', null)
                .attr('data-legend-item-id', null)
                .on('click keydown keyup mouseenter focus', null);
            return;
        }
        group.attr('aria-hidden', null);
        group
            .append('rect')
            .attr('x', x)
            .attr('width', Math.max(0, position.textLeft + item.textWidth - x))
            .attr('height', rowHeight)
            .attr('fill', 'transparent');
        const y = legend.hangingOffset + (rowHeight - item.height) / 2;
        const label = group
            .append('text')
            .attr('x', position.textLeft)
            .attr('y', y)
            .attr('height', legend.height)
            .attr('class', b('item-text', {selected: item.visible, unselected: !item.visible}))
            .style('font-size', legend.itemStyle.fontSize)
            .style('font-weight', () =>
                item.textRows ? (legend.itemStyle.fontWeight ?? null) : null,
            )
            .html(item.textRows ? '' : item.text);
        label
            .selectAll('tspan')
            .data(item.textRows ?? [])
            .join('tspan')
            .attr('x', position.textLeft)
            .attr('y', (_, index) => y + index * legend.lineHeight)
            .style('dominant-baseline', 'hanging')
            .text((row) => row);
        bind(this, item);
    });
    if (htmlContainer) {
        select(htmlContainer)
            .selectAll<HTMLDivElement, PositionedLegendItem>(`.${b('item-html')}`)
            .data(items, (d) => d.item.id)
            .join('div')
            .attr('class', b('item-html'))
            .each(function ({item, position, rowHeight, left, top}) {
                const group = select(this)
                    .style('left', `${position.symbolLeft}px`)
                    .style('transform', `translate(${left}px, ${top}px)`)
                    .style(
                        'width',
                        `${Math.max(0, position.textLeft + item.textWidth - position.symbolLeft)}px`,
                    )
                    .style('height', `${rowHeight}px`)
                    .style('padding-left', `${position.textLeft - position.symbolLeft}px`);
                const label = group
                    .selectChildren<HTMLDivElement, LegendItem>('div')
                    .data([item])
                    .join('div')
                    .attr(
                        'class',
                        b('item-text-html', {selected: item.visible, unselected: !item.visible}),
                    )
                    .style('font-size', legend.itemStyle.fontSize)
                    .style('max-width', `${item.textWidth}px`)
                    .html(item.text)
                    .node();
                bind(this, item, label ?? undefined);
            });
    }
}

export function renderLegendTitle(
    container: SVGGElement,
    legend: PreparedLegend,
    onTooltip: (target: LegendTooltipTarget) => void,
) {
    const {title} = legend;
    const text = decodeHtmlEntities(title.text);
    const truncated = title.resolvedText !== title.text;
    const remainingWidth = legend.resolvedWidth - title.resolvedWidth;
    let dx = 0;
    if (title.align === 'right') dx = remainingWidth;
    else if (title.align === 'center') dx = remainingWidth / 2;
    const node = select(container)
        .selectAll<SVGTextElement, unknown>(`.${b('title-text')}`)
        .data(title.enable ? [title] : [])
        .join('text')
        .attr('class', b('title-text'))
        .attr('data-legend-title', '')
        .attr('role', 'group')
        .attr('aria-label', text)
        .attr('tabindex', truncated ? 0 : -1)
        .attr('dx', dx)
        .attr('y', title.hangingOffset)
        .attr('font-weight', title.style.fontWeight ?? null)
        .attr('font-size', title.style.fontSize ?? null)
        .attr('fill', title.style.fontColor ?? null)
        .style('dominant-baseline', 'hanging')
        .html(title.resolvedText)
        .node();
    if (node) {
        const showTooltip = () => onTooltip({anchor: node, text, truncated});
        select(node).on('mouseenter focus', showTooltip);
        if (node === document.activeElement || node.matches(':hover')) showTooltip();
    }
}
