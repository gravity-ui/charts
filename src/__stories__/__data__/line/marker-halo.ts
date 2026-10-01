import type {ChartData, LineSeriesData} from '../../../types';

function prepareData(): ChartData {
    const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const values = [45, 52, 38, 65, 59, 80, 74, 92];
    const data: LineSeriesData[] = categories.map((month, idx) => ({
        x: month,
        y: values[idx],
    }));

    return {
        title: {text: 'Line marker halo on hover'},
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Performance',
                    data,
                    marker: {
                        enabled: false,
                    },
                },
            ],
            options: {
                line: {
                    states: {
                        hover: {
                            marker: {
                                enabled: true,
                                halo: {
                                    enabled: true,
                                    size: 10,
                                    opacity: 0.5,
                                },
                            },
                        },
                    },
                },
            },
        },
        xAxis: {
            type: 'category',
            categories,
            title: {text: 'Month'},
        },
        yAxis: [
            {
                title: {text: 'Score'},
            },
        ],
    };
}

export const lineMarkerHaloData = prepareData();
