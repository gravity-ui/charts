export function getDistanceToSegment(args: {
    point: [number, number];
    start: [number, number];
    end: [number, number];
}) {
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

export function getDistanceToRect(args: {
    point: [number, number];
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

export function getDistanceToPolygon(args: {
    point: [number, number];
    vertices: [number, number][];
}) {
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

interface BandColumnData {
    x: number;
    y0: number;
    y1: number;
}

export type BandColumn = BandColumnData | null;

export function getDistanceToBand(args: {point: [number, number]; columns: BandColumn[]}) {
    const {point, columns} = args;
    let distance = Infinity;

    for (let i = 1; i < columns.length && distance > 0; i++) {
        const column = columns[i];
        const prev = columns[i - 1];
        if (
            !column ||
            !prev ||
            column.x === prev.x ||
            (column.y0 === column.y1 && prev.y0 === prev.y1)
        ) {
            continue;
        }
        distance = Math.min(
            distance,
            getDistanceToPolygon({
                point,
                vertices: [
                    [prev.x, prev.y0],
                    [column.x, column.y0],
                    [column.x, column.y1],
                    [prev.x, prev.y1],
                ],
            }),
        );
    }

    return distance;
}
