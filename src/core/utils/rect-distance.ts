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

/** Distance to the filled contour; zero inside or on its boundary. */
export function getRectDistance(rect: RoundedRect, x: number, y: number) {
    const {x: left, y: top, width, height, borderRadius = []} = rect;
    const right = left + width;
    const bottom = top + height;
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
