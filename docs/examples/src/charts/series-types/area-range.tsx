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
                    {x: 0, y0: 18, y1: 26},
                    {x: 1, y0: 20, y1: 29},
                    {x: 2, y0: 17, y1: 25},
                    {x: 3, y0: 19, y1: 31},
                    {x: 4, y0: 22, y1: 30},
                    {x: 5, y0: 21, y1: 28},
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
