import type {ChartKitWidgetData} from '../../../types';

function prepareData(): ChartKitWidgetData {
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
