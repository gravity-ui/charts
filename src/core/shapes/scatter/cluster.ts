import type {ScatterClusterData, ScatterSeriesData} from '../../../types';
import type {SymbolType} from '../../constants';
import type {PreparedScatterSeries} from '../../series/types';
import {calculateNumericProperty, getSymbolSize} from '../../utils';

import type {PreparedScatterData} from './types';

// Subpixel clearance keeps candidate marker strokes from visually touching.
const SHIFT_CLEARANCE_PX = 0.1;
// Finite angular sampling bounds search work and includes diagonal candidates.
const SHIFT_SEARCH_DIRECTIONS = 16;

interface GridCell {
    x: number;
    y: number;
    points: PreparedScatterData[];
}

interface OccupiedMarker {
    marker: PreparedScatterData;
    halfWidth: number;
    halfHeight: number;
    radius: number;
    isCircle: boolean;
}

function getCellKey(x: number, y: number) {
    return `${x}:${y}`;
}

function getStrokeOutset(symbolType: `${SymbolType}`, borderWidth: number) {
    switch (symbolType) {
        case 'diamond':
            return borderWidth / Math.SQRT2;
        case 'triangle':
        case 'triangle-down':
            return borderWidth;
        default:
            return borderWidth / 2;
    }
}

function getMarkerBounds(marker: PreparedScatterData) {
    const {data, series} = marker.point;
    const radius = data.radius ?? series.marker.states.normal.radius;
    const borderWidth = series.marker.states.normal.borderWidth;
    const symbolType = series.marker.states.normal.symbol;
    const {width, height} = getSymbolSize({
        symbolType,
        symbolSize: Math.PI * (radius + borderWidth) ** 2,
    });
    const strokeOutset = getStrokeOutset(symbolType, borderWidth);
    const halfWidth = width / 2 + strokeOutset;
    const halfHeight = height / 2 + strokeOutset;
    const isCircle = symbolType === 'circle';

    return {
        halfWidth,
        halfHeight,
        radius: isCircle ? halfWidth : Math.hypot(halfWidth, halfHeight),
        isCircle,
    };
}

function markersOverlap(own: OccupiedMarker, other: OccupiedMarker, x: number, y: number) {
    const dx = Math.abs(x - other.marker.point.x);
    const dy = Math.abs(y - other.marker.point.y);

    if (own.isCircle && other.isCircle) {
        return dx ** 2 + dy ** 2 < (own.radius + other.radius) ** 2;
    }

    if (!own.isCircle && !other.isCircle) {
        return dx < own.halfWidth + other.halfWidth && dy < own.halfHeight + other.halfHeight;
    }

    const circle = own.isCircle ? own : other;
    const rectangle = own.isCircle ? other : own;
    const distanceX = Math.max(0, dx - rectangle.halfWidth);
    const distanceY = Math.max(0, dy - rectangle.halfHeight);
    return distanceX ** 2 + distanceY ** 2 < circle.radius ** 2;
}

function shiftClusters(
    clusters: Array<{cell: GridCell; marker: PreparedScatterData}>,
    rendered: PreparedScatterData[],
    gridSize: number,
    boundsWidth: number,
    boundsHeight: number,
    boundsTop: number,
) {
    const occupied: OccupiedMarker[] = rendered
        .filter((marker) => !marker.clipped && marker.point.series.marker.states.normal.enabled)
        .map((marker) => ({marker, ...getMarkerBounds(marker)}));
    const occupiedByMarker = new Map(occupied.map((item) => [item.marker, item]));
    const maxRadius = occupied.reduce((max, item) => Math.max(max, item.radius), 0);
    const indexSize = Math.max(gridSize, maxRadius * 2);
    const index = new Map<string, OccupiedMarker[]>();

    function getIndexKey(x: number, y: number) {
        return getCellKey(Math.floor(x / indexSize), Math.floor(y / indexSize));
    }

    function add(item: OccupiedMarker) {
        const key = getIndexKey(item.marker.point.x, item.marker.point.y);
        const bucket = index.get(key) ?? [];
        bucket.push(item);
        index.set(key, bucket);
    }

    function getNearby(x: number, y: number) {
        const cx = Math.floor(x / indexSize);
        const cy = Math.floor(y / indexSize);
        const nearby: OccupiedMarker[] = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                nearby.push(...(index.get(getCellKey(cx + dx, cy + dy)) ?? []));
            }
        }
        return nearby;
    }

    occupied.forEach(add);

    for (const {cell, marker} of clusters) {
        const own = occupiedByMarker.get(marker);
        if (!own || !marker.point.series.marker.states.normal.enabled) {
            continue;
        }

        const originalX = marker.point.x;
        const originalY = marker.point.y;
        const minX = Math.max(cell.x * gridSize + own.halfWidth, own.halfWidth);
        const maxX = Math.min((cell.x + 1) * gridSize - own.halfWidth, boundsWidth - own.halfWidth);
        const minY = Math.max(
            boundsTop + cell.y * gridSize + own.halfHeight,
            boundsTop + own.halfHeight,
        );
        const maxY = Math.min(
            boundsTop + (cell.y + 1) * gridSize - own.halfHeight,
            boundsTop + boundsHeight - own.halfHeight,
        );
        if (minX > maxX || minY > maxY) {
            continue;
        }

        const blockers = getNearby(originalX, originalY).filter((item) => item !== own);
        const hasCollision = (x: number, y: number) =>
            getNearby(x, y).some((item) => {
                if (item === own) {
                    return false;
                }
                return markersOverlap(own, item, x, y);
            });

        if (!hasCollision(originalX, originalY)) {
            continue;
        }

        const candidates = [
            {x: originalX, y: originalY},
            {x: minX, y: minY},
            {x: minX, y: maxY},
            {x: maxX, y: minY},
            {x: maxX, y: maxY},
            {x: minX, y: originalY},
            {x: maxX, y: originalY},
            {x: originalX, y: minY},
            {x: originalX, y: maxY},
        ];

        for (const blocker of blockers) {
            const radius = own.radius + blocker.radius + SHIFT_CLEARANCE_PX;
            for (let step = 0; step < SHIFT_SEARCH_DIRECTIONS; step++) {
                const angle = (step * 2 * Math.PI) / SHIFT_SEARCH_DIRECTIONS;
                candidates.push({
                    x: blocker.marker.point.x + radius * Math.cos(angle),
                    y: blocker.marker.point.y + radius * Math.sin(angle),
                });
            }
        }

        const available = candidates
            .map(({x, y}) => ({
                x: Math.max(minX, Math.min(maxX, x)),
                y: Math.max(minY, Math.min(maxY, y)),
            }))
            .sort(
                (left, right) =>
                    (left.x - originalX) ** 2 +
                    (left.y - originalY) ** 2 -
                    (right.x - originalX) ** 2 -
                    (right.y - originalY) ** 2,
            )
            .find(({x, y}) => !hasCollision(x, y));

        if (available) {
            const oldKey = getIndexKey(originalX, originalY);
            index.set(
                oldKey,
                (index.get(oldKey) ?? []).filter((item) => item !== own),
            );
            marker.point.x = available.x;
            marker.point.y = available.y;
            add(own);
        }
    }
}

function prepareClusterMarkerSeries(series: PreparedScatterSeries): PreparedScatterSeries {
    return {
        ...series,
        marker: {
            states: {
                normal: {...series.marker.states.normal, ...series.cluster.marker},
                hover: {
                    ...series.marker.states.hover,
                    ...series.cluster.marker,
                    enabled: series.marker.states.hover.enabled && series.cluster.marker.enabled,
                },
            },
        },
    };
}

function getMean(points: PreparedScatterData[], getValue: (point: PreparedScatterData) => number) {
    const sum = points.reduce((total, point) => total + getValue(point), 0);
    if (Number.isFinite(sum)) {
        return sum / points.length;
    }
    const scale = points.reduce(
        (maximum, point) => Math.max(maximum, Math.abs(getValue(point))),
        0,
    );
    const normalizedMean =
        points.reduce((total, point) => total + getValue(point) / scale, 0) / points.length;
    return Math.max(-1, Math.min(1, normalizedMean)) * scale;
}

function makeCluster(
    points: PreparedScatterData[],
    markerSeries: PreparedScatterSeries,
    isOutsideBounds: (x: number, y: number) => boolean,
): PreparedScatterData {
    const x = getMean(points, (item) => item.point.x);
    const y = getMean(points, (item) => item.point.y);
    const sourcePoints = points.map(
        (item) => item.point.sourceData ?? (item.point.data as ScatterSeriesData),
    );
    const data: ScatterClusterData = {
        x: getMean(points, (item) => Number(item.point.data.x)),
        y: getMean(points, (item) => Number(item.point.data.y)),
        cluster: {size: points.length, points: sourcePoints},
    };
    return {
        point: {
            data,
            series: markerSeries,
            x,
            y,
            opacity: null,
            color: markerSeries.cluster.marker.color ?? markerSeries.color,
        },
        hovered: false,
        active: true,
        htmlElements: [],
        clipped: isOutsideBounds(x, y),
    };
}

export function clusterSeriesData(args: {
    data: PreparedScatterData[];
    series: PreparedScatterSeries;
    boundsWidth: number;
    boundsHeight: number;
    boundsTop?: number;
    isOutsideBounds: (x: number, y: number) => boolean;
}): PreparedScatterData[] {
    const {data, series, boundsWidth, boundsHeight, boundsTop = 0, isOutsideBounds} = args;
    if (!series.cluster.enabled) {
        return data;
    }

    const gridSize =
        calculateNumericProperty({
            value: series.cluster.layoutAlgorithm.gridSize,
            base: boundsWidth,
        }) ?? 50;
    if (!Number.isFinite(gridSize) || gridSize <= 0) {
        return data;
    }
    const cells = new Map<string, GridCell>();
    const pointCells = new Map<PreparedScatterData, GridCell>();

    for (const point of data) {
        if (point.clipped) {
            continue;
        }
        const x = Math.floor(point.point.x / gridSize);
        const y = Math.floor((point.point.y - boundsTop) / gridSize);
        const key = getCellKey(x, y);
        const cell = cells.get(key) ?? {x, y, points: []};
        cell.points.push(point);
        cells.set(key, cell);
        pointCells.set(point, cell);
    }

    const emitted = new Set<GridCell>();
    const clusters: Array<{cell: GridCell; marker: PreparedScatterData}> = [];
    const result: PreparedScatterData[] = [];
    let markerSeries: PreparedScatterSeries | undefined;

    for (const point of data) {
        const cell = pointCells.get(point);
        if (!cell || cell.points.length < series.cluster.minimumClusterSize) {
            result.push(point);
        } else if (!emitted.has(cell)) {
            markerSeries ??= prepareClusterMarkerSeries(series);
            const marker = makeCluster(cell.points, markerSeries, isOutsideBounds);
            result.push(marker);
            clusters.push({cell, marker});
            emitted.add(cell);
        }
    }

    if (series.cluster.overlapMode === 'shift') {
        shiftClusters(clusters, result, gridSize, boundsWidth, boundsHeight, boundsTop);
    }

    return result;
}
