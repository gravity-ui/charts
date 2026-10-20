import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    legend: {enabled: false},
    xAxis: {
        type: 'linear',
        padding: {min: 'auto', max: 'auto'},
        title: {text: 'Quarter'},
    },
    yAxis: [{min: 0, padding: {max: 'auto'}, endOnTick: true, title: {text: 'Revenue'}}],
    series: {
        data: [
            {
                type: 'line',
                name: 'Revenue',
                marker: {enabled: true, radius: 8, borderWidth: 2},
                data: [
                    {x: 1, y: 35},
                    {x: 2, y: 50},
                    {x: 3, y: 45},
                    {x: 4, y: 80},
                ],
            },
        ],
    },
};

export default function AxisPaddingExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Room for edge markers',
    description: 'Extend free axis limits to fit edge markers.',
    docsUrl: 'pages/guides/axes/index.html#axis-padding',
} satisfies ExampleMeta;
