import type {ChartData} from '../../../types';

export const scatterClusteringData: ChartData = {
    series: {
        data: [
            {
                type: 'scatter',
                name: 'Observations',
                color: '#3072F3',
                cluster: {
                    enabled: true,
                    distance: 42,
                    minimumClusterSize: 2,
                    marker: {
                        color: '#1F5DC9',
                        radius: 10,
                    },
                },
                data: [
                    {x: 1, y: 2, custom: {id: 'a'}},
                    {x: 1.12, y: 2.08, custom: {id: 'b'}},
                    {x: 1.2, y: 1.95, custom: {id: 'c'}},
                    {x: 4, y: 6, custom: {id: 'd'}},
                    {x: 4.08, y: 6.12, custom: {id: 'e'}},
                    {x: 8, y: 3, custom: {id: 'f'}},
                ],
            },
        ],
    },
    xAxis: {
        min: 0,
        max: 9,
    },
    yAxis: [
        {
            min: 0,
            max: 7,
        },
    ],
};
