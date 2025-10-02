import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {DEFAULT_AXIS_TYPE, SeriesType, TOOLTIP_TOTALS_BUILT_IN_AGGREGATION} from '../constants';
import {i18n} from '../i18n';
import {CHART_ERROR_CODE, ChartError} from '../libs';
import type {
    AreaSeries,
    BarXSeries,
    BarYSeries,
    ChartData,
    ChartSeries,
    ChartTooltip,
    ChartXAxis,
    ChartYAxis,
    LineSeries,
    PieSeries,
    ScatterSeries,
    TreemapSeries,
} from '../types';

type XYSeries = ScatterSeries | BarXSeries | BarYSeries | LineSeries | AreaSeries;
type GetTypeOfResult = ReturnType<typeof getTypeOf>;

function getTypeOf(value: unknown) {
    return typeof value;
}

const AVAILABLE_SERIES_TYPES = Object.values(SeriesType);
const AVAILABLE_TOOLTIP_TOTALS_BUILT_IN_AGGREGATIONS = Object.values(
    TOOLTIP_TOTALS_BUILT_IN_AGGREGATION,
);
const AVAILABLE_TOOLTIP_TOTALS_AGGREGATION_TYPES: GetTypeOfResult[] = ['function', 'string'];

function validateXYSeries(args: {series: XYSeries; xAxis?: ChartXAxis; yAxis?: ChartYAxis[]}) {
    const {series, xAxis, yAxis = []} = args;

    const yAxisIndex = get(series, 'yAxis', 0);
    const seriesYAxis = yAxis[yAxisIndex];
    if (yAxisIndex !== 0 && typeof seriesYAxis === 'undefined') {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-y-axis-index', {
                index: yAxisIndex,
            }),
        });
    }

    const xType = get(xAxis, 'type', DEFAULT_AXIS_TYPE);
    const yType = get(seriesYAxis, 'type', DEFAULT_AXIS_TYPE);
    series.data.forEach(({x, y}) => {
        switch (xType) {
            case 'category': {
                if (typeof x !== 'string' && typeof x !== 'number') {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_DATA,
                        message: i18n('error', 'label_invalid-axis-category-data-point', {
                            key: 'x',
                            seriesName: series.name,
                        }),
                    });
                }

                break;
            }
            case 'datetime': {
                if (typeof x !== 'number') {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_DATA,
                        message: i18n('error', 'label_invalid-axis-datetime-data-point', {
                            key: 'x',
                            seriesName: series.name,
                        }),
                    });
                }

                break;
            }
            case 'linear': {
                if (typeof x !== 'number' && x !== null) {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_DATA,
                        message: i18n('error', 'label_invalid-axis-linear-data-point', {
                            key: 'x',
                            seriesName: series.name,
                        }),
                    });
                }
            }
        }
        switch (yType) {
            case 'category': {
                if (typeof y !== 'string' && typeof y !== 'number') {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_DATA,
                        message: i18n('error', 'label_invalid-axis-category-data-point', {
                            key: 'y',
                            seriesName: series.name,
                        }),
                    });
                }

                break;
            }
            case 'datetime': {
                if (typeof y !== 'number') {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_DATA,
                        message: i18n('error', 'label_invalid-axis-datetime-data-point', {
                            key: 'y',
                            seriesName: series.name,
                        }),
                    });
                }

                break;
            }
            case 'linear': {
                if (typeof y !== 'number' && y !== null) {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_DATA,
                        message: i18n('error', 'label_invalid-axis-linear-data-point', {
                            key: 'y',
                            seriesName: series.name,
                        }),
                    });
                }
            }
        }
    });
}

function validateAxisPlotValues(args: {
    series: XYSeries;
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis[];
}) {
    const {series, xAxis, yAxis = []} = args;

    const yAxisIndex = get(series, 'yAxis', 0);
    const seriesYAxis = yAxis[yAxisIndex];
    if (yAxisIndex !== 0 && typeof seriesYAxis === 'undefined') {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-y-axis-index', {
                index: yAxisIndex,
            }),
        });
    }

    const xPlotBands = get(xAxis, 'plotBands', []);
    const yPlotBands = get(yAxis, 'plotBands', []);

    if (!xPlotBands.length && !yPlotBands.length) {
        return;
    }

    const xType = get(xAxis, 'type', DEFAULT_AXIS_TYPE);
    const yType = get(seriesYAxis, 'type', DEFAULT_AXIS_TYPE);

    xPlotBands.forEach(({from = 0, to = 0}) => {
        const fromNotEqualTo = typeof to !== typeof from;

        if (fromNotEqualTo) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_OPTION_TYPE,
                message: i18n('error', 'label_axis-plot-band-options-not-equal', {
                    axis: 'x',
                    option: 'from',
                }),
            });
        }

        switch (xType) {
            case 'category': {
                const invalidFrom = typeof from !== 'string' && typeof from !== 'number';
                const invalidTo = typeof to !== 'string' && typeof to !== 'number';
                if (invalidFrom) {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_OPTION_TYPE,
                        message: i18n('error', 'label_invalid-axis-plot-band-option', {
                            axis: 'x',
                            option: 'from',
                        }),
                    });
                }

                if (invalidTo) {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_OPTION_TYPE,
                        message: i18n('error', 'label_invalid-axis-plot-band-option', {
                            axis: 'x',
                            option: 'to',
                        }),
                    });
                }

                break;
            }
            case 'linear':
            case 'datetime': {
                const invalidFrom = typeof from !== 'number';
                const invalidTo = typeof to !== 'number';
                if (invalidFrom) {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_OPTION_TYPE,
                        message: i18n('error', 'label_invalid-axis-plot-band-option', {
                            axis: 'x',
                            option: 'from',
                        }),
                    });
                }

                if (invalidTo) {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_OPTION_TYPE,
                        message: i18n('error', 'label_invalid-axis-plot-band-option', {
                            axis: 'x',
                            option: 'to',
                        }),
                    });
                }

                break;
            }
        }
    });

    yPlotBands.forEach(({from = 0, to = 0}) => {
        const fromNotEqualTo = typeof to !== typeof from;

        if (fromNotEqualTo) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_OPTION_TYPE,
                message: i18n('error', 'label_axis-plot-band-options-not-equal', {
                    axis: 'x',
                    option: 'from',
                }),
            });
        }

        switch (yType) {
            case 'category': {
                const invalidFrom = typeof from !== 'string' && typeof from !== 'number';
                const invalidTo = typeof to !== 'string' && typeof to !== 'number';
                if (invalidFrom) {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_OPTION_TYPE,
                        message: i18n('error', 'label_invalid-axis-plot-band-option', {
                            axis: 'y',
                            option: 'from',
                        }),
                    });
                }

                if (invalidTo) {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_OPTION_TYPE,
                        message: i18n('error', 'label_invalid-axis-plot-band-option', {
                            axis: 'y',
                            option: 'to',
                        }),
                    });
                }

                break;
            }
            case 'linear':
            case 'datetime': {
                const invalidFrom = typeof from !== 'number';
                const invalidTo = typeof to !== 'number';
                if (invalidFrom) {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_OPTION_TYPE,
                        message: i18n('error', 'label_invalid-axis-plot-band-option', {
                            axis: 'y',
                            option: 'from',
                        }),
                    });
                }

                if (invalidTo) {
                    throw new ChartError({
                        code: CHART_ERROR_CODE.INVALID_OPTION_TYPE,
                        message: i18n('error', 'label_invalid-axis-plot-band-option', {
                            axis: 'y',
                            option: 'to',
                        }),
                    });
                }

                break;
            }
        }
    });
}

function validatePieSeries({series}: {series: PieSeries}) {
    series.data.forEach(({value}) => {
        if (typeof value !== 'number') {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-pie-data-value'),
            });
        }
    });
}

function validateStacking({series}: {series: AreaSeries | BarXSeries | BarYSeries}) {
    const availableStackingValues = ['normal', 'percent'];

    if (series.stacking && !availableStackingValues.includes(series.stacking)) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-property', {
                key: 'stacking',
                values: availableStackingValues,
            }),
        });
    }
}

function validateTreemapSeries({series}: {series: TreemapSeries}) {
    const parentIds: Record<string, boolean> = {};
    series.data.forEach((d) => {
        if (d.parentId && !parentIds[d.parentId]) {
            parentIds[d.parentId] = true;
        }
    });
    series.data.forEach((d) => {
        let idOrName = d.id;
        if (!idOrName) {
            idOrName = Array.isArray(d.name) ? d.name.join() : d.name;
        }

        if (parentIds[idOrName] && typeof d.value === 'number') {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-treemap-redundant-value', {
                    id: d.id,
                    name: d.name,
                }),
            });
        }

        if (!parentIds[idOrName] && typeof d.value !== 'number') {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-treemap-missing-value', {
                    id: d.id,
                    name: d.name,
                }),
            });
        }
    });
}

function validateSeries(args: {series: ChartSeries; xAxis?: ChartXAxis; yAxis?: ChartYAxis[]}) {
    const {series, xAxis, yAxis} = args;

    if (!AVAILABLE_SERIES_TYPES.includes(series.type)) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-type', {
                types: AVAILABLE_SERIES_TYPES.join(', '),
            }),
        });
    }

    switch (series.type) {
        case 'area':
        case 'bar-y':
        case 'bar-x': {
            validateAxisPlotValues({series, xAxis, yAxis});
            validateXYSeries({series, xAxis, yAxis});
            validateStacking({series});
            break;
        }
        case 'line':
        case 'scatter': {
            validateAxisPlotValues({series, xAxis, yAxis});
            validateXYSeries({series, xAxis, yAxis});
            break;
        }
        case 'pie': {
            validatePieSeries({series});
            break;
        }
        case 'treemap': {
            validateTreemapSeries({series});
        }
    }
}

function countSeriesByType(args: {series: ChartSeries[]; type: ChartSeries['type']}) {
    const {series, type} = args;
    let count = 0;

    series.forEach((s) => {
        if (s.type === type) {
            count += 1;
        }
    });

    return count;
}

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
    if (isEmpty(data) || isEmpty(data.series) || isEmpty(data.series.data)) {
        throw new ChartError({
            code: CHART_ERROR_CODE.NO_DATA,
            message: i18n('error', 'label_no-data'),
        });
    }

    validateTooltip({tooltip: data.tooltip});

    if (data.series.data.some((s) => isEmpty(s.data))) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: 'You should specify data for all series',
        });
    }

    const treemapSeriesCount = countSeriesByType({
        series: data.series.data,
        type: SeriesType.Treemap,
    });

    if (treemapSeriesCount > 1) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: 'It looks like you are trying to define more than one "treemap" series.',
        });
    }

    data.series.data.forEach((series) => {
        validateSeries({series, yAxis: data.yAxis, xAxis: data.xAxis});
    });
}
