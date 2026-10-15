import {select} from 'd3-selection';

import type {
    ChartInteractionItem,
    ChartInteractionSeries,
    ChartShapePoint,
    PointPosition,
} from '../../types';
import type {MarkerItem, SeriesShapeData} from '../shapes/types';

import {getSourcePoint} from './source-point';
import {createSvgHitTest} from './svg-hit-test';

export interface InteractionElement {
    element: SVGGeometryElement;
    item: ChartInteractionItem;
}

export interface InteractionElementsArgs {
    plot: SVGGElement;
    markers: SVGGElement;
    preparedData: SeriesShapeData[];
}

const layers = new WeakMap<SVGGElement, () => InteractionElement[]>();

/** Shared render pipeline registration; series renderers do not bind interaction handlers. */
export function registerInteractionLayer(
    plot: SVGGElement,
    getElements: () => InteractionElement[],
) {
    layers.set(plot, getElements);
    return () => {
        layers.delete(plot);
    };
}

/** Read existing D3 data without changing the renderer or exposing DOM nodes to applications. */
export function getInteractionElements<T>(
    root: SVGGElement,
    selector: string,
    getItem: (datum: T) => ChartInteractionItem | undefined,
): InteractionElement[] {
    return Array.from(root.querySelectorAll<SVGGeometryElement>(selector)).flatMap((element) => {
        const item = getItem(select<SVGGeometryElement, T>(element).datum());
        return item ? [{element, item}] : [];
    });
}

interface MarkerShapeData extends SeriesShapeData {
    series: ChartInteractionSeries;
}

const markerIndexes = new WeakMap<
    MarkerShapeData[],
    Map<unknown, {marker: MarkerItem; series: ChartInteractionSeries}[]>
>();

/** Includes the current symbol of a permanent marker, excluding hover-only decorations. */
export function getMarkerInteractionElements(root: SVGGElement, shapes: MarkerShapeData[]) {
    let normalMarkers = markerIndexes.get(shapes);
    if (!normalMarkers) {
        normalMarkers = new Map();
        for (const shape of shapes) {
            for (const marker of shape.markers) {
                const entries = normalMarkers.get(marker.data) ?? [];
                entries.push({marker, series: shape.series});
                normalMarkers.set(marker.data, entries);
            }
        }
        markerIndexes.set(shapes, normalMarkers);
    }
    return getInteractionElements<MarkerItem>(root, '.gcharts-marker__symbol', (item) => {
        const normal = normalMarkers
            .get(item.data)
            ?.find(
                ({marker}) =>
                    marker.series.id === item.series.id &&
                    marker.cx === item.cx &&
                    marker.cy === item.cy,
            );
        return normal && !normal.marker.clipped && !item.clipped
            ? ({point: item.data, series: normal.series} as ChartInteractionItem)
            : undefined;
    });
}

const shapePoints = new WeakMap<object, ChartShapePoint<unknown>>();

const seriesMetadata = new WeakMap<ChartInteractionSeries, ChartInteractionSeries>();

/** Keep prepared configuration and layout graphs out of public interaction results. */
export function toPublicInteractionItem(item: ChartInteractionItem): ChartInteractionItem {
    let series = seriesMetadata.get(item.series);
    if (!series) {
        const {type, id, name, custom} = item.series;
        series = {type, id, name, custom};
        seriesMetadata.set(item.series, series);
    }
    // The metadata projection preserves the series type and its corresponding point type.
    return {...item, point: getSourcePoint(item.point), series} as ChartInteractionItem;
}

export function getShapePoint<T extends object>(
    shape: object,
    points: {data: T}[],
): ChartShapePoint<T> {
    let point = shapePoints.get(shape);
    if (!point) {
        point = {kind: 'shape', points: points.map((p) => getSourcePoint(p.data))};
        shapePoints.set(shape, point);
    }
    return point as ChartShapePoint<T>;
}

/** Tests current paint geometry, not bounding boxes or the browser's topmost event target. */
export function getChartTargets(
    svg: SVGSVGElement,
    position: PointPosition,
): ChartInteractionItem[] {
    const elements = Array.from(svg.querySelectorAll<SVGGElement>('g')).flatMap(
        (plot) => layers.get(plot)?.() ?? [],
    );
    const isHit = createSvgHitTest(svg, position);
    const hits: InteractionElement[] = [];
    for (const {element, item} of elements) {
        if (!isHit(element)) continue;
        hits.push({element, item});
    }
    hits.sort((a, b) => {
        if (a.element === b.element) return 0;
        // compareDocumentPosition returns a DOM bit mask.
        // eslint-disable-next-line no-bitwise
        return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING
            ? 1
            : -1;
    });
    const seen = new Map<string, Set<ChartInteractionItem['point']>>();
    return hits.flatMap(({item}) => {
        const result = toPublicInteractionItem(item);
        let points = seen.get(result.series.id);
        if (!points) {
            points = new Set();
            seen.set(result.series.id, points);
        }
        if (points.has(result.point)) return [];
        points.add(result.point);
        return [result];
    });
}
