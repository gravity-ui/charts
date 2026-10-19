import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    legend: {enabled: false},
    xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar', 'Apr']},
    yAxis: [{min: 0, max: 100, title: {text: 'Orders'}}],
    series: {
        data: [
            {
                type: 'line',
                name: 'Orders',
                data: [
                    {x: 0, y: 42},
                    {x: 1, y: 65},
                    {x: 2, y: 51},
                    {x: 3, y: 73},
                ],
                marker: {enabled: true, radius: 10},
                dataLabels: {enabled: true, anchor: 'marker-edge', padding: 5},
            },
        ],
    },
};

export default function DataLabelsMarkerEdgeExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Labels outside markers',
    description: 'Measure label padding from the marker boundary.',
    docsUrl: 'pages/guides/series-types/line.html#marker-boundary',
    gallery: {
        group: 'data-labels',
    },
} satisfies ExampleMeta;
