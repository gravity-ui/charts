import {getDistanceToSegment} from '../utils/geometry';

interface RoundedRect {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius: number[];
}

export function getDistanceToRoundedRect(args: RoundedRect & {point: [number, number]}) {
    const {point, x, y, width, height, borderRadius} = args;
    if (width <= 0 || height <= 0) {
        return Infinity;
    }
    const [topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0] = borderRadius;
    const corners = [
        {center: [x + width - topRight, y + topRight], radius: topRight, angle: -Math.PI / 2},
        {
            center: [x + width - bottomRight, y + height - bottomRight],
            radius: bottomRight,
            angle: 0,
        },
        {center: [x + bottomLeft, y + height - bottomLeft], radius: bottomLeft, angle: Math.PI / 2},
        {center: [x + topLeft, y + topLeft], radius: topLeft, angle: Math.PI},
    ];
    let previous: [number, number] = [x + topLeft, y];
    let distance = Infinity;
    let winding = 0;

    function measureLine(start: [number, number], end: [number, number]) {
        distance = Math.min(distance, getDistanceToSegment({point, start, end}));
        if (start[1] > point[1] !== end[1] > point[1]) {
            const crossingX =
                start[0] + ((point[1] - start[1]) * (end[0] - start[0])) / (end[1] - start[1]);
            if (point[0] < crossingX) {
                winding += end[1] > start[1] ? 1 : -1;
            }
        }
    }

    for (const {center, radius, angle} of corners) {
        const endAngle = angle + Math.PI / 2;
        const start: [number, number] = [
            center[0] + radius * Math.cos(angle),
            center[1] + radius * Math.sin(angle),
        ];
        const end: [number, number] = [
            center[0] + radius * Math.cos(endAngle),
            center[1] + radius * Math.sin(endAngle),
        ];
        measureLine(previous, start);
        previous = end;
        if (radius === 0) {
            continue;
        }

        const dx = point[0] - center[0];
        const dy = point[1] - center[1];
        let pointerAngle = Math.atan2(dy, dx);
        if (pointerAngle < angle) {
            pointerAngle += Math.PI * 2;
        }
        const arcDistance =
            pointerAngle <= endAngle
                ? Math.abs(Math.hypot(dx, dy) - radius)
                : Math.min(
                      Math.hypot(point[0] - start[0], point[1] - start[1]),
                      Math.hypot(point[0] - end[0], point[1] - end[1]),
                  );
        distance = Math.min(distance, arcDistance);

        if (start[1] > point[1] !== end[1] > point[1]) {
            const horizontalRadius = Math.sqrt(Math.max(0, radius ** 2 - dy ** 2));
            const crossingX =
                center[0] + (angle < Math.PI / 2 ? horizontalRadius : -horizontalRadius);
            if (point[0] < crossingX) {
                winding += end[1] > start[1] ? 1 : -1;
            }
        }
    }
    measureLine(previous, [x + topLeft, y]);

    return winding === 0 ? distance : 0;
}
