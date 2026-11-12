import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        options: {
            line: {
                states: {
                    hover: {
                        marker: {halo: {enabled: true}},
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
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Jan', 'Feb', 'Mar'],
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
