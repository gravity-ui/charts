import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'area-range',
                name: 'Expected range',
                color: '#5282ff',
                opacity: 0.2,
                data: [
                    {x: 0, y0: 18, y1: 26},
                    {x: 1, y0: 20, y1: 29},
                    {x: 2, y0: 17, y1: 25},
                    {x: 3, y0: 19, y1: 31},
                    {x: 4, y0: 22, y1: 30},
                    {x: 5, y0: 21, y1: 28},
                ],
            },
            {
                type: 'line',
                name: 'Forecast',
                color: '#5282ff',
                lineWidth: 3,
                data: [
                    {x: 0, y: 22},
                    {x: 1, y: 24},
                    {x: 2, y: 21},
                    {x: 3, y: 25},
                    {x: 4, y: 26},
                    {x: 5, y: 24},
                ],
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']},
    yAxis: [{title: {text: 'Value'}}],
};

export default function AreaRangeWithLineExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Area range',
    title: 'Range with a line',
    description: 'Combine area-range and line series on shared axes.',
    docsUrl: 'pages/guides/series-types/area-range.html#combining-with-a-line',
} satisfies ExampleMeta;
