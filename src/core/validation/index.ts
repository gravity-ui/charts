import isEmpty from 'lodash/isEmpty';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import {TOOLTIP_TOTALS_BUILT_IN_AGGREGATION} from '../constants';
import {i18n} from '../i18n';
import {getRegisteredSeriesTypes, getSeriesPlugin, hasSeriesPlugin} from '../series/seriesRegistry';
import type {ChartData, ChartTooltip} from '../types';

import {validateAxes} from './validate-axes';

type GetTypeOfResult = ReturnType<typeof getTypeOf>;

function getTypeOf(value: unknown) {
    return typeof value;
}

const AVAILABLE_TOOLTIP_TOTALS_BUILT_IN_AGGREGATIONS = Object.values(
    TOOLTIP_TOTALS_BUILT_IN_AGGREGATION,
);
const AVAILABLE_TOOLTIP_TOTALS_AGGREGATION_TYPES: GetTypeOfResult[] = ['function', 'string'];

function validateTooltip({tooltip}: {tooltip?: ChartTooltip}) {
    if (!tooltip) {
        return;
    }

    if (tooltip.totals) {
        const aggregation = tooltip.totals.aggregation;

        if (aggregation) {
            const aggregationType = getTypeOf(aggregation);

            if (!AVAILABLE_TOOLTIP_TOTALS_AGGREGATION_TYPES.includes(aggregationType)) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: i18n('error', 'label_invalid-tooltip-totals-aggregation-type'),
                });
            }

            if (
                typeof aggregation === 'string' &&
                !AVAILABLE_TOOLTIP_TOTALS_BUILT_IN_AGGREGATIONS.includes(aggregation)
            ) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: i18n('error', 'label_invalid-tooltip-totals-aggregation-type-str', {
                        values: AVAILABLE_TOOLTIP_TOTALS_BUILT_IN_AGGREGATIONS,
                    }),
                });
            }
        }
    }
}

export function validateData(data?: ChartData) {
    if (
        isEmpty(data) ||
        isEmpty(data.series) ||
        isEmpty(data.series.data) ||
        data.series.data.every((s) => isEmpty(s.data))
    ) {
        throw new ChartError({
            code: CHART_ERROR_CODE.NO_DATA,
            message: i18n('error', 'label_no-data'),
        });
    }

    validateAxes({xAxis: data.xAxis, yAxis: data.yAxis});
    validateTooltip({tooltip: data.tooltip});

    if (data.series.data.some((s) => isEmpty(s.data))) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: 'You should specify data for all series',
        });
    }

    data.series.data.forEach((series) => {
        if (!hasSeriesPlugin(series.type)) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-series-type', {
                    types: getRegisteredSeriesTypes().join(', '),
                }),
            });
        }

        getSeriesPlugin(series.type).validate?.({
            series,
            allSeries: data.series.data,
            xAxis: data.xAxis,
            yAxis: data.yAxis,
        });
    });
}
