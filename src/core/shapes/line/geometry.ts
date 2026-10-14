import type {CurveFactory} from 'd3-shape';
import {line as lineGenerator} from 'd3-shape';

import type {DashStyle, LineCap, LineJoin} from '../../constants';
import {getDistanceToPolygon, getDistanceToSegment} from '../../utils/geometry';
import {getLineDashArray} from '../../utils/series/line';

import type {PlacementSegment} from './auto-placement';

type Coordinate = [number, number];

interface LinePoint {
    x: number | null;
    y: number | null;
    hiddenInLine?: boolean;
}

interface LineGeometryArgs {
    curveFactory?: CurveFactory;
    lineWidth: number;
    points: LinePoint[];
}

export interface LineGeometry {
    paths: Coordinate[][];
    segments: PlacementSegment[];
}

interface PolygonStroke {
    vertices: Coordinate[];
}

interface CircleStroke {
    center: Coordinate;
    radius: number;
}

type StrokeShape = PolygonStroke | CircleStroke;

interface StrokeStyle {
    lineWidth: number;
    linecap: `${LineCap}`;
    linejoin: `${LineJoin}`;
    dashStyle: DashStyle;
}

class GeometryCollector {
    readonly paths: Coordinate[][] = [];
    readonly segments: PlacementSegment[] = [];
    private path: Coordinate[] = [];
    private readonly halfWidth: number;

    constructor(lineWidth: number) {
        this.halfWidth = lineWidth / 2;
    }

    moveTo(x: number, y: number) {
        this.path = [[x, y]];
        this.paths.push(this.path);
    }

    lineTo(x: number, y: number) {
        const [x1, y1] = this.path[this.path.length - 1];
        this.segments.push({
            halfWidth: this.halfWidth,
            x1,
            y1,
            x2: x,
            y2: y,
            xMin: Math.min(x1, x),
            xMax: Math.max(x1, x),
            yMin: Math.min(y1, y),
            yMax: Math.max(y1, y),
        });
        this.path.push([x, y]);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        const [x0, y0] = this.path[this.path.length - 1];
        for (let i = 1; i <= 8; i++) {
            const t = i / 8;
            const mt = 1 - t;
            this.lineTo(
                mt * mt * x0 + 2 * mt * t * cpx + t * t * x,
                mt * mt * y0 + 2 * mt * t * cpy + t * t * y,
            );
        }
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
        const [x0, y0] = this.path[this.path.length - 1];
        for (let i = 1; i <= 8; i++) {
            const t = i / 8;
            const mt = 1 - t;
            const a = mt * mt * mt;
            const b = 3 * mt * mt * t;
            const c = 3 * mt * t * t;
            const d = t * t * t;
            this.lineTo(a * x0 + b * cp1x + c * cp2x + d * x, a * y0 + b * cp1y + c * cp2y + d * y);
        }
    }

    closePath() {}
}

export function createLineGeometryGetter(args: LineGeometryArgs): () => LineGeometry {
    let geometry: LineGeometry | undefined;
    return () => {
        if (!geometry) {
            const collector = new GeometryCollector(args.lineWidth);
            const generator = lineGenerator<LinePoint>()
                .defined((p) => p.x !== null && p.y !== null && !p.hiddenInLine)
                .x((p) => p.x as number)
                .y((p) => p.y as number)
                .context(collector as unknown as CanvasRenderingContext2D);
            if (args.curveFactory) {
                generator.curve(args.curveFactory);
            }
            generator(args.points);
            geometry = {paths: collector.paths, segments: collector.segments};
        }
        return geometry;
    };
}

export function getLineSegments(data: LineGeometryArgs[]): PlacementSegment[] {
    const segments: PlacementSegment[] = [];
    for (const item of data) {
        for (const segment of createLineGeometryGetter(item)().segments) {
            segments.push(segment);
        }
    }
    return segments;
}

function getDashedPaths(paths: Coordinate[][], style: StrokeStyle): Coordinate[][] {
    const dashArray = getLineDashArray(style.dashStyle, style.lineWidth).split(',').map(Number);
    if (!dashArray.every((value) => Number.isFinite(value) && value > 0)) {
        return paths;
    }
    const result: Coordinate[][] = [];
    for (const path of paths) {
        let dashIndex = 0;
        let remaining = dashArray[0];
        let current: Coordinate[] | undefined;
        for (let i = 1; i < path.length; i++) {
            const [x, y] = path[i - 1];
            const dx = path[i][0] - x;
            const dy = path[i][1] - y;
            const length = Math.hypot(dx, dy);
            let offset = 0;
            while (offset < length) {
                const step = Math.min(remaining, length - offset);
                if (dashIndex % 2 === 0) {
                    if (!current) {
                        current = [[x + (dx * offset) / length, y + (dy * offset) / length]];
                        result.push(current);
                    }
                    current.push([
                        x + (dx * (offset + step)) / length,
                        y + (dy * (offset + step)) / length,
                    ]);
                }
                offset += step;
                remaining -= step;
                if (remaining <= Number.EPSILON * Math.max(1, length)) {
                    current = undefined;
                    dashIndex = (dashIndex + 1) % dashArray.length;
                    remaining = dashArray[dashIndex];
                }
            }
        }
    }
    return result;
}

function getDirection(start: Coordinate, end: Coordinate): Coordinate {
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    return [(end[0] - start[0]) / length, (end[1] - start[1]) / length];
}

function prepareStroke(geometry: LineGeometry, style: StrokeStyle): StrokeShape[] {
    const result: StrokeShape[] = [];
    const halfWidth = style.lineWidth / 2;
    if (halfWidth <= 0) return result;
    for (const raw of getDashedPaths(geometry.paths, style)) {
        const path = raw.filter((point, index) =>
            index === 0 ? true : point[0] !== raw[index - 1][0] || point[1] !== raw[index - 1][1],
        );
        for (let i = 1; i < path.length; i++) {
            const start = path[i - 1];
            const end = path[i];
            const [dx, dy] = getDirection(start, end);
            result.push({
                vertices: [
                    [start[0] - dy * halfWidth, start[1] + dx * halfWidth],
                    [end[0] - dy * halfWidth, end[1] + dx * halfWidth],
                    [end[0] + dy * halfWidth, end[1] - dx * halfWidth],
                    [start[0] + dy * halfWidth, start[1] - dx * halfWidth],
                ],
            });
            if (i < path.length - 1) {
                const center = end;
                const [nextX, nextY] = getDirection(end, path[i + 1]);
                const cross = dx * nextY - dy * nextX;
                if (style.linejoin === 'round') {
                    result.push({center, radius: halfWidth});
                } else if (Math.abs(cross) > Number.EPSILON) {
                    const side = cross < 0 ? 1 : -1;
                    const a: Coordinate = [
                        center[0] - dy * halfWidth * side,
                        center[1] + dx * halfWidth * side,
                    ];
                    const b: Coordinate = [
                        center[0] - nextY * halfWidth * side,
                        center[1] + nextX * halfWidth * side,
                    ];
                    const vertices: Coordinate[] = [center, a];
                    const divisor = 1 + dx * nextX + dy * nextY;
                    const miter: Coordinate = [
                        center[0] - ((dy + nextY) * halfWidth * side) / divisor,
                        center[1] + ((dx + nextX) * halfWidth * side) / divisor,
                    ];
                    if (
                        style.linejoin !== 'bevel' &&
                        Math.hypot(miter[0] - center[0], miter[1] - center[1]) <= 4 * halfWidth
                    ) {
                        vertices.push(miter);
                    }
                    vertices.push(b);
                    result.push({vertices});
                }
            }
        }
        for (const index of path.length > 1 ? [0, path.length - 1] : [0]) {
            const center = path[index];
            if (style.linecap === 'round') {
                result.push({center, radius: halfWidth});
            } else if (style.linecap === 'square' && path.length > 1) {
                const neighbor = path[index === 0 ? 1 : index - 1];
                const [dx, dy] = getDirection(neighbor, center);
                result.push({
                    vertices: [
                        [center[0] - dy * halfWidth, center[1] + dx * halfWidth],
                        [center[0] + (dx - dy) * halfWidth, center[1] + (dy + dx) * halfWidth],
                        [center[0] + (dx + dy) * halfWidth, center[1] + (dy - dx) * halfWidth],
                        [center[0] + dy * halfWidth, center[1] - dx * halfWidth],
                    ],
                });
            }
        }
    }
    return result;
}

const strokes = new WeakMap<LineGeometry, {style: StrokeStyle; shapes: StrokeShape[]}>();

export function getDistanceToLineStroke(
    geometry: LineGeometry,
    point: Coordinate,
    style: StrokeStyle,
): number {
    if (style.lineWidth <= 0) return Infinity;
    if (style.dashStyle === 'Solid' && style.linecap === 'round' && style.linejoin === 'round') {
        let distance = Infinity;
        for (const segment of geometry.segments) {
            distance = Math.min(
                distance,
                Math.max(
                    0,
                    getDistanceToSegment({
                        point,
                        start: [segment.x1, segment.y1],
                        end: [segment.x2, segment.y2],
                    }) -
                        style.lineWidth / 2,
                ),
            );
            if (distance === 0) return distance;
        }
        for (const path of geometry.paths) {
            if (path.length === 1) {
                distance = Math.min(
                    distance,
                    Math.max(
                        0,
                        Math.hypot(point[0] - path[0][0], point[1] - path[0][1]) -
                            style.lineWidth / 2,
                    ),
                );
            }
        }
        return distance;
    }
    let stroke = strokes.get(geometry);
    if (
        !stroke ||
        stroke.style.lineWidth !== style.lineWidth ||
        stroke.style.linecap !== style.linecap ||
        stroke.style.linejoin !== style.linejoin ||
        stroke.style.dashStyle !== style.dashStyle
    ) {
        stroke = {style: {...style}, shapes: prepareStroke(geometry, style)};
        strokes.set(geometry, stroke);
    }
    let distance = Infinity;
    for (const shape of stroke.shapes) {
        distance = Math.min(
            distance,
            'vertices' in shape
                ? getDistanceToPolygon({point, vertices: shape.vertices})
                : Math.max(
                      0,
                      Math.hypot(point[0] - shape.center[0], point[1] - shape.center[1]) -
                          shape.radius,
                  ),
        );
        if (distance === 0) break;
    }
    return distance;
}
