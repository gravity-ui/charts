import {i18n} from '~core/i18n';

import {CHART_ERROR_CODE, ChartError} from '../libs';
import type {
    BarSeriesDataLabelPlacementOptions,
    BarSeriesDataLabelPlacementPosition,
} from '../types';

const POSITIONS: BarSeriesDataLabelPlacementPosition[] = ['outside', 'inside-end', 'inside-center'];

export function resolveBarLabelPlacement(
    placement: BarSeriesDataLabelPlacementOptions['placement'],
): BarSeriesDataLabelPlacementPosition[] | undefined {
    return placement === 'auto' ? ['outside', 'inside-end'] : placement;
}

export function validateBarLabelPlacement(options?: BarSeriesDataLabelPlacementOptions) {
    const {placement, placementFallback} = options ?? {};
    if (
        placement !== undefined &&
        placement !== 'auto' &&
        (!Array.isArray(placement) ||
            !placement.length ||
            !Array.from(placement).every((position) => POSITIONS.includes(position)))
    ) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-property', {
                key: 'dataLabels.placement',
                values: 'auto or a nonempty array of outside, inside-end, inside-center',
            }),
        });
    }
    if (placementFallback !== undefined && !['show', 'hide'].includes(placementFallback)) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-property', {
                key: 'dataLabels.placementFallback',
                values: 'show, hide',
            }),
        });
    }
}
