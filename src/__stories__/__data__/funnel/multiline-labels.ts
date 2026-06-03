import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    const chartData: ChartData = {
        series: {
            data: [
                {
                    type: 'funnel',
                    name: 'Series 1',
                    dataLabels: {preserveLineBreaks: true},
                    data: [
                        {value: 100, name: 'Visit', label: 'Visit\nWebsite'},
                        {value: 87, name: 'Sign-up', label: 'Sign-up\nForm'},
                        {value: 63, name: 'Selection', label: 'Product\nSelection'},
                        {value: 27, name: 'Purchase', label: 'Purchase\nComplete'},
                        {value: 12, name: 'Review', label: 'Leave\nReview'},
                    ],
                },
            ],
        },
        legend: {enabled: false},
    };

    return chartData;
}

export const funnelMultilineLabelsData = prepareData();
