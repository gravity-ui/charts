import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Price',
                interpolation: {type: 'step'},
                lineWidth: 2,
                marker: {enabled: true},
                data: [
                    {x: Date.UTC(2026, 0, 1), y: 40},
                    {x: Date.UTC(2026, 0, 5), y: 55},
                    {x: Date.UTC(2026, 0, 12), y: 45},
                    {x: Date.UTC(2026, 0, 16), y: 60},
                    {x: Date.UTC(2026, 0, 22), y: 50},
                ],
            },
        ],
    },
    xAxis: {type: 'datetime'},
    yAxis: [{title: {text: 'Price'}}],
};

export default function LineInterpolationStepExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Stepped line',
    description: 'Keep a price constant until the next recorded change.',
    docsUrl: 'pages/guides/series-types/line.html#stepped-lines',
} satisfies ExampleMeta;
