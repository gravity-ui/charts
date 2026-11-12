import type {ChartData} from '../../../types';

export const lineMarkerHaloData: ChartData = {
    series: {
        options: {
            line: {
                marker: {radius: 3, symbol: 'square'},
                states: {
                    hover: {
                        marker: {radius: 5, borderWidth: 0, halo: {enabled: true}},
                    },
                },
            },
        },
        data: [
            {
                type: 'line',
                name: 'Always-visible markers',
                marker: {enabled: true},
                data: [
                    {x: 0, y: 7},
                    {x: 1, y: 7, marker: {color: '#e8590c'}},
                    {x: 2, y: 7},
                ],
            },
            {
                type: 'line',
                name: 'Hover-only markers',
                marker: {enabled: false},
                data: [
                    {x: 0, y: 3},
                    {x: 1, y: 3, color: '#7048e8'},
                    {x: 2, y: 3},
                ],
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar']},
    yAxis: [{min: 0, max: 10}],
};
