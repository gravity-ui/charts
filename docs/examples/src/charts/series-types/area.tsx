import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'area',
                name: 'Revenue',
                color: '#5b8def',
                fillColor: {
                    type: 'linear-gradient',
                    angle: 180,
                    stops: [
                        {offset: 0, color: '#5b8def'},
                        {offset: 1, color: '#dce8ff'},
                    ],
                },
                lineWidth: 2,
                opacity: 0.85,
                data: [
                    {x: 0, y: 42},
                    {x: 1, y: 58},
                    {x: 2, y: 51},
                    {x: 3, y: 73},
                    {x: 4, y: 68},
                    {x: 5, y: 84},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    yAxis: [{title: {text: 'Revenue'}}],
};

export default function AreaSeriesExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Area',
    title: 'Gradient fill',
    description: 'Give an area a gradient fill and a separate line color.',
    docsUrl: 'pages/guides/series-types/area.html#colors',
} satisfies ExampleMeta;
