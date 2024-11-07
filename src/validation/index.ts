import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {DEFAULT_AXIS_TYPE, SeriesType} from '../constants';
import {i18n} from '../i18n';
import {GRAVITY_CHART_ERROR_CODE, GravityChartError} from '../libs';
import type {
    AreaSeries,
    BarXSeries,
    BarYSeries,
    ChartKitWidgetData,
    ChartKitWidgetSeries,
    ChartKitWidgetXAxis,
    ChartKitWidgetYAxis,
    LineSeries,
    PieSeries,
    ScatterSeries,
    TreemapSeries,
} from '../types';

type XYSeries = ScatterSeries | BarXSeries | BarYSeries | LineSeries | AreaSeries;

const AVAILABLE_SERIES_TYPES = Object.values(SeriesType);

const validateXYSeries = (args: {
    series: XYSeries;
    xAxis?: ChartKitWidgetXAxis;
    yAxis?: ChartKitWidgetYAxis[];
}) => {
    const {series, xAxis, yAxis = []} = args;

    const yAxisIndex = get(series, 'yAxis', 0);
    const seriesYAxis = yAxis[yAxisIndex];
    if (yAxisIndex !== 0 && typeof seriesYAxis === 'undefined') {
        throw new GravityChartError({
            code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
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
                    throw new GravityChartError({
                        code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
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
                    throw new GravityChartError({
                        code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
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
                    throw new GravityChartError({
                        code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
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
                    throw new GravityChartError({
                        code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
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
                    throw new GravityChartError({
                        code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
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
                    throw new GravityChartError({
                        code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
                        message: i18n('error', 'label_invalid-axis-linear-data-point', {
                            key: 'y',
                            seriesName: series.name,
                        }),
                    });
                }
            }
        }
    });
};

const validatePieSeries = ({series}: {series: PieSeries}) => {
    series.data.forEach(({value}) => {
        if (typeof value !== 'number') {
            throw new GravityChartError({
                code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-pie-data-value'),
            });
        }
    });
};

const validateStacking = ({series}: {series: AreaSeries | BarXSeries | BarYSeries}) => {
    const availableStackingValues = ['normal', 'percent'];

    if (series.stacking && !availableStackingValues.includes(series.stacking)) {
        throw new GravityChartError({
            code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-property', {
                key: 'stacking',
                values: availableStackingValues,
            }),
        });
    }
};

const validateTreemapSeries = ({series}: {series: TreemapSeries}) => {
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
            throw new GravityChartError({
                code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-treemap-redundant-value', {
                    id: d.id,
                    name: d.name,
                }),
            });
        }

        if (!parentIds[idOrName] && typeof d.value !== 'number') {
            throw new GravityChartError({
                code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-treemap-missing-value', {
                    id: d.id,
                    name: d.name,
                }),
            });
        }
    });
};

const validateSeries = (args: {
    series: ChartKitWidgetSeries;
    xAxis?: ChartKitWidgetXAxis;
    yAxis?: ChartKitWidgetYAxis[];
}) => {
    const {series, xAxis, yAxis} = args;

    if (!AVAILABLE_SERIES_TYPES.includes(series.type)) {
        throw new GravityChartError({
            code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-type', {
                types: AVAILABLE_SERIES_TYPES.join(', '),
            }),
        });
    }

    switch (series.type) {
        case 'area':
        case 'bar-y':
        case 'bar-x': {
            validateXYSeries({series, xAxis, yAxis});
            validateStacking({series});
            break;
        }
        case 'line':
        case 'scatter': {
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
};

const countSeriesByType = (args: {
    series: ChartKitWidgetSeries[];
    type: ChartKitWidgetSeries['type'];
}) => {
    const {series, type} = args;
    let count = 0;

    series.forEach((s) => {
        if (s.type === type) {
            count += 1;
        }
    });

    return count;
};

export const validateData = (data?: ChartKitWidgetData) => {
    if (isEmpty(data) || isEmpty(data.series) || isEmpty(data.series.data)) {
        throw new GravityChartError({
            code: GRAVITY_CHART_ERROR_CODE.NO_DATA,
            message: i18n('error', 'label_no-data'),
        });
    }

    if (data.series.data.some((s) => isEmpty(s.data))) {
        throw new GravityChartError({
            code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
            message: 'You should specify data for all series',
        });
    }

    const treemapSeriesCount = countSeriesByType({
        series: data.series.data,
        type: SeriesType.Treemap,
    });

    if (treemapSeriesCount > 1) {
        throw new GravityChartError({
            code: GRAVITY_CHART_ERROR_CODE.INVALID_DATA,
            message: 'It looks like you are trying to define more than one "treemap" series.',
        });
    }

    data.series.data.forEach((series) => {
        validateSeries({series, yAxis: data.yAxis, xAxis: data.xAxis});
    });
};
