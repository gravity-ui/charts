import type {ChartData} from '../../../types';

export const barXBordersData: ChartData = {
    series: {
        options: {'bar-x': {borderWidth: 3, borderColor: '#283593', borderRadius: 8}},
        data: [
            {
                type: 'bar-x',
                name: 'Default border',
                color: '#90caf9',
                data: [
                    {x: 'A', y: 8},
                    {x: 'B', y: 12},
                    {x: 'C', y: 6},
                ],
            },
            {
                type: 'bar-x',
                name: 'Custom border',
                color: '#a5d6a7',
                borderWidth: 2,
                borderColor: '#2e7d32',
                data: [
                    {x: 'A', y: 6},
                    {x: 'B', y: 9},
                    {x: 'C', y: 10},
                ],
            },
            {
                type: 'bar-x',
                name: 'No border',
                color: '#ffcc80',
                borderWidth: 0,
                data: [
                    {x: 'A', y: 4},
                    {x: 'B', y: 7},
                    {x: 'C', y: 8},
                ],
            },
        ],
    },
    xAxis: {type: 'category', categories: ['A', 'B', 'C']},
};
