import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'radar',
                name: 'Product A',
                categories: [
                    {key: 'Ease of use', maxValue: 5},
                    {key: 'Performance', maxValue: 5},
                    {key: 'Reliability', maxValue: 5},
                    {key: 'Support', maxValue: 5},
                    {key: 'Value', maxValue: 5},
                ],
                data: [{value: 4}, {value: 5}, {value: 4}, {value: 3}, {value: 4}],
            },
            {
                type: 'radar',
                name: 'Product B',
                data: [{value: 5}, {value: 3}, {value: 4}, {value: 4}, {value: 3}],
            },
        ],
    },
};

export default function RadarExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
