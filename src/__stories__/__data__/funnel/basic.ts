import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    const chartData: ChartData = {
        chart: {
            margin: {
                left: 40,
                right: 40,
            },
        },
        series: {
            data: [
                {
                    type: 'funnel',
                    name: 'Series 1',
                    data: [
                        {value: 100, name: 'Show'},
                        {value: 87, name: 'Click'},
                        {value: 12, name: 'Order'},
                    ],
                },
            ],
        },
        title: {
            text: 'Basic funnel chart',
        },
        legend: {enabled: true},
    };

    return chartData;
}

export const funnelBasicData = prepareData();
