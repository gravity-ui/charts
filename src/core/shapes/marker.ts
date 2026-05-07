import type {BaseType, Selection} from 'd3-selection';
import {symbol} from 'd3-shape';
import get from 'lodash/get';

import {block} from '../../utils';
import {SymbolType} from '../constants';
import {getSymbol} from '../utils';

import type {MarkerItem} from './types';

const b = block('marker');
const haloClassName = b('halo');
const symbolClassName = b('symbol');

export interface BaseMarkerData {
    point: {
        x: number;
        y: number;
        color?: string;
        data: unknown;
        series: {
            color: string;
            marker: {
                states: {
                    normal: {
                        symbol: `${SymbolType}`;
                        enabled: boolean;
                        radius: number;
                        borderWidth: number;
                        borderColor: string;
                    };
                    hover: {
                        enabled: boolean;
                        radius: number;
                        borderWidth: number;
                        borderColor: string;
                        halo: {
                            enabled: boolean;
                            size: number;
                            opacity: number;
                        };
                    };
                };
            };
        };
    };
    active: boolean;
    hovered: boolean;
    clipped?: boolean;
}

export function renderMarker<T extends BaseMarkerData>(
    selection: Selection<BaseType, T, BaseType, unknown>,
) {
    const markerSelection = selection
        .attr('class', b('wrapper'))
        .attr('visibility', getMarkerVisibility)
        .attr('transform', (d) => {
            return `translate(${d.point.x},${d.point.y})`;
        });
    markerSelection
        .append('path')
        .attr('class', haloClassName)
        .attr('d', (d) => {
            if ('clipped' in d && d.clipped) {
                return null;
            }
            const series = d.point.series;
            const type = series.marker.states.normal.symbol;
            const radius = get(d.point.data, 'radius', series.marker.states.hover.radius);
            const haloSize = series.marker.states.hover.halo.size;
            return getMarkerSymbol(type, radius + haloSize);
        })
        .attr('fill', (d) => d.point.color ?? d.point.series.color)
        .attr('opacity', (d) => d.point.series.marker.states.hover.halo.opacity)
        .attr('z-index', -1)
        .attr('visibility', getMarkerHaloVisibility);
    markerSelection
        .append('path')
        .attr('class', symbolClassName)
        .call(setMarker, 'normal')
        .attr('fill', (d) => d.point.color ?? d.point.series.color);

    return markerSelection;
}

export function getMarkerVisibility(d: BaseMarkerData) {
    const markerStates = d.point.series.marker.states;
    let enabled: Boolean;

    if (d.hovered) {
        enabled = markerStates.hover.enabled && d.hovered;
    } else {
        enabled =
            markerStates.normal.enabled || get(d.point.data, 'marker.states.normal.enabled', false);
    }

    return enabled ? '' : 'hidden';
}

export function getMarkerHaloVisibility(d: BaseMarkerData) {
    const markerStates = d.point.series.marker.states;
    const enabled = markerStates.hover.halo.enabled && d.hovered;
    return enabled ? '' : 'hidden';
}

export function setMarker<T extends BaseType, D extends BaseMarkerData>(
    selection: Selection<T, D, BaseType | null, unknown>,
    state: 'normal' | 'hover',
) {
    selection
        .attr('d', (d) => {
            if ('clipped' in d && d.clipped) {
                return null;
            }
            const series = d.point.series;
            const type = series.marker.states.normal.symbol;
            const radius = get(d.point.data, 'radius', series.marker.states[state].radius);
            const size = radius + series.marker.states[state].borderWidth;
            return getMarkerSymbol(type, size);
        })
        .attr('stroke-width', (d) => d.point.series.marker.states[state].borderWidth)
        .attr('stroke', (d) => d.point.series.marker.states[state].borderColor);
}

export function getMarkerSymbol(type: `${SymbolType}` = SymbolType.Circle, radius: number) {
    const symbolFn = getSymbol(type);
    const size = Math.pow(radius, 2) * Math.PI;

    return symbol(symbolFn, size)();
}

export function selectMarkerHalo<T>(parentSelection: Selection<BaseType, T, null, undefined>) {
    return parentSelection.select(`.${haloClassName}`);
}

export function selectMarkerSymbol<T>(parentSelection: Selection<BaseType, T, null, undefined>) {
    return parentSelection.select(`.${symbolClassName}`);
}

export function renderMarkers(
    container: Selection<SVGGElement, unknown, null, undefined>,
    markers: MarkerItem[],
): void {
    container.selectAll('*').remove();

    const selection = container
        .selectAll<SVGGElement, MarkerItem>('g')
        .data(markers)
        .join('g')
        .attr('class', b('wrapper'))
        .attr('transform', (d) => `translate(${d.cx},${d.cy})`);

    selection
        .append('path')
        .attr('class', b('symbol'))
        .attr('d', (d) =>
            d.clipped ? null : getMarkerSymbol(d.symbolType, d.radius + d.strokeWidth),
        )
        .attr('fill', (d) => d.fill)
        .attr('stroke', (d) => d.stroke)
        .attr('stroke-width', (d) => d.strokeWidth);
}

export function renderHoverMarkers(
    container: Selection<SVGGElement, unknown, null, undefined>,
    hoverMarkers: MarkerItem[],
): void {
    container.selectAll('*').remove();

    if (hoverMarkers.length === 0) return;

    container
        .selectAll<SVGGElement, MarkerItem>('g')
        .data(hoverMarkers)
        .join('g')
        .attr('class', b('wrapper'))
        .attr('transform', (d) => `translate(${d.cx},${d.cy})`)
        .append('path')
        .attr('class', b('symbol'))
        .attr('d', (d) => getMarkerSymbol(d.symbolType, d.radius + d.strokeWidth))
        .attr('fill', (d) => d.fill)
        .attr('stroke', (d) => d.stroke)
        .attr('stroke-width', (d) => d.strokeWidth);
}

interface HoverMarkerPoint {
    data: unknown;
    x: number | null;
    y: number | null;
    hiddenInLine?: boolean;
    color?: string;
}

interface HoverMarkerSeries {
    id: string;
    color: string;
    marker: {
        states: {
            normal: {enabled: boolean; symbol: `${SymbolType}`};
            hover: {enabled: boolean; radius: number; borderColor: string; borderWidth: number};
        };
    };
}

export function buildHoverMarkerGetter(
    points: HoverMarkerPoint[],
    series: HoverMarkerSeries,
): (hoveredData: unknown[]) => MarkerItem[] {
    const {normal: normalState, hover: hoverState} = series.marker.states;

    if (normalState.enabled || !hoverState.enabled) return () => [];

    const pointByData = new Map<unknown, HoverMarkerPoint>();
    for (const p of points) {
        if (p.x !== null && p.y !== null && !p.hiddenInLine) {
            pointByData.set(p.data, p);
        }
    }

    return (hoveredData: unknown[]) => {
        const items: MarkerItem[] = [];
        for (const rawData of hoveredData) {
            const point = pointByData.get(rawData);
            if (!point || point.x === null || point.y === null) continue;
            items.push({
                cx: point.x,
                cy: point.y,
                radius: hoverState.radius,
                symbolType: normalState.symbol,
                fill: point.color ?? series.color,
                stroke: hoverState.borderColor,
                strokeWidth: hoverState.borderWidth,
                opacity: 1,
                active: true,
                clipped: false,
                series: {id: series.id},
                data: rawData,
            });
        }
        return items;
    };
}
