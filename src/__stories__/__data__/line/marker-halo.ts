import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const hoverOnlyValues = [45, 52, 38, 65, 59, 80, 74, 92];
    const alwaysVisibleValues = [60, 68, 55, 78, 70, 88, 82, 95];

    return {
        title: {text: 'Line marker halo on hover'},
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Always-visible markers',
                    data: categories.map((month, idx) => ({
                        x: month,
                        y: alwaysVisibleValues[idx],
                    })),
                    marker: {
                        enabled: true,
                    },
                },
                {
                    type: 'line',
                    name: 'Hover-only markers',
                    data: categories.map((month, idx) => ({
                        x: month,
                        y: hoverOnlyValues[idx],
                    })),
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
