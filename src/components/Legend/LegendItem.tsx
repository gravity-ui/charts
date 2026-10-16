import React from 'react';

import {symbol} from 'd3-shape';
import {createPortal} from 'react-dom';

import type {LegendItem, PreparedLegend, PreparedLegendRowItem} from '~core/series/types';
import {decodeHtmlEntities, getLineDashArray, getSymbol} from '~core/utils';

import {useHtmlTextOverflow} from '../../hooks/useHtmlTextOverflow';
import {block} from '../../utils';
import {TruncatedTextTooltip} from '../TruncatedTextTooltip';

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
    const htmlLabel = useHtmlTextOverflow();
    const interactive = legend.itemClickAction !== 'none' || Boolean(legend.events?.itemClick);
    const text = legend.html ? htmlLabel.text : decodeHtmlEntities(item.name);
    const truncated = legend.html ? htmlLabel.truncated : Boolean(item.textTruncated);
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
        onKeyDown: activate,
        onKeyUp: (event: React.KeyboardEvent) => {
            if (event.key === ' ') activate(event);
        },
    };
    const withTooltip = (trigger: React.ReactElement) => (
        <TruncatedTextTooltip
            text={text}
            truncated={truncated}
            anchorRef={anchorRef}
            placement={legend.layout === 'vertical' ? ['right', 'left'] : ['top', 'bottom']}
        >
            {trigger}
        </TruncatedTextTooltip>
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
                                ref={htmlLabel.ref}
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
