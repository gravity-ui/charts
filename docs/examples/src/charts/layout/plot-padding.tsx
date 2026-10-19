import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    chart: {plotPadding: {right: 'auto'}},
    legend: {enabled: false},
    xAxis: {
        type: 'linear',
        min: 1,
        max: 4,
        ticks: {values: [1, 2, 3, 4]},
        title: {text: 'Quarter'},
    },
    yAxis: [{min: 0, max: 100, title: {text: 'Revenue'}}],
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

export default function PlotPaddingExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Room for edge markers',
    description: 'Fit markers at explicit axis limits with automatic plot padding.',
    docsUrl: 'pages/guides/spacing.html#plot-padding',
} satisfies ExampleMeta;
