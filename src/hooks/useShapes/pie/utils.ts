import type {CurveFactory} from 'd3';
import {curveBasis, curveLinear, pie} from 'd3';

import {getLeftPosition} from '../../../utils';

import type {PieLabelData, PreparedPieData, SegmentData} from './types';

export const pieGenerator = pie<SegmentData>()
    .value((d) => d.value)
    .sort(null);

export function getCurveFactory(data: PreparedPieData): CurveFactory | undefined {
    switch (data.connectorCurve) {
        case 'basic': {
            return curveBasis;
        }
        case 'linear': {
            return curveLinear;
        }
    }
    return undefined;
}

export function getIntersectionCheckSegment(
    connectorsPoints: [number, number][],
): [[number, number], [number, number]] {
    if (connectorsPoints.length === 3) {
        const [_, midPoint, endPoint] = connectorsPoints;
        return [midPoint, endPoint];
    }

    const [startPoint, endPoint] = connectorsPoints;

    return [startPoint, endPoint];
}

export function isLineIntersectingCircle(
    p1: [number, number],
    p2: [number, number],
    radius: number,
): boolean {
    const [x1, y1] = p1;
    const [x2, y2] = p2;

    // Case 1: If the segment lies on a line passing through the circle's center (is radial),
    // it's considered a valid connector, not an intersection

    // We check this using the 2D cross-product of the vectors from the origin to p1 and p2
    // If the cross-product is close to zero, the points are collinear with the origin
    // https://en.wikipedia.org/wiki/Cross_product#Computational_geometry
    const crossProduct = x1 * y2 - x2 * y1;

    if (Math.abs(crossProduct) < 1e-9) {
        return false;
    }

    const r2 = radius ** 2;

    // Case 2: At least one of the endpoints is inside the circle

    // https://en.wikipedia.org/wiki/Pythagorean_theorem
    const isP1Inside = x1 ** 2 + y1 ** 2 <= r2;
    const isP2Inside = x2 ** 2 + y2 ** 2 <= r2;

    if (isP1Inside || isP2Inside) {
        return true;
    }

    // Case 3: Both endpoints are outside the circle
    // We need to find the point on the line segment closest to the circle's center

    // Calculate the vector of the line segment
    // https://en.wikipedia.org/wiki/Euclidean_vector#Representation
    const dx = x2 - x1;
    const dy = y2 - y1;
    const segmentLengthSq = dx ** 2 + dy ** 2;

    // If the segment has zero length, and we know it's outside, it can't intersect
    if (segmentLengthSq === 0) {
        return false;
    }

    // `t` represents the projection of the vector (p1 -> center) onto the segment vector (p1 -> p2)
    // It's a parameter that tells us where the closest point on the infinite line lies
    // https://en.wikipedia.org/wiki/Vector_projection
    const t = (-x1 * dx - y1 * dy) / segmentLengthSq;

    let closestX: number;
    let closestY: number;

    if (t < 0) {
        // The projection is outside the segment, "before" p1. The closest point on the segment is p1
        [closestX, closestY] = p1;
    } else if (t > 1) {
        // The projection is outside the segment, "after" p2. The closest point on the segment is p2
        [closestX, closestY] = p2;
    } else {
        // The projection falls within the segment. The closest point is this projected point
        closestX = x1 + t * dx;
        closestY = y1 + t * dy;
    }

    const distanceSq = closestX ** 2 + closestY ** 2;

    return distanceSq <= r2;
}

export function isLabelIntersectingCircle(label: PieLabelData, radius: number) {
    const r2 = radius ** 2;
    const lw = label.size.width;
    const lh = label.size.height;
    const lx = getLeftPosition(label);
    const ly = label.y;
    const xMin = lx;
    const xMax = lx + lw;
    const yMin = ly;
    const yMax = ly + lh;
    const closestX = Math.max(xMin, Math.min(0, xMax));
    const closestY = Math.max(yMin, Math.min(0, yMax));
    const distanceSquared = closestX * closestX + closestY * closestY;

    return distanceSquared < r2;
}
