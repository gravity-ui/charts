import type {PointData} from './types';

export function hasNormalMarker(point: PointData): boolean {
    return Boolean(
        !point.hiddenInLine &&
        (point.series.marker.states.normal.enabled || point.data.marker?.states?.normal?.enabled),
    );
}
