import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    const chartData: ChartData = {
        series: {
            data: [
                {
                    type: 'funnel',
                    name: 'Series 1',
                    data: [
                        {value: 100, name: 'Visit'},
                        {value: 87, name: 'Sign-up'},
                        {value: 63, name: 'Selection'},
                        {value: 27, name: 'Purchase'},
                        {value: 12, name: 'Review'},
                    ],
                },
            ],
        },
        legend: {enabled: true},
    };

    return chartData;
}

export const funnelBasicData = prepareData();
