import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        options: {
            line: {
                marker: {radius: 3},
                states: {
                    hover: {
                        marker: {
                            radius: 8,
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            halo: {enabled: true},
                        },
                    },
                },
            },
        },
        data: [
            {
                type: 'line',
                name: 'Revenue',
                marker: {enabled: true},
                data: [
                    {x: 0, y: 42},
                    {x: 1, y: 58},
                    {x: 2, y: 51},
                    {x: 3, y: 73},
                    {x: 4, y: 68},
                    {x: 5, y: 84},
                ],
            },
            {
                type: 'line',
                name: 'Costs',
                marker: {enabled: false},
                data: [
                    {x: 0, y: 24},
                    {x: 1, y: 32},
                    {x: 2, y: 29},
                    {x: 3, y: 45},
                    {x: 4, y: 40},
                    {x: 5, y: 55},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    yAxis: [{title: {text: 'Amount'}}],
};

export default function LineMarkersExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Point markers',
    description: 'Compare always-visible and hover-only markers with a halo on hover.',
    docsUrl: 'pages/guides/series-types/line.html#markers',
} satisfies ExampleMeta;
