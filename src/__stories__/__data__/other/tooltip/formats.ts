import type {ChartData} from '../../../../types';
import {getFormattedValue} from '../../../../utils';

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
