import {color as parseColor} from 'd3-color';
import get from 'lodash/get';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import {DEFAULT_AXIS_TYPE} from '../constants';
import {i18n} from '../i18n';
import type {ChartXAxis, ChartYAxis} from '../types';

interface XYDataPoint {
    x?: unknown;
    y?: unknown;
}

interface XYValidationSeries {
    name: string;
    yAxis?: number;
    data: XYDataPoint[];
}

interface PercentStackingValidationSeries extends XYValidationSeries {
    stacking?: 'normal' | 'percent';
}

export function validatePercentStackingValues(args: {
    series: PercentStackingValidationSeries;
    valueKey: keyof XYDataPoint;
}) {
    const {series, valueKey} = args;
    if (
        series.stacking === 'percent' &&
        series.data.some((point) => {
            const value = point[valueKey];
            return typeof value === 'number' && value < 0;
        })
    ) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-percent-stacking-value', {
                key: valueKey,
                seriesName: series.name,
            }),
        });
    }
}

export function validateXYSeries(args: {
    series: XYValidationSeries;
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

    const xType = get(xAxis, 'type', DEFAULT_AXIS_TYPE);
    const yType = get(seriesYAxis, 'type', DEFAULT_AXIS_TYPE);

    series.data.forEach(({x, y}) => {
        switch (xType) {
            case 'category': {
                if (typeof x !== 'string' && typeof x !== 'number' && x !== null) {
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
                if (typeof y !== 'string' && typeof y !== 'number' && y !== null) {
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

export function validateAxisPlotValues(args: {
    series: XYValidationSeries;
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

export function validateStacking({series}: {series: {stacking?: string}}) {
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

function isValidSeriesColor(color: unknown) {
    if (color === undefined || typeof color === 'string') {
        return true;
    }

    if (typeof color !== 'object' || color === null || Array.isArray(color)) {
        return false;
    }

    const gradient = color as {angle?: unknown; stops?: unknown; type?: unknown};
    if (gradient.type !== 'linear-gradient' || !Array.isArray(gradient.stops)) {
        return false;
    }

    const {angle, stops} = gradient;
    if (angle !== undefined && (typeof angle !== 'number' || !Number.isFinite(angle))) {
        return false;
    }

    if (stops.length < 2) {
        return false;
    }

    let previousOffset = 0;
    for (const stop of stops) {
        if (typeof stop !== 'object' || stop === null || Array.isArray(stop)) {
            return false;
        }

        const {color: stopColor, offset} = stop as {color?: unknown; offset?: unknown};
        if (
            typeof stopColor !== 'string' ||
            parseColor(stopColor) === null ||
            typeof offset !== 'number' ||
            !Number.isFinite(offset) ||
            offset < previousOffset ||
            offset > 1
        ) {
            return false;
        }
        previousOffset = offset;
    }

    return true;
}

export function validateSeriesColor({color, seriesName}: {color: unknown; seriesName: string}) {
    if (!isValidSeriesColor(color)) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-color', {
                seriesName,
            }),
        });
    }
}
