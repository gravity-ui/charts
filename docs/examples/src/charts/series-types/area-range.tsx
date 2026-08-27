import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'area-range',
                name: 'Expected range',
                color: '#5282ff',
                fillColor: '#5282ff',
                opacity: 0.35,
                lineWidth: 2,
                data: [
                    {x: 0, low: 18, high: 26},
                    {x: 1, low: 20, high: 29},
                    {x: 2, low: 17, high: 25},
                    {x: 3, low: 19, high: 31},
                    {x: 4, low: 22, high: 30},
                    {x: 5, low: 21, high: 28},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    yAxis: [{title: {text: 'Value'}}],
};

export function AreaRangeSeriesExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
