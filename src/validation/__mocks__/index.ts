import type {ChartData} from '../../types';

export const XY_SERIES: Record<string, ChartData> = {
    INVALID_CATEGORY_X: {
        series: {
            data: [{type: 'scatter', data: [{x: undefined, y: 1}], name: 'Series'}],
        },
        xAxis: {type: 'category'},
    },
    INVALID_CATEGORY_Y: {
        series: {
            data: [{type: 'scatter', data: [{x: 1, y: undefined}], name: 'Series'}],
        },
        yAxis: [{type: 'category'}],
    },
    INVALID_DATETIME_X: {
        series: {
            data: [{type: 'scatter', data: [{x: undefined, y: 1}], name: 'Series'}],
        },
        xAxis: {type: 'datetime'},
    },
    INVALID_DATETIME_Y: {
        series: {
            data: [{type: 'scatter', data: [{x: undefined, y: 1}], name: 'Series'}],
        },
        yAxis: [{type: 'datetime'}],
    },
    INVALID_LINEAR_X: {
        series: {
            data: [{type: 'scatter', data: [{x: 'str', y: 1}], name: 'Series'}],
        },
    },
    INVALID_LINEAR_Y: {
        series: {
            data: [{type: 'scatter', data: [{x: 1, y: 'str'}], name: 'Series'}],
        },
    },
};

export const PIE_SERIES: Record<string, ChartData> = {
    INVALID_VALUE: {
        series: {
            // @ts-expect-error
            data: [{type: 'pie', data: [{value: undefined, name: 'Series'}]}],
        },
    },
};
