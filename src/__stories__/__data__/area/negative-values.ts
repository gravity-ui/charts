import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'area',
                    data: [
                        {x: 0, y: 10},
                        {x: 1, y: 20},
                        {x: 2, y: -30},
                        {x: 3, y: 100},
                    ],
                    name: 'Min temperature',
                },
            ],
        },
    };
}

export const areaNegativeValuesData = prepareData();
