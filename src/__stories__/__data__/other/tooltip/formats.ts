import {getFormattedValue} from '~core/utils';

import {FORMAT_UNITS_BYTES} from '../../../../libs/format-number/presets';
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

export const tooltipWithUnits: ChartData = {
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
                    format: {
                        type: 'number',
                        precision: 1,
                        units: FORMAT_UNITS_BYTES,
                    },
                },
            },
        ],
    },
    tooltip: {
        valueFormat: {
            type: 'number',
            precision: 1,
            units: FORMAT_UNITS_BYTES,
        },
    },
    yAxis: [
        {
            type: 'logarithmic',
        },
    ],
    title: {
        text: 'Bytes (declarative units scale)',
    },
};

const REVENUE_BASELINE = 1000;

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
const deltaFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    signDisplay: 'exceptZero',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const formatRevenue = ({value}: {value: unknown}) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
        return String(value);
    }
    const delta = (amount - REVENUE_BASELINE) / REVENUE_BASELINE;
    return `${currencyFormatter.format(amount)} (${deltaFormatter.format(delta)})`;
};

export const tooltipWithCustomFormatter: ChartData = {
    series: {
        data: [
            {
                name: 'Revenue',
                type: 'line',
                data: [
                    {x: 1, y: 820},
                    {x: 2, y: 975},
                    {x: 3, y: 1000},
                    {x: 4, y: 1180},
                    {x: 5, y: 1342.5},
                    {x: 6, y: 1605.75},
                ],
                dataLabels: {
                    enabled: true,
                    format: {type: 'custom', formatter: formatRevenue},
                },
            },
        ],
    },
    tooltip: {
        valueFormat: {type: 'custom', formatter: formatRevenue},
    },
    title: {
        text: 'Revenue vs baseline (custom formatter)',
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
