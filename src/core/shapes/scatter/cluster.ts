import type {ScatterClusterData, ScatterSeriesData} from '../../../types';
import type {SymbolType} from '../../constants';
import type {PreparedScatterSeries} from '../../series/types';
import {calculateNumericProperty, getSymbolSize} from '../../utils';

import type {PreparedScatterData} from './types';

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
        const minY = Math.max(cell.y * gridSize + own.halfHeight, own.halfHeight);
        const maxY = Math.min(
            (cell.y + 1) * gridSize - own.halfHeight,
            boundsHeight - own.halfHeight,
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
            const radius = own.radius + blocker.radius + 0.1;
            for (let step = 0; step < 16; step++) {
                const angle = (step * Math.PI) / 8;
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

function makeCluster(
    points: PreparedScatterData[],
    series: PreparedScatterSeries,
    isOutsideBounds: (x: number, y: number) => boolean,
): PreparedScatterData {
    const x = points.reduce((sum, item) => sum + item.point.x, 0) / points.length;
    const y = points.reduce((sum, item) => sum + item.point.y, 0) / points.length;
    const sourcePoints = points.map((item) => item.point.data as ScatterSeriesData);
    const data: ScatterClusterData = {
        x: sourcePoints.reduce((sum, item) => sum + Number(item.x), 0) / points.length,
        y: sourcePoints.reduce((sum, item) => sum + Number(item.y), 0) / points.length,
        cluster: {size: points.length, points: sourcePoints},
    };
    const markerSeries: PreparedScatterSeries = {
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

    return {
        point: {
            data,
            series: markerSeries,
            x,
            y,
            opacity: null,
            color: series.cluster.marker.color ?? series.color,
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
    isOutsideBounds: (x: number, y: number) => boolean;
}): PreparedScatterData[] {
    const {data, series, boundsWidth, boundsHeight, isOutsideBounds} = args;
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
        const y = Math.floor(point.point.y / gridSize);
        const key = getCellKey(x, y);
        const cell = cells.get(key) ?? {x, y, points: []};
        cell.points.push(point);
        cells.set(key, cell);
        pointCells.set(point, cell);
    }

    const emitted = new Set<GridCell>();
    const clusters: Array<{cell: GridCell; marker: PreparedScatterData}> = [];
    const result: PreparedScatterData[] = [];

    for (const point of data) {
        const cell = pointCells.get(point);
        if (!cell || cell.points.length < series.cluster.minimumClusterSize) {
            result.push(point);
        } else if (!emitted.has(cell)) {
            const marker = makeCluster(cell.points, series, isOutsideBounds);
            result.push(marker);
            clusters.push({cell, marker});
            emitted.add(cell);
        }
    }

    if (series.cluster.overlapMode === 'shift') {
        shiftClusters(clusters, result, gridSize, boundsWidth, boundsHeight);
    }

    return result;
}
