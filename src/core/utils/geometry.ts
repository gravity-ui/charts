import type {LineCap} from '../constants';

export type Point = [number, number];

/** Corner radii in the CSS order: top-left, top-right, bottom-right, bottom-left. */
export type CornerRadii = [number, number, number, number];

export function getDistanceToSegment(args: {point: Point; start: Point; end: Point}) {
    const {
        point: [px, py],
        start: [x1, y1],
        end: [x2, y2],
    } = args;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    const t =
        lengthSquared === 0
            ? 0
            : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/**
 * Distance to a segment stroked with the given half width; `0` when the point is inside
 * the stroke. The caps describe how the stroke ends: `round` and `square` extend the
 * stroke by its half width beyond the segment ends, `butt` cuts it at the ends. A zero-length
 * segment is painted only by its caps, so with `butt` caps it is not painted at all.
 */
export function getDistanceToStrokedSegment(args: {
    point: Point;
    start: Point;
    end: Point;
    halfWidth: number;
    startCap: `${LineCap}`;
    endCap: `${LineCap}`;
}) {
    const {
        point: [px, py],
        start: [x1, y1],
        end: [x2, y2],
        halfWidth,
        startCap,
        endCap,
    } = args;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);

    if (length === 0) {
        const distance = Math.hypot(px - x1, py - y1);
        // A zero-length subpath is painted only by its caps.
        if (startCap === 'round') {
            return Math.max(0, distance - halfWidth);
        }
        if (startCap === 'square') {
            return getDistanceToRect({
                point: [px, py],
                x: x1 - halfWidth,
                y: y1 - halfWidth,
                width: 2 * halfWidth,
                height: 2 * halfWidth,
            });
        }
        return Infinity;
    }

    // Coordinates of the point along the segment and across it.
    const along = ((px - x1) * dx + (py - y1) * dy) / length;
    const across = Math.abs((px - x1) * dy - (py - y1) * dx) / length;

    const getCapDistance = (overshoot: number, cap: `${LineCap}`) => {
        if (cap === 'round') {
            return Math.max(0, Math.hypot(overshoot, across) - halfWidth);
        }
        const beyond = Math.max(0, overshoot - (cap === 'square' ? halfWidth : 0));
        return Math.hypot(beyond, Math.max(0, across - halfWidth));
    };

    if (along < 0) {
        return getCapDistance(-along, startCap);
    }
    if (along > length) {
        return getCapDistance(along - length, endCap);
    }
    return Math.max(0, across - halfWidth);
}

export function getDistanceToRect(args: {
    point: Point;
    x: number;
    y: number;
    width: number;
    height: number;
}) {
    const {
        point: [px, py],
        x,
        y,
        width,
        height,
    } = args;
    const dx = Math.max(Math.min(x, x + width) - px, 0, px - Math.max(x, x + width));
    const dy = Math.max(Math.min(y, y + height) - py, 0, py - Math.max(y, y + height));
    return Math.hypot(dx, dy);
}

export interface RoundedRect {
    x: number;
    y: number;
    width: number;
    height: number;
    /** Clockwise from the top left, matching getRectPath. */
    borderRadius?: number[];
}

const CORNER_DIRECTIONS = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
] as const;

/** Distance to the filled contour of a rectangle with rounded corners; zero inside or on its boundary. */
export function getRectDistance(rect: RoundedRect, x: number, y: number) {
    const {borderRadius = []} = rect;
    const left = Math.min(rect.x, rect.x + rect.width);
    const top = Math.min(rect.y, rect.y + rect.height);
    const right = left + Math.abs(rect.width);
    const bottom = top + Math.abs(rect.height);
    let outsideCorners = 0;
    let cornerDistance = Infinity;
    for (let index = 0; index < CORNER_DIRECTIONS.length; index++) {
        const radius = borderRadius[index] ?? 0;
        if (!radius) continue;
        const [dx, dy] = CORNER_DIRECTIONS[index];
        const cx = (dx === 1 ? left : right) + dx * radius;
        const cy = (dy === 1 ? top : bottom) + dy * radius;
        if ((x - cx) * dx < 0 && (y - cy) * dy < 0) {
            const distance = Math.hypot(x - cx, y - cy) - radius;
            if (distance > 0) outsideCorners++;
            cornerDistance = Math.min(cornerDistance, Math.abs(distance));
        }
    }
    // Large radii can overlap. Match the path's nonzero fill rule: crossing
    // one corner removes the fill, while crossing two restores it.
    if (outsideCorners === 1) return cornerDistance;
    return Math.hypot(Math.max(left - x, x - right, 0), Math.max(top - y, y - bottom, 0));
}

/** `getRectDistance` with the pointer passed as a point. */
export function getDistanceToRoundedRect(args: RoundedRect & {point: Point}) {
    const {point, ...rect} = args;
    return getRectDistance(rect, point[0], point[1]);
}

/** Distance to a simple polygon given by its vertices; `0` when the point is inside. */
export function getDistanceToPolygon(args: {point: Point; vertices: Point[]}) {
    const {point, vertices} = args;
    const [px, py] = point;
    let inside = false;
    let distance = Infinity;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const [xi, yi] = vertices[i];
        const [xj, yj] = vertices[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
        distance = Math.min(
            distance,
            getDistanceToSegment({point, start: vertices[j], end: vertices[i]}),
        );
    }

    return inside ? 0 : distance;
}

/**
 * Vertices of a convex polygon moved outwards by `offset` with mitered corners, which is
 * the outer contour of the polygon stroked with a width of `2 * offset`.
 */
export function offsetConvexPolygon(vertices: Point[], offset: number): Point[] {
    const count = vertices.length;
    if (count < 3 || offset === 0) {
        return vertices;
    }

    let area = 0;
    for (let i = 0, j = count - 1; i < count; j = i++) {
        area += vertices[j][0] * vertices[i][1] - vertices[i][0] * vertices[j][1];
    }
    // Outward normal of an edge: rotate the edge direction towards the outside.
    const sign = area > 0 ? 1 : -1;
    const normals = vertices.map(([x1, y1], i) => {
        const [x2, y2] = vertices[(i + 1) % count];
        const length = Math.hypot(x2 - x1, y2 - y1) || 1;
        return [(sign * (y2 - y1)) / length, (sign * (x1 - x2)) / length] as Point;
    });

    return vertices.map(([x, y], i) => {
        const [ax, ay] = normals[(i + count - 1) % count];
        const [bx, by] = normals[i];
        const scale = offset / (1 + ax * bx + ay * by);
        return [x + (ax + bx) * scale, y + (ay + by) * scale];
    });
}

/**
 * Distance to a polyline stroked with the given half width; `0` when the point is inside
 * the stroke. The caps apply to the ends of the polyline, the joins are treated as round.
 * A single vertex is painted only by its cap (`Infinity` with `butt`).
 */
export function getDistanceToStrokedPolyline(args: {
    point: Point;
    vertices: Point[];
    halfWidth: number;
    linecap: `${LineCap}`;
}) {
    const {point, vertices, halfWidth, linecap} = args;
    const last = vertices.length - 1;
    if (last < 0) {
        return Infinity;
    }
    if (last === 0) {
        return getDistanceToStrokedSegment({
            point,
            start: vertices[0],
            end: vertices[0],
            halfWidth,
            startCap: linecap,
            endCap: linecap,
        });
    }

    let distance = Infinity;
    for (let i = 0; i < last && distance > 0; i++) {
        distance = Math.min(
            distance,
            getDistanceToStrokedSegment({
                point,
                start: vertices[i],
                end: vertices[i + 1],
                halfWidth,
                startCap: i === 0 ? linecap : 'round',
                endCap: i === last - 1 ? linecap : 'round',
            }),
        );
    }
    return distance;
}
