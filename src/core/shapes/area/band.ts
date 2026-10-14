import {getDistanceToPolygon, getDistanceToSegment} from '../../utils/geometry';
import type {Point} from '../../utils/geometry';

/** A column of a filled band; `null` breaks the band. */
export type BandColumn = {x: number; y0: number; y1: number} | null;

/**
 * Distance to a band filled between `y0` and `y1` and linearly interpolated between
 * adjacent columns; `null` columns break the band. `0` when the point is inside.
 */
export function getDistanceToBand(args: {point: Point; columns: BandColumn[]}) {
    const {point, columns} = args;
    let distance = Infinity;

    for (let i = 0; i < columns.length && distance > 0; i++) {
        const column = columns[i];
        if (!column) {
            continue;
        }
        distance = Math.min(
            distance,
            getDistanceToSegment({point, start: [column.x, column.y0], end: [column.x, column.y1]}),
        );
        const prev = columns[i - 1];
        if (prev) {
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
    }

    return distance;
}

/**
 * Splits the band boundaries into the polylines drawn by the renderer: `null` columns
 * start a new run. Returns the upper (`y1`) and lower (`y0`) runs.
 */
export function getBandBoundaries(columns: BandColumn[]) {
    const upper: Point[][] = [];
    const lower: Point[][] = [];
    let upperRun: Point[] = [];
    let lowerRun: Point[] = [];

    const flush = () => {
        if (upperRun.length) {
            upper.push(upperRun);
            lower.push(lowerRun);
        }
        upperRun = [];
        lowerRun = [];
    };

    for (const column of columns) {
        if (!column) {
            flush();
            continue;
        }
        upperRun.push([column.x, column.y1]);
        lowerRun.push([column.x, column.y0]);
    }
    flush();

    return {upper, lower};
}
