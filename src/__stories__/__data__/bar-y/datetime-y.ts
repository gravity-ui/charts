import range from 'lodash/range';

import type {ChartData} from '../../../types';

const START_DATE = 1735689600000;
const ONE_DAY_MS = 86400000;

function prepareData(): ChartData {
    return {
        series: {
            data: [
                {
                    data: range(1, 100).map((i) => {
                        const date = START_DATE + i * ONE_DAY_MS;
                        return {x: i, y: date};
                    }),
                    name: 'Series 1',
                    type: 'bar-y',
                },
            ],
        },
        yAxis: [
            {
                type: 'datetime',
                maxPadding: 0,
            },
        ],
    };
}

export const barYDatetimeYData = prepareData();
