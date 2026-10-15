import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const DATA = [
    {x: 0, y: 10},
    {x: 1, y: 60},
    {x: 2, y: 20},
    {x: 3, y: 80},
    {x: 4, y: 30},
    {x: 5, y: 70},
    {x: 6, y: 40},
];

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Linear (default)',
                data: DATA,
                lineWidth: 2,
                marker: {enabled: true},
            },
            {
                type: 'line',
                name: 'Monotone',
                data: DATA,
                lineWidth: 2,
                marker: {enabled: true},
                interpolation: {type: 'monotone'},
            },
        ],
    },
    xAxis: {type: 'linear'},
};

export default function LineInterpolationMonotoneExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Monotone interpolation',
    description: 'Smooth a line without introducing extra peaks between points.',
    docsUrl: 'pages/guides/series-types/line.html#line-interpolation',
} satisfies ExampleMeta;
