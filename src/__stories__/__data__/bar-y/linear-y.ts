import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    return {
        series: {
            data: [
                {
                    data: [
                        {y: 1, x: 1},
                        {y: 2, x: 2},
                        {y: 10, x: 10},
                    ],
                    name: 'Series 1',
                    type: 'bar-y',
                    borderColor: 'var(--g-color-base-background)',
                    borderWidth: 1,
                },
            ],
        },
        yAxis: [
            {
                type: 'linear',
                maxPadding: 0,
            },
        ],
    };
}

export const barYLinearYAxisData = prepareData();
