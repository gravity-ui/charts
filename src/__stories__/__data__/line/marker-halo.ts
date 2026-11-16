import type {ChartData} from '../../../types';

export const lineMarkerHaloData: ChartData = {
    series: {
        options: {
            line: {
                states: {
                    hover: {
                        marker: {halo: {enabled: true}},
                    },
                },
            },
        },
        data: [
            {
                type: 'line',
                name: 'Always visible',
                marker: {enabled: true},
                data: [
                    {x: 0, y: 7},
                    {x: 1, y: 7, marker: {color: '#e8590c'}},
                    {x: 2, y: 7},
                ],
            },
            {
                type: 'line',
                name: 'On hover',
                marker: {enabled: false, symbol: 'square'},
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
