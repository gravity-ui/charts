import {getFormattedValue} from '~core/utils';

import type {ChartData} from '../../../../types';

export const tooltipWithNumberFormat: ChartData = {
    series: {
        data: [
            {
                name: 'Series 1 (integer)',
                type: 'bar-y',
                stacking: 'normal',
                data: [{y: 1, x: 100}],
                tooltip: {
                    valueFormat: {
                        type: 'number',
                        precision: 0,
                    },
                },
            },
            {
                name: 'Series 2 (float with fixed precision)',
                type: 'bar-y',
                stacking: 'normal',
                data: [{y: 1, x: 100.5876}],
                tooltip: {
                    valueFormat: {
                        type: 'number',
                        precision: 2,
                    },
                },
            },
        ],
    },
    tooltip: {
        headerFormat: {
            type: 'custom',
            formatter: ({value}) => `Custom header format: ${value}`,
        },
        totals: {
            enabled: true,
            aggregation: 'sum',
            valueFormat: {
                type: 'number',
                precision: 1,
            },
        },
    },
    title: {
        text: 'Number',
    },
};

const formatBytes = ({value}: {value: unknown}) => {
    const bytes = Number(value);
    if (!Number.isFinite(bytes)) {
        return String(value);
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(
        units.length - 1,
        Math.floor(Math.log(Math.abs(bytes) || 1) / Math.log(1024)),
    );
    return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
};

export const tooltipWithCustomFormatter: ChartData = {
    series: {
        data: [
            {
                name: 'Downloaded',
                type: 'line',
                data: [
                    {x: 1, y: 512},
                    {x: 2, y: 2 * 1024},
                    {x: 3, y: 512 * 1024},
                    {x: 4, y: 5 * 1024 * 1024},
                    {x: 5, y: 120 * 1024 * 1024},
                    {x: 6, y: 1.2 * 1024 * 1024 * 1024},
                ],
                dataLabels: {
                    enabled: true,
                    format: {type: 'custom', formatter: formatBytes},
                },
            },
        ],
    },
    tooltip: {
        valueFormat: {type: 'custom', formatter: formatBytes},
    },
    yAxis: [
        {
            type: 'logarithmic',
        },
    ],
    title: {
        text: 'Bytes (custom formatter)',
    },
};

export const tooltipWithDateFormat: ChartData = (() => {
    const date = new Date('2025-10-17T13:51:01').getTime();

    return {
        series: {
            data: [
                {
                    name: 'Series 1',
                    type: 'bar-y',
                    stacking: 'normal',
                    data: [{y: date, x: 100}],
                },
                {
                    name: 'Series 2',
                    type: 'bar-y',
                    stacking: 'normal',
                    data: [{y: date, x: 20}],
                },
            ],
        },
        tooltip: {
            headerFormat: {
                type: 'custom',
                formatter: ({value}) =>
                    `Custom header format: ${getFormattedValue({
                        value: Number(value),
                        format: {
                            type: 'date',
                            format: `DD MMMM`,
                        },
                    })}`,
            },
        },
        title: {
            text: 'Date',
        },
        yAxis: [{type: 'datetime'}],
    };
})();
