import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'bar-y',
                name: 'Completion',
                data: [
                    {x: 8, y: 'Started', label: '8%'},
                    {x: 54, y: 'In progress', label: '54%'},
                    {x: 98, y: 'Almost done', label: '98%'},
                ],
                dataLabels: {enabled: true, placement: ['outside', 'inside-end']},
            },
        ],
    },
    xAxis: {min: 0, max: 100, startOnTick: false, endOnTick: false},
    yAxis: [{type: 'category', categories: ['Started', 'In progress', 'Almost done']}],
    legend: {enabled: false},
};

export default function BarLabelPlacementExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-Y',
    title: 'Adaptive bar labels',
    description: 'Keep labels outside short bars and move them inside near the plot edge.',
    docsUrl: 'pages/guides/series-types/bar-y.html#data-label-placement',
    gallery: {group: 'data-labels'},
} satisfies ExampleMeta;
