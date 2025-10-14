import type {ChartData} from '../../../../types';

function prepareData(): ChartData {
    return {
        legend: {
            enabled: false,
        },
        series: {
            data: new Array(50).fill(null).map((_, index) => {
                return {
                    name: `Series ${index + 1}`,
                    type: 'bar-y',
                    stacking: 'normal',
                    data: [
                        {
                            y: 0,
                            x: 1 * (index + 1),
                        },
                    ],
                };
            }),
        },
        tooltip: {
            pin: {
                enabled: true,
            },
        },
        yAxis: [
            {
                type: 'category',
                categories: ['Category'],
            },
        ],
    };
}

export const tooltipOverflowedRowsData = prepareData();
