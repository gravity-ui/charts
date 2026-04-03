import type {PreparedYAxis} from '../useAxis/types';
import type {ZoomState} from '../useZoom/types';

export * from '~core/shapes/utils';

export function getSeriesClipPathId(args: {
    clipPathId: string;
    yAxis: PreparedYAxis[];
    zoomState?: Partial<ZoomState>;
}) {
    const {clipPathId, yAxis, zoomState} = args;
    const hasMinOrMax = yAxis.some((axis) => {
        return typeof axis?.min === 'number' || typeof axis?.max === 'number';
    });
    const hasZoom = zoomState && Object.keys(zoomState).length > 0;

    if (!hasZoom && !hasMinOrMax) {
        return `${clipPathId}-horizontal`;
    }

    return clipPathId;
}
