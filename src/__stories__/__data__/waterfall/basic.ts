import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    const data = [
        {y: 97, x: '2024'},
        {y: 10, x: 'revenue'},
        {y: -20, x: 'fixed costs'},
        {y: -15, x: 'variable expenses'},
        {total: true, x: '2025'},
    ];

    return {
        series: {
            data: [
                {
                    type: 'waterfall',
                    data,
                    name: 'Profit',
                    legend: {
                        itemText: {
                            positive: 'income',
                            negative: 'outcome',
                            totals: 'totals',
                        },
                    },
                },
            ],
        },
        xAxis: {
            type: 'category',
            categories: data.map((d) => d.x),
        },
        legend: {enabled: true},
    };
}

export const waterfallBasicData = prepareData();
