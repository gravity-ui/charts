import React from 'react';

import {Tooltip} from '@gravity-ui/uikit';
import {symbol} from 'd3-shape';
import {createPortal} from 'react-dom';

import type {LegendItem, PreparedLegend, PreparedLegendRowItem} from '~core/series/types';
import {decodeHtmlEntities, getLineDashArray, getSymbol} from '~core/utils';

import {block} from '../../utils';

const b = block('legend');

interface Props {
    item: LegendItem;
    legend: PreparedLegend;
    position: PreparedLegendRowItem;
    rowHeight: number;
    htmlContainer: HTMLElement | null;
    restoreFocus: boolean;
    onClick: (event: MouseEvent, item: LegendItem) => void;
}

function getReadableText(html: string) {
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('script, style, template').forEach((node) => node.remove());
    template.content.querySelectorAll('br, p, div, li').forEach((node) => {
        node.before(' ');
        node.after(' ');
    });
    return (template.content.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function LegendSymbol({item, x, height}: {item: LegendItem; x: number; height: number}) {
    const marker = item.symbol;
    const className = b('item-symbol', {shape: marker.shape, unselected: !item.visible});
    const color = item.visible ? item.color : '';
    const opacity = item.visible ? marker.opacity : undefined;
    switch (marker.shape) {
        case 'path':
            return (
                <path
                    className={className}
                    d={`M${x},${height / 2}L${x + marker.bboxWidth},${height / 2}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={marker.strokeWidth}
                    strokeDasharray={
                        item.dashStyle
                            ? getLineDashArray(item.dashStyle, marker.strokeWidth)
                            : undefined
                    }
                    opacity={opacity}
                />
            );
        case 'rect':
            return (
                <rect
                    className={className}
                    x={x}
                    y={(height - marker.height) / 2}
                    width={marker.bboxWidth}
                    height={marker.height}
                    rx={marker.radius}
                    style={{fill: color}}
                    opacity={opacity}
                />
            );
        case 'symbol':
            return (
                <path
                    className={className}
                    d={symbol(getSymbol(marker.symbolType), marker.width ** 2)() ?? undefined}
                    transform={`translate(${x + marker.bboxWidth / 2},${height / 2})`}
                    style={{fill: color}}
                    opacity={opacity}
                />
            );
    }
}

export function DiscreteLegendItem({
    item,
    legend,
    position,
    rowHeight,
    htmlContainer,
    restoreFocus,
    onClick,
}: Props) {
    const anchorRef = React.useRef<SVGGElement | HTMLDivElement | null>(null);
    const setAnchorRef = React.useCallback((node: SVGGElement | HTMLDivElement | null) => {
        anchorRef.current = node;
    }, []);
    const labelRef = React.useRef<HTMLDivElement>(null);
    const [open, setOpen] = React.useState(false);
    const [htmlTruncated, setHtmlTruncated] = React.useState(false);
    const [htmlText, setHtmlText] = React.useState('');
    const interactive = legend.itemClickAction !== 'none' || Boolean(legend.events?.itemClick);
    const text = legend.html ? htmlText : decodeHtmlEntities(item.name);
    const truncated = legend.html ? htmlTruncated : Boolean(item.textTruncated);
    const tooltipEnabled = truncated && Boolean(text);
    const width = Math.max(0, position.textLeft + item.textWidth - position.symbolLeft);
    const y = legend.hangingOffset + (rowHeight - item.height) / 2;

    React.useLayoutEffect(() => {
        const anchor = anchorRef.current;
        const handleClick = (event: Event) => onClick(event as MouseEvent, item);
        // Keep the native event's currentTarget on the item, as in the D3 renderer.
        anchor?.addEventListener('click', handleClick);
        return () => {
            anchor?.removeEventListener('click', handleClick);
        };
    }, [item, onClick]);

    React.useLayoutEffect(() => {
        if (restoreFocus && document.activeElement === document.body) {
            anchorRef.current?.focus({preventScroll: true});
        }
    }, [restoreFocus]);

    React.useLayoutEffect(() => {
        const anchor = anchorRef.current;
        // Reconcile CSS truncation changes and focus restored when a portal mounts.
        setOpen(
            tooltipEnabled &&
                Boolean(anchor && (anchor === document.activeElement || anchor.matches(':hover'))),
        );
    }, [tooltipEnabled]);

    React.useLayoutEffect(() => {
        const label = labelRef.current;
        if (!label) return undefined;
        let frame = 0;
        let measuredHtml: string | undefined;
        const measure = () => {
            const nodes = [label, ...label.querySelectorAll<HTMLElement>('*')];
            setHtmlTruncated(
                nodes.some((node) => {
                    const style = getComputedStyle(node);
                    return (
                        (/(hidden|clip|auto|scroll)/.test(style.overflowX) &&
                            node.scrollWidth > node.clientWidth) ||
                        (/(hidden|clip|auto|scroll)/.test(style.overflowY) &&
                            node.scrollHeight > node.clientHeight)
                    );
                }),
            );
            const html = label.innerHTML;
            if (html !== measuredHtml) {
                measuredHtml = html;
                setHtmlText(getReadableText(html));
            }
        };
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        };
        const resize = new ResizeObserver(schedule);
        const observe = () => {
            resize.disconnect();
            resize.observe(label);
            label.querySelectorAll('*').forEach((node) => resize.observe(node));
        };
        const mutation = new MutationObserver((records) => {
            if (records.some((record) => record.type === 'childList')) observe();
            schedule();
        });
        observe();
        mutation.observe(label, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
        });
        document.fonts?.addEventListener('loadingdone', schedule);
        measure();
        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            mutation.disconnect();
            document.fonts?.removeEventListener('loadingdone', schedule);
        };
    }, [item.text]);

    const activate = (event: React.KeyboardEvent) => {
        if (!interactive || event.target !== event.currentTarget) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (event.repeat || (event.key === ' ' && event.type !== 'keyup')) return;
        // Preserve the public MouseEvent callback contract for keyboard activation.
        event.currentTarget.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                view: window,
            }),
        );
    };
    const triggerProps = {
        ref: setAnchorRef,
        role: interactive ? 'button' : 'group',
        tabIndex: interactive || truncated ? 0 : -1,
        'aria-label': text,
        'aria-pressed': legend.itemClickAction === 'none' ? undefined : Boolean(item.visible),
        'data-legend-item-id': item.id,
        onFocus: () => setOpen(tooltipEnabled),
        onKeyDown: activate,
        onKeyUp: (event: React.KeyboardEvent) => {
            if (event.key === ' ') activate(event);
        },
    };
    const withTooltip = (trigger: React.ReactElement) => (
        <Tooltip
            content={text}
            open={open}
            onOpenChange={(nextOpen, _event, reason) => {
                if (
                    !nextOpen &&
                    (reason === 'hover' || reason === 'ancestor-scroll') &&
                    anchorRef.current === document.activeElement
                ) {
                    return;
                }
                setOpen(nextOpen && tooltipEnabled);
            }}
            disabled={!tooltipEnabled}
            openDelay={300}
            closeDelay={150}
            placement={legend.layout === 'vertical' ? ['right', 'left'] : ['top', 'bottom']}
            className={b('tooltip')}
        >
            {trigger}
        </Tooltip>
    );
    const marker = <LegendSymbol item={item} x={position.symbolLeft} height={rowHeight} />;
    if (htmlContainer) {
        return (
            <React.Fragment>
                <g className={b('item')} aria-hidden="true">
                    {marker}
                </g>
                {createPortal(
                    withTooltip(
                        <div
                            {...triggerProps}
                            className={b('item-html')}
                            style={{
                                left: position.symbolLeft,
                                width,
                                height: rowHeight,
                                paddingLeft: position.textLeft - position.symbolLeft,
                            }}
                        >
                            <div
                                ref={labelRef}
                                className={b('item-text-html', {
                                    selected: item.visible,
                                    unselected: !item.visible,
                                })}
                                style={{
                                    fontSize: legend.itemStyle.fontSize,
                                    maxWidth: item.textWidth,
                                }}
                                dangerouslySetInnerHTML={{__html: item.text}}
                            />
                        </div>,
                    ),
                    htmlContainer,
                )}
            </React.Fragment>
        );
    }
    return withTooltip(
        <g {...triggerProps} className={b('item')}>
            {marker}
            <rect x={position.symbolLeft} width={width} height={rowHeight} fill="transparent" />
            <text
                x={position.textLeft}
                y={y}
                height={legend.height}
                className={b('item-text', {selected: item.visible, unselected: !item.visible})}
                style={{
                    fontSize: legend.itemStyle.fontSize,
                    fontWeight: item.textRows ? legend.itemStyle.fontWeight : undefined,
                }}
                dangerouslySetInnerHTML={item.textRows ? undefined : {__html: item.text}}
            >
                {item.textRows?.map((row, index) => (
                    <tspan
                        key={index}
                        x={position.textLeft}
                        y={y + index * legend.lineHeight}
                        style={{dominantBaseline: 'hanging'}}
                    >
                        {row}
                    </tspan>
                ))}
            </text>
        </g>,
    );
}
